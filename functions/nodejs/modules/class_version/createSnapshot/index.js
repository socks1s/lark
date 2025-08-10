/**
 * @description 创建快照云函数，用于记录数据变更的快照信息
 * @param {Object} params - 参数对象
 * @param {string} params.currentData - 当前数据（JSON字符串格式）
 * @param {string} params.previousData - 之前数据（JSON字符串格式）
 * @param {string} params.ObjectApiName - 对象API名称
 * @param {string} params.changeReason - 变更原因
 * @param {string} params.changeType - 变更类型：manualCreate, manualEdit, SystemEdit, other, systemCreate
 * @param {number} [params.flowId] - 流程ID（可选）
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回创建结果和快照信息
 */
module.exports = async function (params, context, logger) {
    logger.info('【创建快照函数】开始执行');
    
    const { 
        currentData, 
        previousData, 
        ObjectApiName, 
        changeReason, 
        changeType, 
        flowId 
    } = params;
    
    logger.info("入参:", JSON.stringify(params, null, 2));
    
    // 1. 入参校验
    let parsedCurrentData;
    let parsedPreviousData;
    
    // 校验并解析 currentData
    if (!currentData || typeof currentData !== 'string') {
        logger.error("currentData参数必须为非空JSON字符串");
        throw new Error("currentData参数必须为非空JSON字符串");
    }
    
    try {
        parsedCurrentData = JSON.parse(currentData);
    } catch (error) {
        logger.error("currentData参数不是有效的JSON格式");
        throw new Error("currentData参数不是有效的JSON格式");
    }

    logger.info("currentData参数:", parsedCurrentData);
    // return 0
    
    // 判断是否为更新操作
    let isUpdate = false;
    
    // 校验并解析 previousData
    if (previousData && previousData !== null && previousData !== undefined && previousData !== '') {
        if (typeof previousData !== 'string') {
            logger.error("previousData参数必须为JSON字符串格式");
            throw new Error("previousData参数必须为JSON字符串格式");
        }
        
        try {
            parsedPreviousData = JSON.parse(previousData);
            isUpdate = true; // 有 previousData 说明是更新操作
            logger.info("检测到 previousData，判断为更新操作");
        } catch (error) {
            logger.error("previousData参数不是有效的JSON格式");
            throw new Error("previousData参数不是有效的JSON格式");
        }
    } else {
        // previousData 为空，说明是创建操作
        parsedPreviousData = null;
        isUpdate = false;
        logger.info("previousData 为空，判断为创建操作");
    }

    if (!ObjectApiName || typeof ObjectApiName !== 'string') {
        logger.error("ObjectApiName参数必须为非空字符串");
        throw new Error("ObjectApiName参数必须为非空字符串");
    }

    // recordId 从 currentData 中获取 _id 字段
    let numericRecordId;
    if (parsedCurrentData._id) {
        if (typeof parsedCurrentData._id === 'number') {
            numericRecordId = parsedCurrentData._id;
        } else if (typeof parsedCurrentData._id === 'string' && !isNaN(Number(parsedCurrentData._id))) {
            numericRecordId = Number(parsedCurrentData._id);
        } else {
            logger.error("currentData 中的 _id 字段必须为数字格式或可转换为数字的字符串");
            throw new Error("currentData 中的 _id 字段必须为数字格式或可转换为数字的字符串");
        }
        logger.info("从 currentData 中获取到记录ID:", numericRecordId);
    } else {
        logger.error("currentData 中缺少 _id 字段，无法获取记录ID");
        throw new Error("currentData 中缺少 _id 字段，无法获取记录ID");
    }

    // 从 currentData 中获取 initiator
    let initiator;
    if (parsedCurrentData._updatedBy) {
        initiator = {"_id":parseInt(parsedCurrentData._updatedBy._id)};
        logger.info("从 currentData 中获取到发起人信息:", JSON.stringify(initiator, null, 2));
    } else {
        logger.error("currentData 中缺少 _updatedBy 字段，无法获取发起人信息");
        throw new Error("currentData 中缺少 _updatedBy 字段，无法获取发起人信息");
    }
    // return 0;

    if (!changeReason || typeof changeReason !== 'string') {
        logger.error("changeReason参数必须为非空字符串");
        throw new Error("changeReason参数必须为非空字符串");
    }

    const validChangeTypes = ['manualCreate', 'manualEdit', 'SystemEdit', 'other', 'systemCreate'];
    if (!changeType || !validChangeTypes.includes(changeType)) {
        logger.error(`changeType参数必须为以下值之一: ${validChangeTypes.join(', ')}`);
        throw new Error(`changeType参数必须为以下值之一: ${validChangeTypes.join(', ')}`);
    }

    if (flowId !== undefined && flowId !== null && typeof flowId !== 'number') {
        logger.error("flowId参数必须为数字格式或为空");
        throw new Error("flowId参数必须为数字格式或为空");
    }

    try {
        logger.info(`开始创建快照，对象: ${ObjectApiName}, 记录ID: ${numericRecordId}`);

        // 2. 获取快照版本号
        const newSnapshotVersion = await getLatestSnapshotVersion(ObjectApiName, numericRecordId, isUpdate, logger);
        
        // 3. 准备快照数据
        const snapshotData = {
            recordId: numericRecordId,
            ObjectApiName: ObjectApiName,
            snapshotVersion: newSnapshotVersion,
            currentData: currentData, // 保持原始JSON字符串格式
            previousData: previousData, // 保持原始JSON字符串格式
            initiator: initiator, // 将initiator对象转为JSON字符串
            changeReason: changeReason,
            changeType: changeType
        };
    
        // 4. 如果提供了flowId，则添加到快照数据中
        if (flowId !== undefined && flowId !== null) {
            snapshotData.flowId = flowId;
        }

        logger.info('准备创建快照数据:', JSON.stringify(snapshotData, null, 2));

        // 5. 创建快照记录
        const createdSnapshot = await application.data.object('snapshot').create(snapshotData);
        
        logger.info('快照创建成功，快照ID:', createdSnapshot._id);
        logger.info('创建的快照信息:', JSON.stringify(createdSnapshot, null, 2));

        // 6. 返回成功结果
        return {
            status: 'success',
            message: '快照创建成功',
            snapshotId: createdSnapshot._id,
            snapshotVersion: newSnapshotVersion,
            snapshot: createdSnapshot,
            ObjectApiName: ObjectApiName,
            recordId: numericRecordId,
            changeType: changeType,
            initiator: initiator
        };

    } catch (error) {
        logger.error("创建快照过程中出现错误:", error);
        
        // 返回错误信息
        return {
            status: 'error',
            message: `创建快照失败: ${error.message}`,
            snapshotId: null,
            snapshotVersion: null,
            snapshot: null,
            ObjectApiName: ObjectApiName,
            recordId: numericRecordId,
            changeType: changeType,
            initiator: initiator || null,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        };
    }
}

/**
 * @description 获取最新快照版本号并递增
 * @param {string} objectApiName - 对象API名称
 * @param {number} recordId - 记录ID
 * @param {boolean} isUpdate - 是否为更新操作
 * @param {Logger} logger - 日志记录器
 * @return {number} 新的快照版本号
 */
async function getLatestSnapshotVersion(objectApiName, recordId, isUpdate, logger) {
    // 根据操作类型确定版本号
    if (isUpdate) {
        // 更新操作：获取最新版本号并递增
        logger.info('调用 getLatestRecordVersion 函数查询当前最新版本号...');
        const versionResult = await faas.function("getLatestSnapshotVersion").invoke({
            objectApiName: objectApiName,
            recordId: recordId
        });

        logger.info("versionResult:", versionResult);
       
        // 处理版本查询结果并计算新版本号
        let newSnapshotVersion;
        if (versionResult.status === 'success' && versionResult.latestVersion !== null && versionResult.latestVersion !== undefined) {
            newSnapshotVersion = versionResult.latestVersion + 1;
            logger.info(`基于现有版本 ${versionResult.latestVersion} 计算新快照版本号: ${newSnapshotVersion}`);
        } else if (versionResult.status === 'success' && (versionResult.latestVersion === null || versionResult.latestVersion === undefined)) {
            // 成功查询但没有找到版本记录，说明是第一个版本
            newSnapshotVersion = 1;
            logger.info('未找到现有版本记录，新快照版本号设为: 1');
        } else {
            logger.error('获取版本号失败:', versionResult.message);
            throw new Error(`获取版本号失败: ${versionResult.message}`);
        }
        
        return newSnapshotVersion;
    } else {
        // 创建操作：直接设置版本号为1
        logger.info('创建操作，新快照版本号设为: 1');
        return 1;
    }
}