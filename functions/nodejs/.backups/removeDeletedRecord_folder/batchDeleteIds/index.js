/**
 * @description 批量删除发货单记录的云函数
 * @param {Object} params - 参数对象，包含需要删除的ID列表
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回成功和失败的删除数量
 */
module.exports = async function (params, context, logger) {
    const { idList, objectApiName } = params; // 从参数中解构出ID列表
    
    // 检查输入参数
    if (!idList || !Array.isArray(idList)) {
        throw new Error("参数 'idList' 是必需的且必须为数组");
    }

    // 如果idList为空数组，直接返回成功结果
    if (idList.length === 0) {
        logger.info("idList为空数组，跳过删除操作");
        return {
            successCount: 0,
            failedCount: 0
        };
    }

    // 检查idList中的每个元素是否为有效的整数
    for (const id of idList) {
        if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            throw new Error(`参数 'idList' 中的元素 ${id} 不是有效的正整数`);
        }
    }
    
    let successCount = 0;
    let failedCount = 0;
    
    try {
        logger.info(`开始批量删除 ${idList.length} 条发货单记录`);
        
        // 直接使用ID列表进行批量删除
        const deleteResult = await application.data.object(objectApiName).batchDelete(idList);
        logger.info('deleteResult:');
        logger.info(deleteResult);
        // 根据返回结果统计成功和失败数量
        if (deleteResult && deleteResult.success_count !== undefined) {
            successCount = deleteResult.success_count;
            failedCount = idList.length - successCount;
        } else {
            // 如果没有返回详细结果，假设全部成功
            successCount = idList.length;
        }
        
        logger.info(`批量删除完成，成功 ${successCount} 条，失败 ${failedCount} 条`);
        
        return {
            successCount,
            failedCount
        };
    } catch (error) {
        logger.error("批量删除发货单记录时出错", error);
        // 如果发生错误，所有记录都视为失败
        return {
            successCount: 0,
            failedCount: idList.length
        };
    }
}
