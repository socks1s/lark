/**
 * 🚀 智能主子表数据提交引擎 - 飞书云函数版本（增强版：支持事务前后ID变化追踪）
 * 
 * 核心特性：
 * - 自适应策略选择：≤500条原子提交，>500条分批提交
 * - 智能数据分类：自动区分新增/更新记录
 * - 容错处理：支持空子表、无效记录过滤
 * - 性能优化：批量操作、事务复用
 * - ID变化追踪：记录事务前后ID的转换过程
 * 
 * @param {Object} params - 云函数参数对象
 * @param {Object} params.parentRecord - 主表记录对象
 * @param {Array} params.childRecords - 子表记录数组
 * @param {string} params.parentFieldName - 主表关联字段API名称
 * @param {string} params.parentObjectApiName - 主表API名称
 * @param {string} params.childObjectApiName - 子表API名称
 * @param {Object} [params.context={}] - 扩展上下文
 * @param {Object} context - 云函数上下文对象
 * @param {Object} logger - 云函数日志器对象
 * @returns {Promise<Object>} 返回对象包含以下字段：
 *   - strategy: 执行策略 ('PARENT_ONLY' | 'ATOMIC' | 'BATCH')
 *   - committedParent: 已提交的主表记录
 *   - committedChildren: 已提交的子表记录数组（完整记录）
 *   - committedChildRecordList: 已提交的子表记录ID数组（仅包含_id字段）
 *   - totalProcessed: 总处理记录数
 *   - transactionCount: 事务数量
 *   - batchCount?: 批次数量（仅BATCH策略）
 *   - childStats?: 子记录统计（created/updated数量）
 *   - idTransformation?: ID转换追踪信息
 */
module.exports = async function (params, context, logger) {
    // 从 params 对象中获取业务参数
    const { 
        parentRecord, 
        childRecords, 
        parentFieldName, 
        parentObjectApiName, 
        childObjectApiName
    } = params;

    logger.info('params:', params);

    logger.info('🚀 启动智能主子表数据提交引擎');
    
    try {
     
        // 1. 参数验证与预处理
        const validChildRecords = _validateAndSanitize({ parentRecord, parentFieldName, parentObjectApiName, childObjectApiName, childRecords, logger });
        //   return 0
        // 2. 策略路由：空子表 → 仅主表处理
        logger.info("ddd");
        if (validChildRecords.length === 0) {
            logger.info('📋 路由选择：仅主表处理模式');
            // return 0
            const tx = application.data.newTransaction();
            const isUpdate = !!parentRecord._id;
            const operation = isUpdate ? 'registerUpdate' : 'registerCreate';
            const preCommittedParent = tx.object(parentObjectApiName)[operation](parentRecord);
            await tx.commit();
            
            logger.info('✅ 仅主表处理完成');
            
            return {
                strategy: 'PARENT_ONLY',
                committedParent: preCommittedParent,
                committedChildren: [],
                committedChildRecordList: [],
                totalProcessed: 1,
                transactionCount: 1
            };
        }
        logger.info("子表空")
          
        // 3. 策略路由：智能选择原子/分批提交
        const totalRecords = 1 + validChildRecords.length;
        const strategy = totalRecords <= 500 ? 'ATOMIC' : 'BATCH';
        
        logger.info(`📊 路由选择：${strategy}策略 (总计${totalRecords}条记录)`);
/**************************************************************************/
        if (strategy === 'ATOMIC') {
            // 原子策略：单一事务处理
            logger.info('⚡ 执行原子策略：单一事务处理');
            
            const tx = application.data.newTransaction();
            
            // ID转换追踪对象
            const idTransformation = {
                parent: { before: null, after: null },
                children: { before: [], after: [], transformations: [] }
            };
    /**************************************************************************/
            // 1. 主表预注册
            const isUpdate = !!parentRecord._id;
            const operation = isUpdate ? 'registerUpdate' : 'registerCreate';
            const preCommittedParent = tx.object(parentObjectApiName)[operation](parentRecord);
            
            // 记录主表事务前ID状态
            idTransformation.parent.before = isUpdate ? parentRecord._id : null;
            
            logger.info(`📝 主表预注册完成(${isUpdate ? '更新' : '新增'})`);
    /**************************************************************************/
            // 2. 建立主子关联（使用原始父记录，因为预注册的记录在提交前只是UUID）
            const relatedChildren = _establishParentChildRelation(parentRecord, validChildRecords, parentFieldName, logger);
    /**************************************************************************/
            // 3. 子表数据分类与批量预注册
            const createRecords = [];
            const updateRecords = [];
            // 3.1 数据分类
            relatedChildren.forEach((record, index) => {
                if (!record || typeof record !== 'object') {
                    logger.warn(`⚠️ 跳过无效子记录[${index}]:`, record);
                    return;
                }
                (record._id ? updateRecords : createRecords).push(record);
            });
            
            logger.info(`🔄 数据分类完成: 新增${createRecords.length}条, 更新${updateRecords.length}条`);
            
            const preCommittedChildren = [];
            let createRegisterResult = null; // 保存registerBatchCreate的返回值引用
            let updateRegisterResult = null; // 保存registerBatchUpdate的返回值引用
            //3.1数据分类已完成，分为有ID，和无ID的子记录
            // 3.2 批量预注册
            // 批量新增
            if (createRecords.length > 0) {
                // 3.2.1 批量「新增」，如果length大于1，使用registerBatchCreate
                createRegisterResult = tx.object(childObjectApiName).registerBatchCreate(createRecords);
                logger.info(`🔍 registerBatchCreate 返回值类型: ${typeof createRegisterResult}`);
                logger.info(`🔍 registerBatchCreate 返回值是否为数组: ${Array.isArray(createRegisterResult)}`);
                logger.info(`🔍 registerBatchCreate 返回值内容:`, JSON.stringify(createRegisterResult, null, 2));
                
                // 重要：registerBatchCreate 返回的是引用，事务提交后会自动更新为真实ID
                if (Array.isArray(createRegisterResult)) {
                    preCommittedChildren.push(...createRegisterResult);
                } else if (createRegisterResult) {
                    preCommittedChildren.push(createRegisterResult);
                }
                logger.info(`✅ 子表新增预注册: ${createRecords.length}条`);
                logger.info(`🔍 新增记录引用地址: ${createRegisterResult.map ? createRegisterResult.map((item, i) => `[${i}]: ${typeof item}`) : typeof createRegisterResult}`);
            }
            
            // 批量更新
            if (updateRecords.length > 0) {
                updateRegisterResult = tx.object(childObjectApiName).registerBatchUpdate(updateRecords);
                logger.info(`🔍 registerBatchUpdate 返回值类型: ${typeof updateRegisterResult}`);
                logger.info(`🔍 registerBatchUpdate 返回值是否为数组: ${Array.isArray(updateRegisterResult)}`);
                logger.info(`🔍 registerBatchUpdate 返回值内容:`, JSON.stringify(updateRegisterResult, null, 2));
                
                // registerBatchUpdate 可能返回 undefined，此时我们需要手动添加更新记录
                if (Array.isArray(updateRegisterResult)) {
                    preCommittedChildren.push(...updateRegisterResult);
                } else if (updateRegisterResult) {
                    preCommittedChildren.push(updateRegisterResult);
                } else {
                    // 如果返回 undefined，手动添加更新记录（保持原有ID）
                    logger.info('🔧 registerBatchUpdate 返回 undefined，手动添加更新记录');
                    preCommittedChildren.push(...updateRecords);
                }
                logger.info(`✅ 子表更新预注册: ${updateRecords.length}条`);
            }

            logger.info(`🔍 preCommittedChildren 总数: ${preCommittedChildren.length}`);
            logger.info(`🔍 preCommittedChildren 内容:`, JSON.stringify(preCommittedChildren, null, 2));

            // 记录子表事务提交前的ID状态
            const childrenIdsBeforeCommit = preCommittedChildren.map((child, index) => {
                const id = child._id || child.id || child;
                // 判断记录类型：如果有_id且在updateRecords中找到，则为update；否则为create
                let recordType = 'create';
                if (child._id) {
                    // 检查是否在更新记录中
                    const isInUpdateRecords = updateRecords.some(r => r._id === child._id);
                    if (isInUpdateRecords) {
                        recordType = 'update';
                    }
                }
                
                return {
                    id: id,
                    isUuid: typeof id === 'string' && id.includes('-'),
                    type: recordType
                };
            });
            
            idTransformation.children.before = childrenIdsBeforeCommit;
            
            logger.info('📤 【事务提交前】子表ID状态:', JSON.stringify(childrenIdsBeforeCommit, null, 2));

            // 4. 原子提交，之后所有ID都已经变成真实的了
            await tx.commit();
            logger.info('✅ 原子策略执行成功');

            // 获取提交后的真实父记录
            let committedParent = null;
            
            // 对于更新操作，registerUpdate 可能返回 undefined，需要使用原始记录
            if (isUpdate) {
                // 更新操作：使用原始记录的ID，因为 registerUpdate 通常不返回有用的结果
                committedParent = parentRecord;
                idTransformation.parent.after = parentRecord._id;
                logger.info('📋 更新操作：使用原始父记录作为提交结果');
            } else {
                // 新增操作：尝试从事务返回值获取
                if (preCommittedParent && preCommittedParent._id) {
                    committedParent = preCommittedParent;
                    idTransformation.parent.after = preCommittedParent._id;
                    logger.info('📋 新增操作：从事务返回值获取父记录');
                } else {
                    logger.warn('📋 新增操作：事务返回值无效，无法获取父记录ID');
                }
            }
            
            logger.info(`📋 父记录提交结果: ${committedParent ? `ID=${committedParent._id}` : '无有效ID'}`);

            // 记录子表事务提交后的ID状态
            const childrenIdsAfterCommit = preCommittedChildren.map((child, index) => {
                let id;
                
                // 关键：直接从registerBatchCreate的返回值引用中获取ID
                if (index < (createRegisterResult ? (Array.isArray(createRegisterResult) ? createRegisterResult.length : 1) : 0)) {
                    // 这是新增记录，从createRegisterResult获取
                    if (Array.isArray(createRegisterResult)) {
                        id = createRegisterResult[index];
                    } else {
                        id = createRegisterResult;
                    }
                } else {
                    // 这是更新记录，从updateRegisterResult或原记录获取
                    if (updateRegisterResult && Array.isArray(updateRegisterResult)) {
                        const updateIndex = index - (createRegisterResult ? (Array.isArray(createRegisterResult) ? createRegisterResult.length : 1) : 0);
                        id = updateRegisterResult[updateIndex];
                    } else {
                        id = child._id || child.id || child;
                    }
                }
                
                const beforeInfo = childrenIdsBeforeCommit[index];
                return {
                    id: id,
                    isNumber: typeof id === 'number',
                    type: beforeInfo ? beforeInfo.type : 'unknown'
                };
            });
            
            idTransformation.children.after = childrenIdsAfterCommit;
            
            // 生成转换详情
            idTransformation.children.transformations = childrenIdsBeforeCommit.map((before, index) => {
                const after = childrenIdsAfterCommit[index];
                return {
                    index: index,
                    before: before.id,
                    after: after ? after.id : null,
                    transformed: before.id !== (after ? after.id : null),
                    type: before.type,
                    fromUuid: before.isUuid,
                    toNumber: after ? after.isNumber : false
                };
            });
            
            logger.info('🔍 【事务提交后】子表ID状态:', JSON.stringify(childrenIdsAfterCommit, null, 2));
            logger.info('🔄 【ID转换分析】:', JSON.stringify(idTransformation.children.transformations, null, 2));

            // 5. 从事务返回值获取已入库的ID
            const committedChildRecordList = preCommittedChildren.filter(child => child && child._id).map(child => ({ _id: child._id }));

            // 更新committedChildren为真实ID
            const committedChildren = [];
            if (createRegisterResult && Array.isArray(createRegisterResult)) {
                committedChildren.push(...createRegisterResult);
            } else if (createRegisterResult) {
                committedChildren.push(createRegisterResult);
            }
            
            if (updateRegisterResult && Array.isArray(updateRegisterResult)) {
                committedChildren.push(...updateRegisterResult);
            } else if (updateRegisterResult) {
                committedChildren.push(updateRegisterResult);
            } else if (updateRecords.length > 0) {
                // 如果updateRegisterResult为undefined，使用原记录的ID
                committedChildren.push(...updateRecords.map(r => r._id));
            }

            return {
                strategy: 'ATOMIC',
                committedParent: committedParent,
                committedChildren: committedChildren,
                committedChildRecordList: committedChildRecordList,
                totalProcessed: 1 + committedChildren.length,
                transactionCount: 1,
                childStats: {
                    created: createRecords.length,
                    updated: updateRecords.length
                },
                idTransformation: idTransformation
            };
            
        } else {
            // 分批策略：多事务处理
            logger.info('🔄 执行分批策略：多事务处理');
            
            // ID转换追踪对象
            const idTransformation = {
                parent: { before: null, after: null },
                children: { before: [], after: [], transformations: [] }
            };
            
            const BATCH_SIZE = 500;
            let transactionCount = 0;
            const childStats = { created: 0, updated: 0 };
            
            // 1. 独立提交主表
            const isUpdate = !!parentRecord._id;
            idTransformation.parent.before = isUpdate ? parentRecord._id : null;
            
            const parentTx = application.data.newTransaction();
            const operation = isUpdate ? 'registerUpdate' : 'registerCreate';
            const preCommittedParent = parentTx.object(parentObjectApiName)[operation](parentRecord);
            await parentTx.commit();
            transactionCount++;
            
            // 获取提交后的父记录
            let committedParent = null;
            if (isUpdate) {
                committedParent = parentRecord;
                idTransformation.parent.after = parentRecord._id;
                logger.info('📋 更新操作：使用原始父记录作为提交结果');
            } else {
                if (preCommittedParent && preCommittedParent._id) {
                    committedParent = preCommittedParent;
                    idTransformation.parent.after = preCommittedParent._id;
                    logger.info('📋 新增操作：从事务返回值获取父记录');
                } else {
                    logger.warn('📋 新增操作：事务返回值无效，无法获取父记录ID');
                }
            }
            
            logger.info('✅ 主表独立提交完成');
            
            // 2. 建立主子关联
            const relatedChildren = _establishParentChildRelation(committedParent, validChildRecords, parentFieldName, logger);
            
            // 3. 子表数据分类
            const createRecords = [];
            const updateRecords = [];
            
            relatedChildren.forEach((record, index) => {
                if (!record || typeof record !== 'object') {
                    logger.warn(`⚠️ 跳过无效子记录[${index}]:`, record);
                    return;
                }
                (record._id ? updateRecords : createRecords).push(record);
            });
            
            logger.info(`🔄 数据分类完成: 新增${createRecords.length}条, 更新${updateRecords.length}条`);
            
            // 4. 分批提交子表
            const allCommittedChildren = [];
            let batchCount = 0;
            
            // 4.1 分批处理新增记录
            if (createRecords.length > 0) {
                const createBatchCount = Math.ceil(createRecords.length / BATCH_SIZE);
                batchCount += createBatchCount;
                
                for (let i = 0; i < createBatchCount; i++) {
                    const start = i * BATCH_SIZE;
                    const end = Math.min(start + BATCH_SIZE, createRecords.length);
                    const batch = createRecords.slice(start, end);
                    
                    const batchTx = application.data.newTransaction();
                    const batchCommitted = batchTx.object(childObjectApiName).registerBatchCreate(batch);
                    
                    // 记录事务提交前的UUID状态
                    const batchCommittedArray = Array.isArray(batchCommitted) ? batchCommitted : [batchCommitted];
                    const batchIdsBeforeCommit = batchCommittedArray.map((child, index) => {
                        const id = child._id || child.id || child;
                        return {
                            index: allCommittedChildren.length + index,
                            id: id,
                            isUuid: typeof id === 'string' && id.includes('-'),
                            type: 'create'
                        };
                    });
                    
                    logger.info(`📤 【新增批次${i + 1}事务提交前】子表ID状态:`, JSON.stringify(batchIdsBeforeCommit, null, 2));
                    
                    await batchTx.commit();
                    transactionCount++;
                    
                    // 记录事务提交后的真实ID状态
                    const batchIdsAfterCommit = batchCommittedArray.map((child, index) => {
                        const id = child._id || child.id || child;
                        return {
                            index: allCommittedChildren.length + index,
                            id: id,
                            isNumber: typeof id === 'number',
                            type: 'create'
                        };
                    });
                    
                    logger.info(`🔍 【新增批次${i + 1}事务提交后】子表ID状态:`, JSON.stringify(batchIdsAfterCommit, null, 2));
                    
                    // 添加到总的追踪数组
                    idTransformation.children.before.push(...batchIdsBeforeCommit);
                    idTransformation.children.after.push(...batchIdsAfterCommit);
                    
                    if (Array.isArray(batchCommitted)) {
                        allCommittedChildren.push(...batchCommitted);
                    } else {
                        allCommittedChildren.push(batchCommitted);
                    }
                    logger.info(`✅ 新增第${i + 1}/${createBatchCount}批提交完成: ${batch.length}条`);
                }
                childStats.created = createRecords.length;
            }
            
            // 4.2 分批处理更新记录
            if (updateRecords.length > 0) {
                const updateBatchCount = Math.ceil(updateRecords.length / BATCH_SIZE);
                batchCount += updateBatchCount;
                
                for (let i = 0; i < updateBatchCount; i++) {
                    const start = i * BATCH_SIZE;
                    const end = Math.min(start + BATCH_SIZE, updateRecords.length);
                    const batch = updateRecords.slice(start, end);
                    
                    // 记录事务提交前的状态（更新记录已有真实ID）
                    const batchIdsBeforeCommit = batch.map((record, index) => ({
                        index: allCommittedChildren.length + index,
                        id: record._id,
                        isUuid: false,
                        type: 'update'
                    }));
                    
                    logger.info(`📤 【更新批次${i + 1}事务提交前】子表ID状态:`, JSON.stringify(batchIdsBeforeCommit, null, 2));
                    
                    const batchTx = application.data.newTransaction();
                    const batchCommitted = batchTx.object(childObjectApiName).registerBatchUpdate(batch);
                    await batchTx.commit();
                    transactionCount++;
                    
                    const batchCommittedArray = Array.isArray(batchCommitted) ? batchCommitted : [batchCommitted];
                    
                    // 记录事务提交后的状态（更新操作ID不变）
                    const batchIdsAfterCommit = batchCommittedArray.map((child, index) => {
                        const id = child._id || child.id || batch[index]._id;
                        return {
                            index: allCommittedChildren.length + index,
                            id: id,
                            isNumber: typeof id === 'number',
                            type: 'update'
                        };
                    });
                    
                    logger.info(`🔍 【更新批次${i + 1}事务提交后】子表ID状态:`, JSON.stringify(batchIdsAfterCommit, null, 2));
                    
                    // 添加到总的追踪数组
                    idTransformation.children.before.push(...batchIdsBeforeCommit);
                    idTransformation.children.after.push(...batchIdsAfterCommit);
                    
                    if (Array.isArray(batchCommitted)) {
                        allCommittedChildren.push(...batchCommitted);
                    } else {
                        allCommittedChildren.push(batchCommitted);
                    }
                    logger.info(`✅ 更新第${i + 1}/${updateBatchCount}批提交完成: ${batch.length}条`);
                }
                childStats.updated = updateRecords.length;
            }
            
            // 生成转换详情
            idTransformation.children.transformations = idTransformation.children.before.map((before, index) => {
                const after = idTransformation.children.after[index];
                return {
                    index: before.index,
                    before: before.id,
                    after: after ? after.id : null,
                    transformed: before.id !== (after ? after.id : null),
                    type: before.type,
                    fromUuid: before.isUuid,
                    toNumber: after ? after.isNumber : false
                };
            });
            
            logger.info('🔄 【ID转换分析】:', JSON.stringify(idTransformation.children.transformations, null, 2));
            logger.info('✅ 分批策略执行成功');
            
            // 从事务返回值获取已入库的ID
            const committedChildRecordList = allCommittedChildren.filter(child => child && child._id).map(child => ({ _id: child._id }));
            
            return {
                strategy: 'BATCH',
                committedParent: committedParent,
                committedChildren: allCommittedChildren,
                committedChildRecordList: committedChildRecordList,
                totalProcessed: 1 + allCommittedChildren.length,
                transactionCount: transactionCount,
                batchCount: batchCount,
                childStats: childStats,
                idTransformation: idTransformation
            };
        }
            
    } catch (error) {
        logger.error('❌ 智能提交引擎执行失败:', error);
        throw new Error(`智能提交失败: ${error.message}`);
    }
};

// ==================== 🔧 核心工具函数 ====================

/**
 * 参数验证与数据清洗
 */
function _validateAndSanitize({ parentRecord, parentFieldName, parentObjectApiName, childObjectApiName, childRecords, logger }) {
    const validations = [
        { value: parentRecord, name: '主表记录', check: v => v && typeof v === 'object' },
        { value: parentFieldName, name: '主表关联字段名', check: v => v && typeof v === 'string' },
        { value: parentObjectApiName, name: '主表API名称', check: v => v && typeof v === 'string' },
        { value: childObjectApiName, name: '子表API名称', check: v => v && typeof v === 'string' }
    ];
    
    validations.forEach(({ value, name, check }) => {
        if (!check(value)) throw new Error(`${name}参数无效`);
    });
    
    // 子记录数据清洗验证
    if (!childRecords || !Array.isArray(childRecords) || childRecords.length === 0) {
        return [];
    }
    
    const validRecords = childRecords.filter(record => record && typeof record === 'object');
    const filteredCount = childRecords.length - validRecords.length;
    
    if (filteredCount > 0) {
        logger.warn(`🧹 数据清洗：过滤了${filteredCount}条无效子记录`);
    }
    
    return validRecords;
}

/**
 * 主子表关联处理器 - 内联实现
 */
function _establishParentChildRelation(parentRecord, childRecords, parentFieldName, logger) {
    logger.info(`开始处理子记录关联，共${childRecords.length}条记录`);

    // 遍历子记录列表，为每条记录添加父表关联字段
    const updatedChildRecordList = childRecords.map(childRecord => {
        // 创建新的子记录对象，避免修改原始对象
        const updatedRecord = { ...childRecord };
        // 添加父表关联字段
        updatedRecord[parentFieldName] = { id: parentRecord._id };
        return updatedRecord;
    });

    logger.info(`🔗 主子关联完成: ${updatedChildRecordList.length}条子记录`);
    return updatedChildRecordList;
}
