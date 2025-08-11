/**
 * @description 获取最新版本号云函数，根据recordId查询指定对象的最新版本记录
 * @param {Object} params - 参数对象
 * @param {string} params.objectApiName - 对象API名称
 * @param {string} params.recordId - 记录ID
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回最新版本号和完整记录信息
 */
module.exports = async function (params, context, logger) {
    logger.info('【获取最新版本号函数】开始执行');
    
    const { objectApiName, recordId } = params;
    logger.info("params:",objectApiName, recordId);

    // 1. 入参校验
    if (!objectApiName || typeof objectApiName !== 'string') {
        logger.error("objectApiName参数必须为非空字符串");
        throw new Error("objectApiName参数必须为非空字符串");
    }

    if (!recordId || typeof recordId !== 'number') {
        logger.error("recordId参数必须为数字格式");
        throw new Error("recordId参数必须为数字格式");
    }

    try {
        logger.info(`开始查询对象: ${objectApiName}, 记录ID: ${recordId}`);

        // 2. 查询指定记录ID的所有版本，按recordVersion降序排序
        const latestRecord = await application.data.object(objectApiName).orderByDesc('recordVersion').select('recordVersion', '_id').where({_id: recordId}).findOne();
        logger.info("latestRecord:",latestRecord);
        // return 0
        // 3. 检查查询结果
        if (!latestRecord) {
            logger.warn(`未找到记录，对象: ${objectApiName}, ID: ${recordId}`);
            return {
                status: 'not_found',
                message: '未找到指定记录',
                latestVersion: null,
                record: null
            };
        }

        // 4. 提取版本号
        const latestVersion = parseInt(latestRecord.recordVersion) || 0;
        
        logger.info(`查询成功，最新版本号: ${latestVersion}`);
        logger.info('最新记录信息:', JSON.stringify(latestRecord, null, 2));

        // 5. 返回结果
        return {
            status: 'success',
            message: '获取最新版本号成功',
            latestVersion: latestVersion,
        };

    } catch (error) {
        logger.error("获取最新版本号过程中出现错误:", error);
        
        // 返回错误信息
        return {
            status: 'error',
            message: `获取最新版本号失败: ${error.message}`,
            latestVersion: null,
            record: null,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        };
    }
}