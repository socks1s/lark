/**
 * @description 批量删除记录的云函数
 * @param {Object} params - 参数对象，包含需要删除的记录列表
 * @param {Object} context - 上下文参数
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回删除操作的统计信息和错误详情
 */
module.exports = async function (params, context, logger) {
  logger.info('batchDeleteRecords函数开始执行');

    // 初始化返回结果
    const result = {
        totalCount: 0,
        invalidCount: 0,
        validCount: 0,
        deleteSuccessCount: 0,
        deleteFailCount: 0,
        fullSuccess: false,
        deleteSuccessList: [],  
        deleteFailList: [],      
        invalidList: []          
    };

    try {
        // 1. 参数校验
        logger.info("开始参数校验");
        if (!params.objectApiName || typeof params.objectApiName !== 'string') {
            throw new Error("objectApiName参数不能为空且必须是字符串");
        }

        if (!params.recordList) {
            throw new Error("recordList参数不能为空");
        }

        if (!Array.isArray(params.recordList)) {
            throw new Error("recordList必须是数组");
        }

        // 2. 准备要删除的记录ID列表
        const recordIds = [];
    result.invalidList = params.recordList.map((record, index) => {
            try {
                if (!record) {
                    throw new Error("记录不能为空");
                }

                if (typeof record !== 'object') {
                    throw new Error("记录必须是对象");
                }

                if (!record._id) {
                    throw new Error("记录缺少_id字段");
                }

                // 尝试将_id转换为数字
                const id = Number(record._id);
                if (isNaN(id)) {
                    throw new Error("_id必须是数字或可转换为数字的字符串");
                }

                recordIds.push(id);
        return null; // 校验通过，返回null
            } catch (error) {
        return {
          _id: record?._id?.toString() || '未知',
          success: false,
          errors: `记录[${index}]验证失败: ${error.message}`
        };
            }
    }).filter(item => item !== null); // 过滤掉校验通过的记录

        result.totalCount = params.recordList.length;
        result.invalidCount = result.invalidList.length;
        result.validCount = recordIds.length;
        
    if (result.invalidCount > 0) {
      logger.warn(`发现${result.invalidCount}条无效记录`, { invalidList: result.invalidList });
        }

        if (recordIds.length === 0) {
            logger.info("没有有效的记录需要删除");
            result.fullSuccess = result.invalidCount === 0;
            return result;
        }

        // 3. 分批删除记录（平台限制每次最多500条）
        const BATCH_SIZE = 500;
        const batches = Math.ceil(recordIds.length / BATCH_SIZE);

        logger.info(`开始批量删除，共${recordIds.length}条记录，分${batches}批处理`);

        for (let i = 0; i < batches; i++) {
            const start = i * BATCH_SIZE;
            const end = start + BATCH_SIZE;
            const batchIds = recordIds.slice(start, end);

                logger.info(`正在处理第${i + 1}批，共${batchIds.length}条记录`);
            const batchResult = await application.data.object(params.objectApiName).batchDelete(batchIds);
                
            // 处理批量删除结果
            if (batchResult.data && Array.isArray(batchResult.data)) {
                batchResult.data.forEach(item => {
                    if (item.success) {
                        result.deleteSuccessCount++;
            result.deleteSuccessList.push(item._id);
                    } else {
                        result.deleteFailCount++;
                        const errorCode = item.errors?.[0]?.code || 'unknown_error';
            result.deleteFailList.push({
              _id: item._id,
              success: false,
              errors: [{ code: errorCode }]
                        });
                        logger.error(`记录${item._id}删除失败`, { errorCode });
                    }
                });
                }
            logger.info(`第${i + 1}批处理完成`);
        }

        // 计算完全成功标志
        result.fullSuccess = result.totalCount === result.deleteSuccessCount && result.invalidCount === 0;

        logger.info("批量删除操作完成", {
            total: result.totalCount,
            invalid: result.invalidCount,
            valid: result.validCount,
            deleteSuccess: result.deleteSuccessCount,
            deleteFail: result.deleteFailCount,
            fullSuccess: result.fullSuccess
        });

        return result;
    } catch (error) {
        logger.error("批量删除过程中发生错误", error);
        throw new Error(`批量删除失败: ${error.message}`);
    }
}

/****************************************************************************************/
 /*
 提示词：
 
 函数名： batchDeleteRecords
 入参：
 -记录列表（ recordList ),类型JSON，json schema是array，其中的每个元素的类型为object，每个object中，都有「_id」字段
 
 入参检测：
 - recordList的类型：必须是 object
 - recordList 这个object，里面的元素可以为空
 - 循环 recordList 中的每个元素：
       - 都必须有有「_id」字段，如果检测失败，则直接抛出错误，并结束函数。
       - 每个「_id」字段中的内容，都必须是「整数」，或者可以被解析成「整数」的字符串，如果检测失败，则直接抛出错误，并结束函数。
 
 函数体：
 - 注意处理入参（ recordList ）为空的情况
 - 使用 batchDetele 函数将 recordList 中的元素进行批量
 - 注意平台的 batchDetele 函数有单次操作的限制，所以需要分批处理。
 
 注意：
 - batchDetele函数会有相对应的错误提示，表明本次删除为什么出错，请将出错的信息和
 
 出参：
- invalidCount,：入参检测中，不通过的条数
- validCount, 入参检测通过的条数（即为输入到batchDelete函数中的条数）
- deleteSuccessCount 通过batchDelete函数的返回值，成功的条数
- deleteFailCount   通过batchDelete函数的返回值，失败的条数
- deleteSuccessList,包含所有删除成功的记录id，类型[],内部不需要字段，只要id成功的列表，不需要其他字段 ,格式如下：[123,456,453]
- deleteFailList,包含所有删除失败的记录id，类型[]，以及删除失败的原因，格式如下：
    [{
      _id: 2838529283489,
      success: false,
      errors: [ { code: 'k_mt_ec_900030' 
    }]
-invalidtList,包含所验证失败的记录id，类型[]，以及删除失败的原因，格式如下：
    [{
      _id: 2838529283489,
      success: false,
      errors: 验证失败的原因
    }]
- totalCount,总共需要删除的总元素个数（为入参的recordList的条数）
- totalSuccessCount=deleteSuccessCount(batchdelete 删除成功的总数)
- totalFailCount= invalidCount（入参检测失败的总数） + deleteFailCount（删除失败的总数）
- fullSuccess: boolean,如果完全成功，则返回true（完全成功的标志： totalCount =totalSuccessCount  ）


batchdelete函数的错误返回格式是这样的：{
  code: '',
  msg: 'success',
  data: [
    { _id: 1838528949568889, success: true },
    {
      _id: 2838529283489,
      success: false,
      errors: [ { code: 'k_mt_ec_900030' } ]
    }
  ],
  hasError: [Function (anonymous)]
}  也就是说，这个函数的总的执行，总是成功的，并不会返回error，它其中的错误信息，是在data中的，data中会返回每一条id成功与否的情况，请你重新改写，包括成功失败次数等等各种参数。

 */
 /****************************************************************************************/