/*************************************************************************************/
/*
 *提示词：
  新建一个云函数：
入参：记录列表（用于入库的记录列表），objectApiName（这批记录列表所属的对象apiName），where（可选，仅对更新记录应用的过滤条件）
函数体：
- 将这批总的「入参记录列表」，拆分成2组，「有_id的记录列表」 和 「无_id的记录列表」 （依据：记录中是否包含【_id】字段，这是判断更新/创建的唯一条件）
- 「有_id的记录列表」，如果提供了where条件，则先应用where过滤，只有满足where条件的记录才使用 application.data.object(objectApiName).batchUpdate() 进行更新
- 「无_id的记录列表」，忽略where条件，直接使用 application.data.object(objectApiName).batchCreate() 进行新建
- 其中需要判断：记录列表是否为空的情况，如果为空，则这段函数不执行。
- 需要注意：batchUpdate() 和batchCreate() 方法在使用的过程中是有每次操作的数据量限制的，请根据数据量限制，将「有_id的记录列表」和「无_id的记录列表」进行入库的时候，需要开启循环，每次循环的数据条数，需要保证在平台允许的范围内

出参：
- 更新成功的list（包含成功的记录的id）
- 新建成功的list（包含成功的记录的id）
- 更新成功and 新建成功的并集list（包含更新成功和新建成功的记录id）
- 更新失败的list（每一行包含：失败的原因）
- 新建失败的list（每一行包含：失败的原因）
- 更新失败and新建失败的总的并集list（每一行包含：失败的原因）
- 更新成功的总条数
- 新建成功的总条数
- 新建失败的总条数
- 更新失败的总条数
*/
/*************************************************************************************/
/**
 * @description 批量记录分组入库功能
 * @param {Object} params - 参数对象，包括记录列表和对象API名称
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回操作结果，包括成功/失败的记录和统计信息
 */
module.exports = async function (params, context, logger) {
  logger.info('批量提交数据函数，开始执行：');
    let  { recordList, objectApiName, where } = params;

/*************************************************************************************/
//测试数据：
let isTesting =false
if( isTesting ===true){
  recordList = [
      {
          "_id": 1838447763876923,
          "isCalculating": true
      },
      {
        "_id": 1838447882353770,
        "isCalculating": true
      },
      {
        "_id": null,
        "forwarderOrderId": '123456test-NoidForCreate'
      }
  ],
  objectApiName= "testMain"
}

// let isTesting =true
// if( isTesting ===true){
//   recordList = [
//     {
//       _id: 1838377468174395,
//       _isDeleted: false,
//       _objectId: 1836957050752122,
//       approvalRecordId: null,
//       approvalStatus: 'draft',
//       forwarderOrderId: '55',
//       recordVersion: 43,
//       serialNumber: 'TM2025072397'
//     }
//   ],
//   objectApiName= "testMain"
// }

/*************************************************************************************/
// 初始化结果对象：
    const result = {
        updateSuccessList: [],
        createSuccessList: [],
        allSuccessList: [], 
        updateFailList: [],
        createFailList: [],
        allFailList: [],
        stats: {
          totalRecordsCount: 0,
          totalSuccessCount: 0,
          totalFailCount: 0,
          updateSuccessCount: 0,
          updateFailCount: 0,
          createSuccessCount: 0,
          createFailCount: 0
        }
    };

/*************************************************************************************/
//初始化变量：
        // 分组记录：有_id的为更新组，无_id的为创建组
        const recordsToUpdate = [];
        const recordsToCreate = [];
/*************************************************************************************/
//入参检查，totalRecordsCount赋值：
    // 检查空记录列表
    if (!recordList || recordList.length === 0) {
        logger.info("记录列表为空，无需处理");
        return result;
    }

    // 检查元素类型，元素不满足条件的，则报错： 不是对象，是空，是数组[]
    for (const record of recordList) {
      if (typeof record !== 'object' || record === null || Array.isArray(record)) {
        throw new Error(`记录列表中的元素必须是对象，但实际类型为: ${typeof record}`);
      }
    }

    // 预处理：删除_objectId和_isDeleted字段
    const processedRecordList = recordList.map(record => {
      const newRecord = {...record};
      if ('_objectId' in newRecord) {
        delete newRecord._objectId;
      }
      if ('_isDeleted' in newRecord) {
        delete newRecord._isDeleted;
      }
      return newRecord;
    });

    result.stats.totalRecordsCount = processedRecordList.length;
/*************************************************************************************/
//根据id有无，进行分组：
    processedRecordList.forEach(record => {
        // 检查_id是否有效：不为空、null、0或''
        if (record._id && record._id !== '' && record._id !== 0) {
            recordsToUpdate.push(record);
        } else {
            recordsToCreate.push(record);
        }
    });

    logger.info(`分组完成：待更新记录 ${recordsToUpdate.length} 条，待创建记录 ${recordsToCreate.length} 条`);
/*************************************************************************************/
// 批量更新记录
    if (recordsToUpdate.length > 0) {
        try {
            // 分批处理，每批最多500条
            const batchSize = 500;
            for (let i = 0; i < recordsToUpdate.length; i += batchSize) {
                const batch = recordsToUpdate.slice(i, i + batchSize);//从数组中，根据偏移量取出500条，第一次取出：0-500条，第二次取出：500-1000条
                await application.data.object(objectApiName).batchUpdate(batch);
                result.updateSuccessList.push(...batch);
                result.stats.updateSuccessCount += batch.length;
                logger.info(`成功更新 ${batch.length} 条记录`);
            }
        } catch (error) {
            logger.error("批量更新失败", error);
            result.updateFailList.push(...recordsToUpdate);
            result.stats.updateFailCount = recordsToUpdate.length;
        }
    }
/*************************************************************************************/
// 批量创建记录
    if (recordsToCreate.length > 0) {
        try {
            // 分批处理，每批最多500条
            const batchSize = 500;
            for (let i = 0; i < recordsToCreate.length; i += batchSize) {
                const batch = recordsToCreate.slice(i, i + batchSize);
                const createdIds = await application.data.object(objectApiName).batchCreate(batch);
                // 将创建成功的记录添加到结果中
                const successRecords = batch.map((record, index) => ({
                    ...record,
                    _id: createdIds[index]
                }));
                
                result.createSuccessList.push(...successRecords);
                result.stats.createSuccessCount += batch.length;
                logger.info(`成功创建 ${batch.length} 条记录`);
            }
        } catch (error) {
            logger.error("批量创建失败", error);
            result.createFailList.push(...recordsToCreate);
            result.stats.createFailCount = recordsToCreate.length;
        }
    }
/*************************************************************************************/
    // 合并所有成功和失败的记录
    result.allSuccessList = [...result.updateSuccessList, ...result.createSuccessList];
    result.allFailList = [...result.updateFailList, ...result.createFailList];

    // 计算总成功和总失败数量
    result.stats.totalSuccessCount = result.stats.updateSuccessCount + result.stats.createSuccessCount;
    result.stats.totalFailCount = result.stats.updateFailCount + result.stats.createFailCount;

    logger.info(`处理完成: 
    总记录数: ${result.stats.totalRecordsCount}
    总成功数: ${result.stats.totalSuccessCount}
    总失败数: ${result.stats.totalFailCount}
    更新成功: ${result.stats.updateSuccessCount}
    更新失败: ${result.stats.updateFailCount}
    创建成功: ${result.stats.createSuccessCount}
    创建失败: ${result.stats.createFailCount}`);
 
    logger.info('成功列表:');
    logger.info(result.allSuccessList);
    logger.info('失败列表:'); 
    logger.info(result.allFailList);

    return result;
}
