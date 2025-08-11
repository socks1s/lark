module.exports = async function (params, context, logger) {
    logger.info('乐观锁函数，开始执行：');
    const { record, objectApiName } = params;
    let nextVersionNumber = 0;
    // 检查输入的必要参数

//测试数据：
// {
//   "objectApiName": "testMain",
//   "record": {
//     "_id":1838395888741866,
//       "name": "张三",
//       "recordVersion":7
//   }
// }
    if (typeof record !== 'object' || record === null) {
      throw new Error("record的类型必须是对象，而且非空");
    }

    const recordId =record?._id || null;
    const thisVersionNumber = parseInt(record?.recordVersion || null,10);

    if (!recordId || !objectApiName || thisVersionNumber === undefined||thisVersionNumber === null) {
        throw new Error("recordId,objectApiName,thisVersionNumber参数都是必需的");
    }
    try {
        // 查询数据库获取最新记录
        const dbRecord = await application.data.object(objectApiName)
            .select(['recordVersion', '_updatedAt', '_updatedBy']) // 修改为同时查询recordVersion和_updatedAt字段
            .where({ _id: recordId })
            .findOne();

        if (!dbRecord) {
            logger.info("未找到指定记录");
            return {
                isValid: false,
                message: "未找到指定记录",
                versionInfo: {
                    latestVersion: null,
                    nextVersion: null,
                    latestUpdatedBy: null,
                    latestUpdatedAt: null,
                    latestRecordId: null
                }
            };
        }

        const latestVersionNumber = parseInt(dbRecord.recordVersion,10);
        const latestUpdatedBy = dbRecord?._updatedBy._name
        //const latestUpdatedBy = dbRecord?._updatedBy._name?.find(item => item.language_code === 2052)?.text || null;;  // 将人员对象转换成姓名（中文）
        const latestUpdatedAt = dbRecord._updatedAt;
        const latestRecordId = dbRecord._id;
        // 比较版本号
        if (latestVersionNumber === thisVersionNumber) {
            nextVersionNumber = latestVersionNumber + 1;
            logger.info('当前版本号=最新版本号=:'+thisVersionNumber+'，下一版本号:'+nextVersionNumber);
            return {
                isValid: true,
                message: "版本验证通过",
                versionInfo: {
                  latestVersion: latestVersionNumber,
                  nextVersion: nextVersionNumber,
                  latestUpdatedBy: latestUpdatedBy,
                  latestUpdatedAt: latestUpdatedAt,
                  latestRecordId: latestRecordId
              }
            };
        } else {
            logger.error('thisVersionNumber:'+thisVersionNumber+',latestVersionNumber:'+latestVersionNumber+'，版本号不一致');
            throw new Error("提交的记录版本，与数据库中最新的记录版本不一致");
        }
    } catch (error) {
        logger.error("记录的版本号冲突，或验证过程中出现错误 ", error);
        throw new Error("记录的版本号冲突，或验证过程中出现错误");
    }
}
