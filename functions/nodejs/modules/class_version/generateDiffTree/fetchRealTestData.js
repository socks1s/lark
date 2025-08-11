/**
 * 从线上数据库获取真实测试数据
 * 用于为 generateDiffTree 函数构造真实的业务数据进行差异对比测试
 */

/**
 * 获取真实测试数据的主函数
 * @param {string} objectApiName - 业务对象API名称
 * @param {string} strategy - 获取策略：'random', 'latest', 'specific', 'version_compare'
 * @param {Object} options - 配置选项
 * @param {Logger} logger - 日志记录器
 * @returns {Object} 包含 oldData 和 newData 的测试数据
 */
async function fetchRealTestData(objectApiName, strategy = 'random', options = {}, logger) {
    logger.info(`开始获取真实测试数据: objectApiName=${objectApiName}, strategy=${strategy}`);
    
    try {
        let oldData, newData;
        
        switch (strategy) {
            case 'random':
                ({ oldData, newData } = await getRandomRecords(objectApiName, options, logger));
                break;
            case 'latest':
                ({ oldData, newData } = await getLatestRecords(objectApiName, options, logger));
                break;
            case 'specific':
                ({ oldData, newData } = await getSpecificRecords(objectApiName, options, logger));
                break;
            case 'version_compare':
                ({ oldData, newData } = await getVersionRecords(objectApiName, options, logger));
                break;
            default:
                throw new Error(`不支持的获取策略: ${strategy}`);
        }
        
        // 数据清理和预处理
        oldData = cleanDataForComparison(oldData, options);
        newData = cleanDataForComparison(newData, options);
        
        logger.info('成功获取真实测试数据');
        return {
            success: true,
            oldData,
            newData,
            metadata: {
                objectApiName,
                strategy,
                timestamp: new Date().toISOString(),
                dataSource: 'production_database'
            }
        };
        
    } catch (error) {
        logger.error('获取真实测试数据失败', error);
        throw new Error(`获取真实测试数据失败: ${error.message}`);
    }
}

/**
 * 策略1：随机获取两条记录
 */
async function getRandomRecords(objectApiName, options, logger) {
    const { selectFields = [], excludeFields = [] } = options;
    
    // 获取总记录数
    const totalCount = await application.data.object(objectApiName).count();
    logger.info(`对象 ${objectApiName} 总记录数: ${totalCount}`);
    
    if (totalCount < 2) {
        throw new Error(`记录数量不足，至少需要2条记录进行对比，当前只有${totalCount}条`);
    }
    
    // 随机获取两个不同的偏移量
    const offset1 = Math.floor(Math.random() * totalCount);
    let offset2 = Math.floor(Math.random() * totalCount);
    while (offset2 === offset1 && totalCount > 1) {
        offset2 = Math.floor(Math.random() * totalCount);
    }
    
    // 构建查询
    let query1 = application.data.object(objectApiName);
    let query2 = application.data.object(objectApiName);
    
    if (selectFields.length > 0) {
        query1 = query1.select(...selectFields);
        query2 = query2.select(...selectFields);
    }
    
    const oldData = await query1.offset(offset1).limit(1).findOne();
    const newData = await query2.offset(offset2).limit(1).findOne();
    
    logger.info(`随机获取记录: oldData._id=${oldData?._id}, newData._id=${newData?._id}`);
    
    return { oldData, newData };
}

/**
 * 策略2：获取最新和次新记录
 */
async function getLatestRecords(objectApiName, options, logger) {
    const { selectFields = [], timeField = '_createTime' } = options;
    
    let query = application.data.object(objectApiName);
    
    if (selectFields.length > 0) {
        query = query.select(...selectFields);
    }
    
    const records = await query
        .orderBy(timeField, 'desc')
        .limit(2)
        .find();
    
    if (records.length < 2) {
        throw new Error(`记录数量不足，至少需要2条记录进行对比，当前只有${records.length}条`);
    }
    
    const [newData, oldData] = records; // 最新的作为newData，次新的作为oldData
    
    logger.info(`获取最新记录: oldData._id=${oldData._id}, newData._id=${newData._id}`);
    
    return { oldData, newData };
}

/**
 * 策略3：获取指定条件的记录
 */
async function getSpecificRecords(objectApiName, options, logger) {
    const { selectFields = [], whereCondition = {}, recordIds = [] } = options;
    
    let query = application.data.object(objectApiName);
    
    if (selectFields.length > 0) {
        query = query.select(...selectFields);
    }
    
    let records;
    
    if (recordIds.length >= 2) {
        // 如果指定了记录ID，直接获取
        const oldData = await query.where({ _id: recordIds[0] }).findOne();
        const newData = await query.where({ _id: recordIds[1] }).findOne();
        records = [oldData, newData];
    } else if (Object.keys(whereCondition).length > 0) {
        // 根据条件查询
        records = await query.where(whereCondition).limit(2).find();
    } else {
        throw new Error('specific策略需要提供recordIds或whereCondition');
    }
    
    if (records.length < 2 || !records[0] || !records[1]) {
        throw new Error(`指定条件下记录数量不足，至少需要2条有效记录进行对比`);
    }
    
    const [oldData, newData] = records;
    
    logger.info(`获取指定记录: oldData._id=${oldData._id}, newData._id=${newData._id}`);
    
    return { oldData, newData };
}

/**
 * 策略4：版本对比（适用于有版本控制的业务对象）
 */
async function getVersionRecords(objectApiName, options, logger) {
    const { 
        selectFields = [], 
        businessIdField = 'businessId', 
        versionField = 'version',
        businessId 
    } = options;
    
    if (!businessId) {
        throw new Error('version_compare策略需要提供businessId');
    }
    
    let query = application.data.object(objectApiName);
    
    if (selectFields.length > 0) {
        query = query.select(...selectFields);
    }
    
    const records = await query
        .where({ [businessIdField]: businessId })
        .orderBy(versionField, 'desc')
        .limit(2)
        .find();
    
    if (records.length < 2) {
        throw new Error(`业务ID ${businessId} 下版本记录不足，至少需要2个版本进行对比`);
    }
    
    const [newData, oldData] = records; // 新版本作为newData，旧版本作为oldData
    
    logger.info(`获取版本记录: oldData.version=${oldData[versionField]}, newData.version=${newData[versionField]}`);
    
    return { oldData, newData };
}

/**
 * 数据清理和预处理
 */
function cleanDataForComparison(data, options) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    const { 
        excludeFields = ['_createTime', '_updateTime', 'lastUpdateTime'],
        removeNullValues = true,
        removeEmptyStrings = false 
    } = options;
    
    const cleanedData = { ...data };
    
    // 移除指定字段
    excludeFields.forEach(field => {
        if (field.includes('.')) {
            // 处理嵌套字段路径
            const paths = field.split('.');
            let current = cleanedData;
            for (let i = 0; i < paths.length - 1; i++) {
                if (current[paths[i]]) {
                    current = current[paths[i]];
                } else {
                    break;
                }
            }
            if (current && current[paths[paths.length - 1]] !== undefined) {
                delete current[paths[paths.length - 1]];
            }
        } else {
            delete cleanedData[field];
        }
    });
    
    // 递归清理嵌套对象
    Object.keys(cleanedData).forEach(key => {
        const value = cleanedData[key];
        
        if (removeNullValues && (value === null || value === undefined)) {
            delete cleanedData[key];
        } else if (removeEmptyStrings && value === '') {
            delete cleanedData[key];
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            cleanedData[key] = cleanDataForComparison(value, options);
        }
    });
    
    return cleanedData;
}

module.exports = {
    fetchRealTestData
};