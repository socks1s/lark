/** 
 * @param {Params}  params     自定义参数 
 * @param {Context} context    上下文参数，可通过此参数下钻获取上下文变量信息等 
 * @param {Logger}  logger     日志记录器 
 * 
 * @return 函数的返回数据 
 */ 
 module.exports = async function (params, context, logger) { 
  res =  await application.metadata.object('testMain').getFields();
  logger.info('res:');
  logger.info(res);
}