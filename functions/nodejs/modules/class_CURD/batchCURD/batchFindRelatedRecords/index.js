/**
 * @description 批量查询关联记录 - 查询父记录关联的子记录列表
 * @param {Object} params - 参数对象
 * @param {string} params.parentFieldApiName - 父表关联字段API名称
 * @param {Object} params.parentRecord - 父表记录对象，必须包含_id字段
 * @param {string} params.childObjectApiName - 子表API名称
 * @param {Array<string>} params.selectChildFields - 子表字段API名称数组，可选
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回查询结果 {totalCount: number, relatedRecords: Array}
 */
module.exports = async function (params, context, logger) {
    logger.info("开始执行批量查询关联记录函数");
    // 参数解构
    const { parentFieldApiName, childObjectApiName, selectChildFields } = params;
    
    // 解析parentRecord JSON字符串
    let parentRecord;
    try {
        parentRecord = typeof params.parentRecord === 'string' 
            ? JSON.parse(params.parentRecord) 
            : params.parentRecord;
    } catch (e) {
        throw new Error("parentRecord参数格式错误，无法解析为JSON对象");
    }
    
    logger.info(`参数校验开始，parentFieldApiName: ${parentFieldApiName}, parentRecord: ${JSON.stringify(parentRecord)}, childObjectApiName: ${childObjectApiName}, selectChildFields: ${selectChildFields}`);
    // 参数校验
    if (!parentFieldApiName || typeof parentFieldApiName !== 'string') {
        throw new Error("parentFieldApiName必须为非空字符串");
    }

    if (!parentRecord || typeof parentRecord !== 'object' || !parentRecord._id) {
        throw new Error("parentRecord必须为非空JSON对象且包含有效的_id字段");
    }

    if (!childObjectApiName || typeof childObjectApiName !== 'string') {
        throw new Error("childObjectApiName必须为非空字符串");
    }

    // 处理parentRecord._id，确保是有效的整数
    let parentId;
    try {
        parentId = parseInt(parentRecord._id); // 转换为整数形式
        if (isNaN(parentId)) {
            throw new Error("无法转换为有效整数");
        }
    } catch (e) {
        throw new Error("parentRecord._id必须是有效的整数或可转为整数的字符串");
    }

    logger.info(`参数校验通过，parentId: ${parentId}, childObjectApiName: ${childObjectApiName}, selectChildFields: ${selectChildFields}`);

    // 处理selectChildFields，空时默认查询_id
    const selectFields = selectChildFields && Array.isArray(selectChildFields)
        ? selectChildFields.filter(field => typeof field === 'string') 
        : ['_id'];

    logger.info(`开始查询关联记录: parentId=${parentId}, childObject=${childObjectApiName}, fields=${selectFields.join(',')}`);

    try {
        // 先获取总记录数
        logger.info(`开始查询关联记录总数: parentId=${parentId}, childObject=${childObjectApiName},parentFieldApiName=${parentFieldApiName}`);
        const totalCount = await application.data.object(childObjectApiName)
            .where({
                [parentFieldApiName]: { "_id": parentId } // 使用整数形式的ID
            })
            .count();
        logger.info(`总关联记录数totalCount: ${totalCount}`);

        const relatedRecords = [];
        const batchSize = 200; // 平台单次查询限制
        let offset = 0;
        let remaining = totalCount;
// let remaining = 5;
        // 分批查询所有记录
        while (remaining > 0) {
            const currentBatchSize = Math.min(batchSize, remaining);
            logger.info(`正在查询第${offset}到${offset + currentBatchSize}条记录`);

            const batchRecords = await application.data.object(childObjectApiName)
                .select(...selectFields)
                .where({
                    [parentFieldApiName]: { "_id": parentId } // 使用整数形式的ID
                })
                .offset(offset)
                .limit(currentBatchSize)
                .find();

            relatedRecords.push(...batchRecords);
            offset += currentBatchSize;
            remaining -= currentBatchSize;
        }

        logger.info(`成功查询到${totalCount}条关联记录`);

        return {
            totalCount,
            relatedRecords
        };
    } catch (error) {
        logger.error("查询关联记录失败", error);
        throw new Error("查询关联记录过程中出现错误");
    }
};

/*
函数名： batchFindRelatedRecords

入参/校验：
- parentFieldApiName ：非空，类型：字符串，若出错：抛出异常并结束函数
- parentRecord ： 非空， 类型： json（注意：不要选为Record），schema：object，若不是object则报错，并且这个object内部必须包含一个_id字段，并且这个_id字段的值必须是整数or可以被解析成整数的string ，若出错：抛出异常并结束函数
- childObjectApiName ：非空，类型：字符串，若出错：抛出异常并结束函数
- selectChildFields : 
  - 如果它为空：则它的类型可以是null/""/undefined，若出错：抛出异常并结束函数
  - 如果它非空：则它的类型必须是[]类型，并且里面的元素必须是非空的string，若出错：抛出异常并结束函数

函数体（功能）：
- 本函数功能简介：传入父记录给本函数，获取到这个父记录对应的子记录列表。
- 依赖的函数：本函数是对以下这个官方函数的二次封装：application.data.object(childObjectApiName).select(selectChildFields).where({[parentFieldApiName]: { _id: parentRecord._id }}).find();
- selectChildFields空值的处理： 如果此入参为空，那么默认select「_id」字段，如果入参非空，则按要求select字段。
- 注意平台的 find() 函数有单次操作的限制，所以需要分批处理。

 
出参：
- totalCount 类型int，查找到的总条数
- relatedRecords: 类型json（注意：不要选为RecordList），详细类型是一个array，查找到的记录列表
*/