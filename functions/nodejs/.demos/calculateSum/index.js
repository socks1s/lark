/**
 * @description 计算两个数字和的云函数
 * @param {Object} params - 参数对象，包含两个数字a和b
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回计算结果对象
 */
module.exports = async function (params, context, logger) {
    const { a, b } = params; // 从参数中解构出a和b

    // 参数校验
    if (a === undefined || b === undefined) {
        throw new Error("参数a和b都是必需的");
    }

    // 确保参数是数字类型
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error("参数a和b必须是数字类型");
    }

    // 计算和
    const sum = a + b;

    // 记录日志
    logger.info(`计算完成: ${a} + ${b} = ${sum}`);

    // 返回结果
    return { sum };
}
