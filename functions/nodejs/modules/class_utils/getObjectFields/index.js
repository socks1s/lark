/**
 * @description 获取指定对象的所有字段信息的云函数
 * @param {Object} params - 参数对象，包含objectApiName
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回包含字段列表的对象
 */
module.exports = async function (params, context, logger) {
    try {
        const { objectApiName } = params;
        
        // 入参校验
        if (!objectApiName || typeof objectApiName !== 'string' || objectApiName.trim() === '') {
            throw new Error("objectApiName参数必须为非空字符串");
        }
        
        logger.info(`开始获取${objectApiName}对象的字段信息`);
        
        // 使用metadata API获取指定对象的所有字段
        const fields = await application.metadata.object(objectApiName).getFields();
        
        logger.info(`成功获取${objectApiName}对象的字段信息`);
        logger.info('fields:');
        logger.info(JSON.stringify(fields, null, 2));

        // 返回字段信息
        return {
            fields: fields
            
        };
    } catch (error) {
        logger.error("获取字段信息时出错", error);
        throw new Error(`获取对象字段信息失败: ${error.message}`);
    }
}
