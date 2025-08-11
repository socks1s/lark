/**
 * @description 处理主子表关联关系的云函数
 * @param {Object} params - 参数对象，包括子记录列表、父记录和关联字段名
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回更新后的子记录列表
 */
module.exports = async function (params, context, logger) {
    logger.info('relateParentChildRecords函数开始运行...');
    const { childRecordList, parentRecord, parentFieldApiName } = params;
    console.log('childRecordList:', childRecordList);
    console.log('parentRecord:', parentRecord);
    console.log('parentFieldApiName:', parentFieldApiName);

    // 参数校验
    if (!Array.isArray(childRecordList)) {
        throw new Error("childRecordList必须是一个数组");
    }
    if (!parentFieldApiName || typeof parentFieldApiName !== 'string') {
        throw new Error("parentFieldApiName必须是一个非空字符串");
    }
    if (!parentRecord || typeof parentRecord !== 'object' || !parentRecord._id) {
        throw new Error("parentRecord必须是一个包含有效_id字段的对象");
    }

    // 检查parentRecord._id是否为有效ID（支持数字ID和UUID格式）
    let parentId;
    const idValue = parentRecord._id;
    
    // 检查是否为数字或可转换为数字的字符串
    const numericId = Number(idValue);
    if (!isNaN(numericId) && Number.isInteger(numericId)) {
        parentId = numericId;
    } else if (typeof idValue === 'string' && idValue.trim() !== '') {
        // 检查是否为UUID格式（简单验证：包含连字符的字符串）
        if (idValue.includes('-') || idValue.length > 10) {
            parentId = idValue; // 直接使用字符串ID
        } else {
            throw new Error("parentRecord._id必须是有效的整数、可转为整数的字符串或UUID格式的字符串");
        }
    } else {
        throw new Error("parentRecord._id必须是有效的整数、可转为整数的字符串或UUID格式的字符串");
    }

    if (childRecordList.length === 0) {
      logger.warn("警告：childRecordList为空数组，未处理任何记录");
      // 仍返回空数组结果
      return { updatedChildRecordList: [] };
    } 

    try {
        logger.info(`开始处理子记录关联，共${childRecordList.length}条记录`);

        // 遍历子记录列表，为每条记录添加父表关联字段
        const updatedChildRecordList = childRecordList.map(childRecord => {
            // 创建新的子记录对象，避免修改原始对象
            const updatedRecord = { ...childRecord };
            // 添加父表关联字段
            updatedRecord[parentFieldApiName] = { id: parentId };
            return updatedRecord;
        });

        logger.info("子记录关联处理完成");
        return { updatedChildRecordList };
    } catch (error) {
        logger.error("处理子记录关联时出错", error);
        throw new Error("处理子记录关联时出错: " + error.message);
    }
}

/*
提示词：
函数名： parentChildRelation
主子表进行关联，需要循环的是子表array，
入参：
- childRecordList （待关联的「子记录列表」，类型JSON）
- parentRecord （与子对象关联的「父记录」，类型JSON）
- parentFieldApiName (在子记录中，其关联的父对象的「关联对象」ApiName，类型string)

入参检测：
- childRecordList ：类型为[]，可为空，校验不通过直接结束函数。
- parentObjectApiName： 类型string，非空，校验不通过直接结束函数
- relatedRecord: 非空object，这个object的内部，必须要有一个key="_id"的键，并且这个key的value必须为：非空的整数（举例：  {"_id":123456,"name":"zhangsan"}）or 非空的的字符串，但是这个字符串必须可以解析成整数（举例：  {"_id":"123456","name":"zhangsan"}），校验不通过直接结束函数
函数体主要功能描述：
传入的 childRecordList是 array of object，内部的元素是「子记录」形成的列表
函数的目的是要给这批「子记录列表」，绑定它们的父记录id
绑定的格式，列举在下文中。


算法举例： 
入参 ：
- childRecordList =[{'name':'a','age':2},{'name':'b','age':3}],
- parentFieldApiName = "forwarderOrder",
- parentRecord = {'id':123,'name':'c'}
函数处理：childRecordList的每个子记录中，插入一个字段，字段名为 parentFieldApiName ，以及对应的父对象的id
updatedChildRecordList = [{"name":'a',"age":2,"forwarderOrder":{id:123} },{"name":"b","age":3,"forwarderOrder":{id:123}}],

出参：updatedChildRecordList（更新后的子记录列表）
*/