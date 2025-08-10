/**
 * @description 版本控制云函数，处理记录的创建和编辑操作
 * @param {Object} params - 参数对象，包含record、operation和recordVersion
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回操作状态和更新后的记录
 */
module.exports = async function (params, context, logger) {
  logger.info('【版本+1函数，审批赋值】 合二为一函数，开始执行：');
    const { record, operation } = params;
    //operation:create / edit


    //测试数据：
    // {
    //   "operation": "edit",
    //   "record": {
    //       "name": "example",
    //       "value": "content",
    //       "recordVersion": 1
    //   }
    // } 

    // 1. 入参校验
    if (!record) {
        logger.error("主记录不能为空");
        throw new Error("主记录不能为空");
    }

    if (!operation || (operation !== 'create' && operation !== 'edit')) {
        logger.error("操作类型必须是'create'或'edit'");
        throw new Error("操作类型必须是'create'或'edit'");
    }

    const recordVersion = parseInt(record?.recordVersion || 0,10);

    // 修改后的recordVersion校验逻辑
    if (operation === 'create') {
        if (recordVersion !== undefined && recordVersion !== null && recordVersion !== '' && recordVersion !== 0) {
            logger.error("创建操作时recordVersion必须为空或0");
            throw new Error("创建操作时recordVersion必须为空或0");
        }
    } else if (operation === 'edit' && (!recordVersion || recordVersion <= 0)) {
        logger.error("编辑操作时recordVersion必须存在且大于0");
        throw new Error("编辑操作时recordVersion必须存在且大于0");
    }

    try {
        // 2. 版本控制
        let newVersion;
        if (operation === 'create') {
            newVersion = 1;
        } else {
            newVersion = recordVersion + 1;
        }

        // 3. 状态更新
        const updatedRecord = {
            ...record,
            recordVersion: newVersion,
            approvalStatus: 'draft'
        };

        logger.info(`版本控制成功，新版本号: ${newVersion}`);
        logger.info(`updatedRecord: `);
        logger.info(updatedRecord);

        // 4. 返回结果
        return {
            status: 'success',
            updatedRecord: updatedRecord
        };

    } catch (error) {
        logger.error("版本控制过程中出现错误", error);
        throw new Error("版本控制过程中出现错误");
    }
}
