module.exports = async function(params, context, logger) {
  logger.info('新建主函数，开始执行：');
  let {
      mainRecord,
      childRecordList
  } = params; // 从参数中获取JSON字符串和对象API名称
  /******************************************************************/
const run = (await faas.function("createEditRecord").invoke({
  mainRecord: mainRecord,
  childRecordList: childRecordList,
  mainObjectApiName: 'testMain',
  childObjectApiName: 'testChild',
  parentFieldApiName: 'forwarderOrder',
  operation: 'create',
}));
  logger.info('run:');
  logger.info(run);
}