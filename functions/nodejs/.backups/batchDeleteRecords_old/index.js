/**
 * @description 批量删除发货单记录的云函数
 * @param {Object} params - 参数对象，包含需要删除的记录列表
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回成功和失败的删除数量
 */
module.exports = async function (params, context, logger) {
    const { recordList } = params; // 从参数中解构出记录列表
      
    // 检查输入参数
    if (!recordList || !Array.isArray(recordList) || recordList.length === 0) {
        throw new Error("参数 'recordList' 是必需的且不能为空数组");
    }

    let successCount = 0;
    let failedCount = 0;
    
    try {
        logger.info(`开始批量删除 ${recordList.length} 条发货单记录`);
        
        // 提取记录ID列表
        const recordIds = recordList.map(record => record._id);
        
        // 批量删除记录
        const deleteResult = await application.data.object("shippingOrders").batchDelete(recordIds);
        
        // 根据返回结果统计成功和失败数量
        if (deleteResult && deleteResult.success_count !== undefined) {
            successCount = deleteResult.success_count;
            failedCount = recordList.length - successCount;
        } else {
            // 如果没有返回详细结果，假设全部成功
            successCount = recordList.length;
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
            failedCount: recordList.length
        };
    }
}
