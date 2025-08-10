//todo： batchUpsert 函数中，提交错误的数据，目前是一个批量抓取，但是batchUpdate函数不会报错，只会给一个总的成功与否的状态，这个需要修改。
module.exports = async function (params, context, logger) {
  logger.info('createEditRecord函数，开始执行：');
  let { mainRecord, mainObjectApiName, parentFieldApiName, childObjectApiName, operation, childRecordList } = params;
/*************************************************************************/
  // 初始化要用的变量：
  let updatedmainRecord = {};
  let committedMainRecord = {};
  let updatedchildRecordList = [];
  let committedChildRecordList = [];
/*************************************************************************/
  // 测试入参：
  const isTesting = false;
  const isChildRecordListEmpty = false;
  if (isTesting) {
    // 测试数据：
    let mainSelectedFields = ['forwarderOrderId', 'recordVersion', 'approvalStatus', 'approvalRecordId', 'serialNumber'];
      let mainRecordIdForTest = 1838377468174395;
      mainObjectApiName = 'testMain'; 
      parentFieldApiName = 'forwarderOrder';
      childObjectApiName = 'testChild';
      operation = 'edit';

      logger.info('isTesting = true,使用测试数据');
    if (isChildRecordListEmpty) {
        logger.info('测试数据：子表空');
      childRecordList = [];
    } else {
        logger.info('测试数据：子表非空');
      childRecordList = [
        {
            _id: 1838447358845018,
            "shippingOrderId": "661-66"
        },
        {
            "shippingOrderId": "662-77"
      }
      ];
       }
    // 2.主记录：
    if (operation === 'edit') {
      mainRecord = await application.data.object(mainObjectApiName).select(mainSelectedFields).where({ _id: mainRecordIdForTest }).findOne();
    } else {
      mainRecord = {
        "forwarderOrderId": "561"
      };
          }
  } else {
      logger.info('isTesting = false,使用真实数据');
    }
/*************************************************************************/
  // 入参校验
  if (typeof parentFieldApiName !== 'string' || parentFieldApiName.trim() === '') {
    throw new Error('parentFieldApiName 必须是非空字符串');
  }
  if (typeof childObjectApiName !== 'string' || childObjectApiName.trim() === '') {
    throw new Error('childObjectApiName 必须是非空字符串');
  }
  if (operation !== 'edit' && operation !== 'create') {
    throw new Error('operation 必须是 "edit" 或 "create"');
  }
  if (typeof mainRecord !== 'object' || mainRecord === null || Array.isArray(mainRecord)) {
    throw new Error('mainRecord 必须是非空的对象');
  }
  if (typeof mainObjectApiName !== 'string' || mainObjectApiName.trim() === '') {
    throw new Error('mainObjectApiName 必须是非空字符串');
  }
  if (!Array.isArray(childRecordList)) {
    throw new Error('childRecordList 必须是数组');
  }
/*************************************************************************/
  // 冲突检测（乐观锁,编辑的时候需要）：
  if (operation === 'create') {
    logger.info('新增时，乐观锁检测跳过');
  } else if (operation === 'edit') {
    const versionConflictCheckResult = await faas.function("versionConflictCheck").invoke({
    record: mainRecord, 
      objectApiName: mainObjectApiName
  });
    logger.info('versionConflictCheckResult:');
    logger.info(versionConflictCheckResult);
}
/*************************************************************************/
  // 主表字段更新：1.版本变化 2.审批状态变化
  const versionControlResult = await faas.function("versionControl").invoke({
    operation: operation,
    record: mainRecord
  });
    logger.info('versionControlResult:');
    logger.info(versionControlResult);
  updatedmainRecord = versionControlResult.updatedRecord;
/*************************************************************************/
  // 主表入库：
    logger.info('主表入库，调用方法 batchUpsertRecords 中...');
    committedMainRecord = (await faas.function("batchUpsertRecords").invoke({
    recordList: [updatedmainRecord],
    objectApiName: mainObjectApiName
    })).allSuccessList[0];
    logger.info('committedMainRecord:');
    logger.info(committedMainRecord);

  // 主子关联:
  updatedchildRecordList = (
        await faas.function("relateParentChildRecords").invoke({
      childRecordList: childRecordList,
      parentRecord: committedMainRecord,
      parentFieldApiName: parentFieldApiName
      })  
      ).updatedChildRecordList;

  // 子表入库:
    logger.info('子表入库，调用方法 batchUpsertRecords...');
    committedChildRecordList = (await faas.function("batchUpsertRecords").invoke({
    recordList: updatedchildRecordList,
    objectApiName: childObjectApiName
    })).allSuccessList;
/*************************************************************************/   
  // 老子表数据删除（需要在主表入库后，子表入库后）：
  if (operation === 'edit') {
        const oldRelatedRecords = (await faas.function("batchFindRelatedRecords").invoke({
      parentFieldApiName: parentFieldApiName,
      parentRecord: mainRecord,
      childObjectApiName: childObjectApiName,
      selectChildFields: ""
    })).relatedRecords;
        logger.info('oldRelatedRecords:');
        logger.info(oldRelatedRecords);

    const diffRecordList = (
            await faas.function("compareDeletedRecords").invoke({
            oldRecordList: oldRelatedRecords, 
            newRecordList: committedChildRecordList
          })  
        ).diffRecordList;

    const batchDeleteRecordsRes = (
      await faas.function("batchDeleteRecords").invoke({
        recordList: diffRecordList,
        objectApiName: 'testChild'
          })  
          ).fullSuccess;
        logger.info('batchDeleteRecordsRes:');
        logger.info(batchDeleteRecordsRes);
      }
}
