/**
 * @description 获取最新快照版本号云函数，根据recordId和objectApiName查询snapshot对象中的最新snapshotVersion
 * @param {Object} params - 参数对象
 * @param {string} params.objectApiName - 对象API名称
 * @param {string} params.recordId - 记录ID
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回最新快照版本号和完整记录信息
 */
module.exports = async function (params, context, logger) {
    logger.info('【获取最新快照版本号函数】开始执行');
    
    const { objectApiName, recordId } = params;
    logger.info("params:", objectApiName, recordId);

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
        logger.info(`开始查询快照对象，关联对象: ${objectApiName}, 记录ID: ${recordId}`);

        // 2. 查询snapshot对象中指定recordId和objectApiName的所有快照，按snapshotVersion降序排序
        const latestSnapshot = await application.data.object('snapshot')
            .orderByDesc('snapshotVersion')
            .select('snapshotVersion','_id')
            .where({
                recordId: recordId,
                ObjectApiName: objectApiName
            })
            .findOne();

        // 3. 检查查询结果
        if (!latestSnapshot) {
            logger.warn(`未找到快照记录，对象: ${objectApiName}, 记录ID: ${recordId}`);
            return {
                status: 'not_found',
                message: '未找到指定的快照记录',
                latestSnapshotVersion: null,
                record: null,
                objectApiName: objectApiName,
                recordId: recordId
            };
        }

        // 4. 提取快照版本号
        const latestSnapshotVersion = parseInt(latestSnapshot.snapshotVersion || '0', 10);
        

        logger.info(`查询成功，最新快照版本号: ${latestSnapshotVersion}`);
        logger.info('最新快照记录信息:', JSON.stringify(latestSnapshot, null, 2));

        // 5. 返回结果
        return {
            status: 'success',
            message: '获取最新快照版本号成功',
            latestVersion: latestSnapshotVersion
        };

    } catch (error) {
        logger.error("获取最新快照版本号过程中出现错误:", error);
        
        // 返回错误信息
        return {
            status: 'error',
            message: `获取最新快照版本号失败: ${error.message}`,
            latestVersion: null,
            record: null,
            objectApiName: objectApiName,
            recordId: recordId,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        };
    }
}