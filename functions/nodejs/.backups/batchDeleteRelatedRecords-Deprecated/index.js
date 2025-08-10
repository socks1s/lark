//注意：
//有主-明细关系的表单，如果父删除了，子自动会删除，无需做批量删除，故此函数无需实现


/**
 * @description 批量删除与父记录关联的子记录
 * @param {Object} params - 参数对象
 * @param {string} params.parentFieldApiName - 父表关联字段API名称
 * @param {Object} params.parentRecord - 父表记录对象，必须包含_id字段
 * @param {string} params.childObjectApiName - 子表API名称
 * @param {Object} context - 上下文参数
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回删除操作的统计信息和错误详情
 */
module.exports = async function (params, context, logger) {
    // 构造入参
    const { parentFieldApiName, childObjectApiName } = params;
    
    // 解析parentRecord JSON字符串
    let parentRecord;
    try {
        parentRecord = typeof params.parentRecord === 'string' 
            ? JSON.parse(params.parentRecord) 
            : params.parentRecord;
    } catch (e) {
        throw new Error("parentRecord参数格式错误，无法解析为JSON对象");
    }
    
    logger.info('batchDeleteRelatedRecords函数开始执行');

    // 初始化返回结果
    const result = {
        totalCount: 0,
        invalidCount: 0,
        validCount: 0,
        deleteSuccessCount: 0,
        deleteFailCount: 0,
        fullSuccess: false,
        deleteSuccessList: [],
        deleteFailList: [],
        invalidList: [],
        findRelatedRecordsResult: null // 添加查找关联记录的结果
    };

    try {
        // 1. 参数校验
        logger.info("开始参数校验");
        
        if (!parentFieldApiName || typeof parentFieldApiName !== 'string') {
            throw new Error("parentFieldApiName参数不能为空且必须是字符串");
        }

        if (!parentRecord || typeof parentRecord !== 'object' || !parentRecord._id) {
            throw new Error("parentRecord必须为非空JSON对象且包含有效的_id字段");
        }

        if (!childObjectApiName || typeof childObjectApiName !== 'string') {
            throw new Error("childObjectApiName参数不能为空且必须是字符串");
        }

        // 验证parentRecord._id是否为有效的整数
        let parentId;
        try {
            parentId = BigInt(parentRecord._id).toString();
        } catch (e) {
            throw new Error("parentRecord._id必须是有效的整数或可转为整数的字符串");
        }

        logger.info(`参数校验通过，父记录ID: ${parentId}, 子表ApiName: ${childObjectApiName}`);

        // 2. 调用batchFindRelatedRecords查找关联记录
        logger.info("开始查找关联记录");
        
        const findParams = {
            parentFieldApiName: parentFieldApiName,
            parentRecord: parentRecord,
            childObjectApiName: childObjectApiName,
            selectChildFields: ['_id'] // 只需要_id字段用于删除
        };

        const findResult = await faas.function("batchFindRelatedRecords").invoke(findParams);
        result.findRelatedRecordsResult = findResult;

        if (!findResult || !findResult.relatedRecords) {
            throw new Error("查找关联记录失败或返回结果无效");
        }

        logger.info(`找到${findResult.totalCount}条关联记录`);

        // 如果没有找到关联记录，直接返回成功
        if (findResult.totalCount === 0) {
            logger.info("没有找到关联记录，无需删除");
            result.fullSuccess = true;
            return result;
        }

        // 3. 准备删除参数，将关联记录转换为删除所需的格式
        const recordList = findResult.relatedRecords.map(record => ({
            _id: record._id
        }));

        result.totalCount = recordList.length;
        result.validCount = recordList.length;

        logger.info(`准备删除${recordList.length}条关联记录`);

        // 4. 调用batchDeleteRecords执行批量删除
        logger.info("开始批量删除关联记录");
        
        const deleteParams = {
            objectApiName: childObjectApiName,
            recordList: recordList
        };

        const deleteResult = await faas.function("batchDeleteRecords").invoke(deleteParams);

        if (!deleteResult) {
            throw new Error("批量删除函数调用失败");
        }

        // 5. 整合删除结果
        result.invalidCount = deleteResult.invalidCount || 0;
        result.validCount = deleteResult.validCount || 0;
        result.deleteSuccessCount = deleteResult.deleteSuccessCount || 0;
        result.deleteFailCount = deleteResult.deleteFailCount || 0;
        result.deleteSuccessList = deleteResult.deleteSuccessList || [];
        result.deleteFailList = deleteResult.deleteFailList || [];
        result.invalidList = deleteResult.invalidList || [];
        result.fullSuccess = deleteResult.fullSuccess || false;

        logger.info("批量删除关联记录操作完成", {
            total: result.totalCount,
            invalid: result.invalidCount,
            valid: result.validCount,
            deleteSuccess: result.deleteSuccessCount,
            deleteFail: result.deleteFailCount,
            fullSuccess: result.fullSuccess
        });

        return result;

    } catch (error) {
        logger.error("批量删除关联记录过程中发生错误", error);
        throw new Error(`批量删除关联记录失败: ${error.message}`);
    }
};

/****************************************************************************************/
/*
提示词：

函数名： batchDeleteRelatedRecords

功能描述：
批量删除与父记录关联的子记录。该函数首先使用batchFindRelatedRecords查找所有关联的子记录，
然后使用batchDeleteRecords批量删除这些子记录。

入参：
- parentFieldApiName：父表关联字段API名称，类型：字符串，必填
- parentRecord：父表记录对象，类型：JSON对象，必须包含_id字段，必填
- childObjectApiName：子表API名称，类型：字符串，必填

入参检测：
- parentFieldApiName：必须是非空字符串
- parentRecord：必须是非空JSON对象且包含有效的_id字段，_id必须是整数或可转为整数的字符串
- childObjectApiName：必须是非空字符串

函数体：
1. 参数校验
2. 调用batchFindRelatedRecords查找所有关联记录
3. 如果没有关联记录，直接返回成功
4. 将查找到的记录转换为删除所需的格式（只保留_id字段）
5. 调用batchDeleteRecords执行批量删除
6. 整合并返回删除结果

出参：
- totalCount：总记录数（查找到的关联记录数）
- invalidCount：无效记录数
- validCount：有效记录数
- deleteSuccessCount：删除成功数
- deleteFailCount：删除失败数
- deleteSuccessList：删除成功的记录ID列表
- deleteFailList：删除失败的记录详情列表
- invalidList：无效记录列表
- fullSuccess：是否完全成功
- findRelatedRecordsResult：查找关联记录的完整结果（用于调试）

依赖函数：
- batchFindRelatedRecords：查找关联记录
- batchDeleteRecords：批量删除记录
*/