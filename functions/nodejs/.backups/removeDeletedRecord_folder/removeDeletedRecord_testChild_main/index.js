module.exports = async function (params, context, logger) {
    // 日志记录
    logger.info('主函数：开始执行RecordList转idList函数');
    
    const { recordListOld , recordListNew } = params; // 从参数中解构出recordList（记录列表）
    
    let idListOld = []; 
    let idListNew = []; 
    let delList = [];   
    let successCount = 0;
    let failedCount = 0;

    // 检查输入参数 recordListOld
    if (!Array.isArray(recordListOld)) {
        logger.error('输入的 recordListOld 不是数组');
        throw new Error('输入的 recordListOld 不是数组');
    }
    // 检查输入参数 recordListNew
    if (!Array.isArray(recordListNew)) {
      logger.error('输入的 recordListNew 不是数组');
      throw new Error('输入的 recordListNew 不是数组');
   }
    
    // convertRecordToId调用： recordList -> idList（使用Promise.all并行处理两个）
    try {
        const [resultOld, resultNew] = await Promise.all([
            faas.function("convertRecordToId").invoke({
            recordList: recordListOld
            }),
            faas.function("convertRecordToId").invoke({
                recordList: recordListNew
            })
        ]);
        
        logger.info('成功调用convertRecordToId函数,resultOld:', resultOld);
        logger.info('成功调用convertRecordToId函数,resultNew:', resultNew);
        
        idListOld = resultOld.idList;
        idListNew = resultNew.idList;
        
        logger.info('idlistOld:', idListOld);
    logger.info('idlistNew:', idListNew);
    } catch (error) {
        logger.error('调用convertRecordToId函数失败', error);
    throw new Error('转换RecordList为idList时发生错误');
    }

  //prepareDeleteIdList:
  try {
      const result = await faas.function("prepareDeleteIdList").invoke({
      oldList:idListOld,//老的列表(idList)
      newList:idListNew//新的列表(idList)
    });
    logger.info('成功调用prepareDeleteIdList函数,result:', result);
    // 返回转换后的ID列表
    delList = result.delList;
    logger.info('delList:', delList);
} catch (error) {
    logger.error('调用prepareDeleteIdList函数失败1', error);
    throw new Error('调用prepareDeleteIdList函数失败1');
}

                //batchDeleteIds:
                try {
                  const result = await faas.function("batchDeleteIds").invoke({
                    idList:delList, 
                    objectApiName:'testChild'
                  });
                logger.info('成功调用 batchDeleteIds 函数,result:', result);
                // 返回转换后的ID列表
                successCount = result.successCount;
                failedCount= result.failedCount;
               
                return {
                  successCount: successCount,
                  failedCount: failedCount
                };
              } catch (error) {
    
                throw new Error('调用 batchDeleteIds 函数失败1');
              }


}
