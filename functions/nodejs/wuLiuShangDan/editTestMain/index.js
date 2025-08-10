//todo： batchUpsert 函数中，提交错误的数据，目前是一个批量抓取，但是batchUpdate函数不会报错，只会给一个总的成功与否的状态，这个需要修改。
module.exports = async function(params, context, logger) {
  logger.info('编辑主函数1，开始执行：');
  let {
      mainRecord,
      childRecordList
  } = params; // 从参数中获取JSON字符串和对象API名称
  /*************************************************************************/
  // 测试入参：
  const isTesting = false;

  if (isTesting) {
      // 测试数据：
      logger.info('isTesting = true,使用测试数据');

      let operation = 'edit';
      let mainSelectedFields = ['forwarderOrderId', 'recordVersion', 'approvalStatus', 'approvalRecordId', 'serialNumber'];
      mainRecordIdForTest = 1839677557603450;
      mainObjectApiName = 'forwarderOrders';

      const isChildRecordListEmpty = false;
      if (isChildRecordListEmpty) {
          logger.info('测试数据：子表空');
          childRecordList = [];
      } else {
          logger.info('测试数据：子表非空');
          childRecordList = [{
                  _id: 1839685803352537,
                  "shippingOrderId": "zuj"
              },
              {
                  "shippingOrderId": "zuj1"
              }
          ];
      }
      // 2.主记录：
      if (operation === 'edit') {
          mainRecord = await application.data.object(mainObjectApiName).select(mainSelectedFields).where({
              _id: mainRecordIdForTest
          }).findOne();
      } else {
          mainRecord = {
              "forwarderOrderId": "345345"
          };
      }
  } else {
      logger.info('isTesting = false,使用真实数据');
  }
  /*************************************************************************/
  const run = (await faas.function("createEditRecord1").invoke({
      mainRecord: mainRecord,
      childRecordList: childRecordList,
      mainObjectApiName: 'forwarderOrders',
      childObjectApiName: 'shippingOrders',
      parentFieldApiName: 'logisticsOrder',
      operation: 'edit',
  }));
  logger.info('run:');
  logger.info(run);
}