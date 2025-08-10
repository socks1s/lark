/**
 * @description 通用子表测试数据获取函数 - 支持获取单条或多条子表记录用于测试
 * @param {Object} params - 参数对象
 * @param {string} params.objectApiName - 子表对象API名称，必填
 * @param {string} [params.parentObjectApiName] - 父表对象API名称，用于关联查询
 * @param {string|Array<string>} [params.recordIds] - 记录ID或ID数组，用于精确查询
 * @param {string|Array<string>} [params.parentRecordIds] - 父记录ID或ID数组，用于查询特定父记录的子表数据
 * @param {Array<string>} [params.selectFields] - 需要查询的字段列表，默认查询所有字段
 * @param {Object} [params.conditions] - 查询条件对象，支持复杂查询
 * @param {number} [params.limit] - 限制返回记录数，默认100，最大200
 * @param {number} [params.offset] - 偏移量，用于分页查询，默认0
 * @param {string} [params.orderBy] - 排序字段，默认按_id排序
 * @param {string} [params.orderDirection] - 排序方向，'asc'或'desc'，默认'asc'
 * @param {boolean} [params.returnSingle] - 是否只返回单条记录，默认false
 * @param {boolean} [params.includeParentInfo] - 是否包含父记录信息，默认false
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回查询结果
 */
module.exports = async function (params, context, logger) {
    try {
        // 参数解构和默认值设置
        const {
            objectApiName,
            parentObjectApiName,
            recordIds,
            parentRecordIds,
            selectFields,
            conditions = {},
            limit = 100,
            offset = 0,
            orderBy = '_id',
            orderDirection = 'asc',
            returnSingle = false,
            includeParentInfo = false
        } = params;

        // 必填参数校验
        if (!objectApiName || typeof objectApiName !== 'string' || objectApiName.trim() === '') {
            throw new Error("objectApiName参数必须为非空字符串");
        }

        // 可选参数校验
        if (parentObjectApiName && (typeof parentObjectApiName !== 'string' || parentObjectApiName.trim() === '')) {
            throw new Error("parentObjectApiName参数必须为非空字符串");
        }

        if (selectFields && !Array.isArray(selectFields)) {
            throw new Error("selectFields参数必须为字符串数组");
        }

        if (recordIds && !Array.isArray(recordIds) && typeof recordIds !== 'string') {
            throw new Error("recordIds参数必须为字符串或字符串数组");
        }

        if (parentRecordIds && !Array.isArray(parentRecordIds) && typeof parentRecordIds !== 'string') {
            throw new Error("parentRecordIds参数必须为字符串或字符串数组");
        }

        if (typeof limit !== 'number' || limit <= 0 || limit > 200) {
            throw new Error("limit参数必须为1-200之间的数字");
        }

        if (typeof offset !== 'number' || offset < 0) {
            throw new Error("offset参数必须为非负数");
        }

        if (!['asc', 'desc'].includes(orderDirection)) {
            throw new Error("orderDirection参数必须为'asc'或'desc'");
        }

        logger.info(`开始获取${objectApiName}子表对象的测试数据`);
        logger.info(`查询参数: limit=${limit}, offset=${offset}, orderBy=${orderBy}, orderDirection=${orderDirection}`);
        
        if (parentObjectApiName) {
            logger.info(`关联父表: ${parentObjectApiName}`);
        }

        // 构建查询对象
        let query = application.data.object(objectApiName);

        // 设置查询字段
        if (selectFields && selectFields.length > 0) {
            // 验证字段名格式
            const validFields = selectFields.filter(field => 
                typeof field === 'string' && field.trim() !== ''
            );
            if (validFields.length === 0) {
                throw new Error("selectFields中必须包含至少一个有效的字段名");
            }
            query = query.select(...validFields);
            logger.info(`指定查询字段: ${validFields.join(', ')}`);
        } else {
            logger.info("查询所有字段");
        }

        // 构建查询条件
        let whereConditions = { ...conditions };

        // 处理parentRecordIds参数 - 查询特定父记录的子表数据
        if (parentRecordIds) {
            const parentIds = Array.isArray(parentRecordIds) ? parentRecordIds : [parentRecordIds];
            // 验证父记录ID格式
            const validParentIds = parentIds.filter(id => {
                if (typeof id === 'string' && id.trim() !== '') return true;
                if (typeof id === 'number' && !isNaN(id)) return true;
                return false;
            });

            if (validParentIds.length === 0) {
                throw new Error("parentRecordIds中必须包含至少一个有效的父记录ID");
            }

            logger.info(`按父记录ID查询: ${validParentIds.join(', ')}`);

            // 根据父记录ID查询子表数据
            if (validParentIds.length === 1) {
                // 假设子表通过parentId字段关联父表，实际字段名可能需要调整
                whereConditions.parentId = validParentIds[0];
            } else {
                // 多个父记录ID使用$in操作符
                whereConditions.parentId = { $in: validParentIds };
            }
        }

        // 处理recordIds参数 - 分别查询每个ID
        if (recordIds) {
            const ids = Array.isArray(recordIds) ? recordIds : [recordIds];
            // 验证ID格式
            const validIds = ids.filter(id => {
                if (typeof id === 'string' && id.trim() !== '') return true;
                if (typeof id === 'number' && !isNaN(id)) return true;
                return false;
            });

            if (validIds.length === 0) {
                throw new Error("recordIds中必须包含至少一个有效的ID");
            }

            logger.info(`按子表记录ID查询: ${validIds.join(', ')}`);

            // 对于多个ID，分别查询然后合并结果
            if (validIds.length === 1) {
                whereConditions._id = validIds[0];
                logger.info(`查询条件: ${JSON.stringify(whereConditions)}`);
            } else {
                // 多个ID需要分别查询
                logger.info("多个ID查询，将分别执行查询后合并结果");
                const allRecords = [];
                
                for (const id of validIds) {
                    try {
                        let singleQuery = application.data.object(objectApiName);
                        
                        // 设置查询字段
                        if (selectFields && selectFields.length > 0) {
                            const validFields = selectFields.filter(field => 
                                typeof field === 'string' && field.trim() !== ''
                            );
                            singleQuery = singleQuery.select(...validFields);
                        }
                        
                        // 构建单个ID的查询条件
                        const singleConditions = { ...conditions, _id: id };
                        if (parentRecordIds) {
                            const parentIds = Array.isArray(parentRecordIds) ? parentRecordIds : [parentRecordIds];
                            const validParentIds = parentIds.filter(pid => {
                                if (typeof pid === 'string' && pid.trim() !== '') return true;
                                if (typeof pid === 'number' && !isNaN(pid)) return true;
                                return false;
                            });
                            if (validParentIds.length === 1) {
                                singleConditions.parentId = validParentIds[0];
                            } else if (validParentIds.length > 1) {
                                singleConditions.parentId = { $in: validParentIds };
                            }
                        }
                        
                        // 查询单个ID
                        const record = await singleQuery.where(singleConditions).findOne();
                        if (record) {
                            allRecords.push(record);
                        }
                    } catch (error) {
                        logger.warn(`查询子表记录ID ${id} 时出错: ${error.message}`);
                    }
                }
                
                logger.info(`成功获取${allRecords.length}条子表记录`);
                
                return {
                    success: true,
                    data: returnSingle ? (allRecords[0] || null) : allRecords,
                    isSingle: returnSingle,
                    totalCount: allRecords.length,
                    currentCount: allRecords.length,
                    hasMore: false,
                    queryInfo: {
                        objectApiName,
                        parentObjectApiName,
                        selectFields: selectFields || "all",
                        recordIds: validIds,
                        parentRecordIds: parentRecordIds || null,
                        queryType: "multipleIds",
                        includeParentInfo
                    }
                };
            }
        }

        // 应用查询条件
        if (Object.keys(whereConditions).length > 0) {
            query = query.where(whereConditions);
            logger.info(`查询条件: ${JSON.stringify(whereConditions)}`);
        }

        // 设置排序
        if (orderDirection === 'desc') {
            query = query.orderBy(`-${orderBy}`);
        } else {
            query = query.orderBy(orderBy);
        }

        // 设置分页
        query = query.offset(offset).limit(limit);

        // 执行查询
        let records;
        let totalCount = 0;

        if (returnSingle) {
            // 返回单条记录
            const record = await query.findOne();
            logger.info(record ? "成功获取单条子表记录" : "未找到匹配的子表记录");
            
            // 如果需要包含父记录信息
            let enrichedRecord = record;
            if (record && includeParentInfo && parentObjectApiName && record.parentId) {
                try {
                    const parentRecord = await application.data.object(parentObjectApiName)
                        .where({ _id: record.parentId })
                        .findOne();
                    if (parentRecord) {
                        enrichedRecord = {
                            ...record,
                            _parentInfo: parentRecord
                        };
                        logger.info("已包含父记录信息");
                    }
                } catch (parentError) {
                    logger.warn("获取父记录信息失败", parentError);
                }
            }
            
            return {
                success: true,
                data: enrichedRecord,
                isSingle: true,
                totalCount: record ? 1 : 0,
                queryInfo: {
                    objectApiName,
                    parentObjectApiName,
                    selectFields: selectFields || "all",
                    conditions: whereConditions,
                    limit,
                    offset,
                    orderBy,
                    orderDirection,
                    includeParentInfo
                }
            };
        } else {
            // 返回多条记录
            records = await query.find();
            
            // 如果需要总数统计（当有分页时）
            if (offset > 0 || records.length === limit) {
                try {
                    totalCount = await application.data.object(objectApiName)
                        .where(whereConditions)
                        .count();
                } catch (countError) {
                    logger.warn("获取总数失败，使用当前批次数量", countError);
                    totalCount = records.length;
                }
            } else {
                totalCount = records.length;
            }

            logger.info(`成功获取${records.length}条子表记录，总数: ${totalCount}`);
            
            // 如果需要包含父记录信息
            let enrichedRecords = records;
            if (records.length > 0 && includeParentInfo && parentObjectApiName) {
                try {
                    // 收集所有父记录ID
                    const parentIds = [...new Set(records
                        .filter(record => record.parentId)
                        .map(record => record.parentId)
                    )];
                    
                    if (parentIds.length > 0) {
                        // 批量查询父记录
                        const parentRecords = await application.data.object(parentObjectApiName)
                            .where({ _id: { $in: parentIds } })
                            .find();
                        
                        // 创建父记录映射
                        const parentMap = {};
                        parentRecords.forEach(parent => {
                            parentMap[parent._id] = parent;
                        });
                        
                        // 为子记录添加父记录信息
                        enrichedRecords = records.map(record => {
                            if (record.parentId && parentMap[record.parentId]) {
                                return {
                                    ...record,
                                    _parentInfo: parentMap[record.parentId]
                                };
                            }
                            return record;
                        });
                        
                        logger.info(`已为${enrichedRecords.filter(r => r._parentInfo).length}条记录包含父记录信息`);
                    }
                } catch (parentError) {
                    logger.warn("批量获取父记录信息失败", parentError);
                }
            }
            
            // 输出详细的记录信息用于调试
            if (enrichedRecords.length > 0) {
                logger.info("子表记录详情:", JSON.stringify(enrichedRecords, null, 2));
            }

            return {
                success: true,
                data: enrichedRecords,
                isSingle: false,
                totalCount,
                currentCount: enrichedRecords.length,
                hasMore: offset + enrichedRecords.length < totalCount,
                queryInfo: {
                    objectApiName,
                    parentObjectApiName,
                    selectFields: selectFields || "all",
                    conditions: whereConditions,
                    limit,
                    offset,
                    orderBy,
                    orderDirection,
                    includeParentInfo
                }
            };
        }

    } catch (error) {
        logger.error("获取子表测试数据时出错", error);
        
        // 返回错误信息
        return {
            success: false,
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                details: error.stack
            },
            data: null,
            queryInfo: {
                objectApiName: params.objectApiName,
                parentObjectApiName: params.parentObjectApiName,
                selectFields: params.selectFields,
                conditions: params.conditions,
                includeParentInfo: params.includeParentInfo
            }
        };
    }
};

/*
函数设计说明：

1. 功能特性：
   - 专门针对子表数据查询设计
   - 支持按父记录ID查询子表数据
   - 支持包含父记录信息的关联查询
   - 支持单条和多条记录查询
   - 支持字段选择查询
   - 支持复杂查询条件
   - 支持分页和排序
   - 支持按子表记录ID精确查询
   - 完整的参数校验
   - 详细的日志记录
   - 统一的返回格式

2. 参数说明：
   - objectApiName: 必填，子表对象API名称
   - parentObjectApiName: 可选，父表对象API名称
   - recordIds: 可选，支持单个子表记录ID或ID数组
   - parentRecordIds: 可选，支持单个父记录ID或ID数组
   - selectFields: 可选，指定查询字段
   - conditions: 可选，复杂查询条件
   - limit/offset: 分页参数
   - orderBy/orderDirection: 排序参数
   - returnSingle: 是否只返回单条记录
   - includeParentInfo: 是否包含父记录信息

3. 返回格式：
   - success: 操作是否成功
   - data: 查询结果数据（可能包含_parentInfo字段）
   - isSingle: 是否为单条记录
   - totalCount: 总记录数
   - currentCount: 当前返回记录数
   - hasMore: 是否还有更多数据
   - queryInfo: 查询信息
   - error: 错误信息（失败时）

4. 使用场景：
   - 子表测试数据准备
   - 父子关联数据验证
   - 子表批量数据处理
   - 子表API测试
   - 关联查询测试

5. 注意事项：
   - 假设子表通过parentId字段关联父表，实际使用时可能需要调整字段名
   - includeParentInfo功能会增加查询开销，建议按需使用
   - 批量查询父记录信息时会自动去重，提高查询效率
*/