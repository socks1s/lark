/**
 * @description 处理记录列表并返回ID列表的云函数。
 * @param {Object} params - 参数对象，包含recordList数组。
 * @param {Object} context - 上下文对象。
 * @param {Logger} logger - 日志记录器。
 * @return {Object} 返回一个对象，包含从输入记录中提取的所有_id组成的数组。
 */
module.exports = async function (params, context, logger) {
    const { recordList } = params; // 从参数中解构出recordList

    // 检查输入的必要参数
    if (!recordList || !Array.isArray(recordList)) {
        throw new Error("参数 'recordList' 是必需的且必须为数组");
    }

    try {
        // 提取所有记录的_id字段
        const idList = recordList.map(record => {
            if (!record || !record._id) {
                logger.warn("记录缺少_id字段", record);
                return null;
            }
            return record._id;
        }).filter(id => id !== null); // 过滤掉无效的_id

        logger.info("成功提取ID列表", { count: idList.length }); // 记录成功日志

        return { idList }; // 返回ID列表
    } catch (error) {
        logger.error("处理记录列表时出错", error); // 记录错误日志
        throw new Error("处理记录列表时出现错误"); // 抛出错误信息
    }
}
