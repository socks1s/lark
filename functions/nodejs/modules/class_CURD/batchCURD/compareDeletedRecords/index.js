/**
 * @description 比较新旧记录列表并找出待删除记录的云函数
 * @param {Object} params - 参数对象，包含oldRecordList和newRecordList
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回差异记录列表和操作状态
 * 
 * 支持两种输入格式：
 * 1. 对象数组：[{_id:1},{_id:2},{_id:3}]
 * 2. ID数组：[1,2,3]
 */

module.exports = async function (params, context, logger) {
    logger.info('compareDeletedRecords函数开始执行');
    logger.info('接收到的参数:', JSON.stringify(params, null, 2));
    
    // 辅助函数：标准化输入格式，将ID数组转换为对象数组
    const normalizeRecordList = (recordList, listName) => {
        if (!Array.isArray(recordList)) {
            throw new Error(`${listName}必须是数组`);
        }
        
        if (recordList.length === 0) {
            return [];
        }
        
        // 检查第一个元素来判断输入格式
        const firstElement = recordList[0];
        
        if (typeof firstElement === 'number' || typeof firstElement === 'string') {
            // ID数组格式：[1,2,3] 或 ["1","2","3"]
            return recordList.map((id, index) => {
                const numId = Number(id);
                if (isNaN(numId) || !Number.isInteger(numId)) {
                    throw new Error(`${listName}中的第${index + 1}个元素必须是整数或可解析为整数的字符串`);
                }
                return { _id: numId };
            });
        } else if (typeof firstElement === 'object' && firstElement !== null) {
            // 对象数组格式：[{_id:1},{_id:2},{_id:3}]
            return recordList.map((record, index) => {
                if (!record || typeof record !== "object") {
                    throw new Error(`${listName}中的第${index + 1}个元素必须是对象`);
                }
                if (record._id === undefined || record._id === null) {
                    throw new Error(`${listName}中的第${index + 1}个元素必须包含_id字段`);
                }
                const id = Number(record._id);
                if (isNaN(id) || !Number.isInteger(id)) {
                    throw new Error(`${listName}中的第${index + 1}个元素的_id必须是整数或可解析为整数的字符串`);
                }
                return { ...record, _id: id };
            });
        } else {
            throw new Error(`${listName}的格式不正确，支持格式：[{_id:1},{_id:2}] 或 [1,2,3]`);
        }
    };
    
    // 初始化返回结果
    const result = {
        diffRecordList: [],
        status: "success",
        message: "操作成功"
    };

    try {
        // 参数校验
        if (!params || typeof params !== "object") {
            throw new Error("参数必须是一个对象");
        }

        const { oldRecordList, newRecordList } = params;

        // 检查参数是否存在
        if (!oldRecordList || !newRecordList) {
            throw new Error("oldRecordList和newRecordList都是必需的参数");
        }

        // 标准化输入格式
        const normalizedOldRecordList = normalizeRecordList(oldRecordList, "oldRecordList");
        const normalizedNewRecordList = normalizeRecordList(newRecordList, "newRecordList");

        // 使用Set提高查找效率
        const newRecordIds = new Set();
        normalizedNewRecordList.forEach(record => {
            newRecordIds.add(record._id);
        });

        // 找出old中存在但new中不存在的记录
        result.diffRecordList = normalizedOldRecordList.filter(record => {
            return !newRecordIds.has(record._id);
        });

        logger.info("记录比较完成", {
            oldCount: normalizedOldRecordList.length,
            newCount: normalizedNewRecordList.length,
            diffCount: result.diffRecordList.length
        });

    } catch (error) {
        logger.error("记录比较失败", error);
        result.status = "error";
        result.message = error.message || "记录比较过程中出现错误";
    }

    return result;
}


 /******************************************************************/
 /*提示词：
函数名：compareDeletedRecords
入参：
-老记录列表（ oldRecordList ),类型JSON，json schema是array，其中的每个元素的类型为object，每个object中，都有「_id」字段
-新记录列表（ newRecordList ),类型JSON，json schema是array，其中的每个元素的类型为object，每个object中，都有「_id」字段

入参检测：
- oldRecordList，newRecordList的类型，必须都是object
- oldRecordList，newRecordList都可以为空
- 循环oldRecordList 与 newRecordList中的每个的元素（每个元素都是object），每个object中：
      - 都必须有有「_id」字段，如果检测失败，则直接抛出错误，并结束函数。
      - 每个「_id」字段中的内容，都必须是「整数」，或者可以被解析成「整数」的字符串，如果检测失败，则直接抛出错误，并结束函数。

函数体：
- 注意处理入参（oldRecordList，newRecordList）为空的情况
- 循环 oldRecordList 中的每个元素：
  - 循环时，将该元素的“_id”字段，和 newRecordList中的“_id”字段 进行对比，
- 如果该元素的“_id”字段，不存在于newRecordList中的“_id”字段，则将这个元素记录下来，表明这个元素「待删除」。
- 最后形成一个「待删除」array，这个array中包含了所有的 「待删除」的元素，
- 算法选择：要求算法的速度要快，用于对比逻辑的运行效率要高，算法要优秀

算法举例： 
 - oldRecordList: a,b,c ; 
- newRecordList: a,b,e,f
- old中的ab元素，存在于new，所以保留，c元素不存在于new，所以需要待删除

出参：
- diffRecordList:「待删除元素」的array,类型JSON，json schema是array，其中的每个元素的类型为object
*/
/******************************************************************/