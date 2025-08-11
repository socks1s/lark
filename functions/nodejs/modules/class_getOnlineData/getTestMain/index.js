/**
 * @description 通用测试数据获取函数 - 支持获取单条或多条记录用于测试
 * @param {Object} params - 参数对象
 * @param {string} params.objectApiName - 对象API名称，必填
 * @param {string|Array<string>} [params.recordIds] - 记录ID或ID数组，用于精确查询
 * @param {Array<string>} [params.selectFields] - 需要查询的字段列表，默认查询所有字段
 * @param {Object} [params.conditions] - 查询条件对象，支持复杂查询
 * @param {number} [params.limit] - 限制返回记录数，默认100，最大200
 * @param {number} [params.offset] - 偏移量，用于分页查询，默认0
 * @param {string} [params.orderBy] - 排序字段，默认按_id排序
 * @param {string} [params.orderDirection] - 排序方向，'asc'或'desc'，默认'asc'
 * @param {boolean} [params.returnSingle] - 是否只返回单条记录，默认false
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回查询结果
 */
module.exports = async function (params, context, logger) {
    try {
        // 参数解构和默认值设置
        const {
            objectApiName,
            recordIds,
            selectFields,
            conditions = {},
            limit = 100,
            offset = 0,
            orderBy = '_id',
            orderDirection = 'asc',
            returnSingle = false
        } = params;

        // 必填参数校验
        if (!objectApiName || typeof objectApiName !== 'string' || objectApiName.trim() === '') {
            throw new Error("objectApiName参数必须为非空字符串");
        }

        // 可选参数校验
        if (selectFields && !Array.isArray(selectFields)) {
            throw new Error("selectFields参数必须为字符串数组");
        }

        if (recordIds && !Array.isArray(recordIds) && typeof recordIds !== 'string') {
            throw new Error("recordIds参数必须为字符串或字符串数组");
        }

        if (typeof limit !== 'number' || limit <= 0 || limit > 200) {
            throw new Error("limit参数必须为1-200之间的数字");
        }

        if (typeof offset !== 'number' || offset < 0) {
            throw new Error("offset参数必须为非负数");
        }

        if (!['asc', 'desc'].includes(orderDirection)) {
            throw new Error("orderDirection参数必须为'asc'或'desc'");
        }

        logger.info(`开始获取${objectApiName}对象的测试数据`);
        logger.info(`查询参数: limit=${limit}, offset=${offset}, orderBy=${orderBy}, orderDirection=${orderDirection}`);

        // 构建查询对象
        let query = application.data.object(objectApiName);

        // 设置查询字段
        if (selectFields && selectFields.length > 0) {
            // 验证字段名格式
            const validFields = selectFields.filter(field => 
                typeof field === 'string' && field.trim() !== ''
            );
            if (validFields.length === 0) {
                throw new Error("selectFields中必须包含至少一个有效的字段名");
            }
            query = query.select(...validFields);
            logger.info(`指定查询字段: ${validFields.join(', ')}`);
        } else {
            logger.info("查询所有字段");
        }

        // 构建查询条件
        let whereConditions = { ...conditions };

        // 处理recordIds参数 - 分别查询每个ID
        if (recordIds) {
            const ids = Array.isArray(recordIds) ? recordIds : [recordIds];
            // 验证ID格式
            const validIds = ids.filter(id => {
                if (typeof id === 'string' && id.trim() !== '') return true;
                if (typeof id === 'number' && !isNaN(id)) return true;
                return false;
            });

            if (validIds.length === 0) {
                throw new Error("recordIds中必须包含至少一个有效的ID");
            }

            logger.info(`按ID查询: ${validIds.join(', ')}`);

            // 对于多个ID，分别查询然后合并结果
            if (validIds.length === 1) {
                whereConditions._id = validIds[0];
                logger.info(`查询条件: ${JSON.stringify(whereConditions)}`);
            } else {
                // 多个ID需要分别查询
                logger.info("多个ID查询，将分别执行查询后合并结果");
                const allRecords = [];
                
                for (const id of validIds) {
                    try {
                        let singleQuery = application.data.object(objectApiName);
                        
                        // 设置查询字段
                        if (selectFields && selectFields.length > 0) {
                            const validFields = selectFields.filter(field => 
                                typeof field === 'string' && field.trim() !== ''
                            );
                            singleQuery = singleQuery.select(...validFields);
                        }
                        
                        // 查询单个ID
                        const record = await singleQuery.where({ _id: id }).findOne();
                        if (record) {
                            allRecords.push(record);
                        }
                    } catch (error) {
                        logger.warn(`查询ID ${id} 时出错: ${error.message}`);
                    }
                }
                
                logger.info(`成功获取${allRecords.length}条记录`);
                
                return {
                    success: true,
                    data: returnSingle ? (allRecords[0] || null) : allRecords,
                    isSingle: returnSingle,
                    totalCount: allRecords.length,
                    currentCount: allRecords.length,
                    hasMore: false,
                    queryInfo: {
                        objectApiName,
                        selectFields: selectFields || "all",
                        recordIds: validIds,
                        queryType: "multipleIds"
                    }
                };
            }
        }

        // 应用查询条件
        if (Object.keys(whereConditions).length > 0) {
            query = query.where(whereConditions);
            logger.info(`查询条件: ${JSON.stringify(whereConditions)}`);
        }

        // 设置排序
        if (orderDirection === 'desc') {
            query = query.orderBy(`-${orderBy}`);
        } else {
            query = query.orderBy(orderBy);
        }

        // 设置分页
        query = query.offset(offset).limit(limit);

        // 执行查询
        let records;
        let totalCount = 0;

        if (returnSingle) {
            // 返回单条记录
            const record = await query.findOne();
            logger.info(record ? "成功获取单条记录" : "未找到匹配的记录");
            
            return {
                success: true,
                data: record,
                isSingle: true,
                totalCount: record ? 1 : 0,
                queryInfo: {
                    objectApiName,
                    selectFields: selectFields || "all",
                    conditions: whereConditions,
                    limit,
                    offset,
                    orderBy,
                    orderDirection
                }
            };
        } else {
            // 返回多条记录
            records = await query.find();
            
            // 如果需要总数统计（当有分页时）
            if (offset > 0 || records.length === limit) {
                try {
                    totalCount = await application.data.object(objectApiName)
                        .where(whereConditions)
                        .count();
                } catch (countError) {
                    logger.warn("获取总数失败，使用当前批次数量", countError);
                    totalCount = records.length;
                }
            } else {
                totalCount = records.length;
            }

            logger.info(`成功获取${records.length}条记录，总数: ${totalCount}`);
            
            // 输出详细的记录信息用于调试
            if (records.length > 0) {
                logger.info("记录详情:", JSON.stringify(records, null, 2));
            }

            return {
                success: true,
                data: records,
                isSingle: false,
                totalCount,
                currentCount: records.length,
                hasMore: offset + records.length < totalCount,
                queryInfo: {
                    objectApiName,
                    selectFields: selectFields || "all",
                    conditions: whereConditions,
                    limit,
                    offset,
                    orderBy,
                    orderDirection
                }
            };
        }

    } catch (error) {
        logger.error("获取测试数据时出错", error);
        
        // 返回错误信息
        return {
            success: false,
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                details: error.stack
            },
            data: null,
            queryInfo: {
                objectApiName: params.objectApiName,
                selectFields: params.selectFields,
                conditions: params.conditions
            }
        };
    }
};

/*
函数设计说明：

1. 功能特性：
   - 支持单条和多条记录查询
   - 支持字段选择查询
   - 支持复杂查询条件
   - 支持分页和排序
   - 支持按ID精确查询
   - 完整的参数校验
   - 详细的日志记录
   - 统一的返回格式

2. 参数说明：
   - objectApiName: 必填，对象API名称
   - recordIds: 可选，支持单个ID或ID数组
   - selectFields: 可选，指定查询字段
   - conditions: 可选，复杂查询条件
   - limit/offset: 分页参数
   - orderBy/orderDirection: 排序参数
   - returnSingle: 是否只返回单条记录

3. 返回格式：
   - success: 操作是否成功
   - data: 查询结果数据
   - isSingle: 是否为单条记录
   - totalCount: 总记录数
   - currentCount: 当前返回记录数
   - hasMore: 是否还有更多数据
   - queryInfo: 查询信息
   - error: 错误信息（失败时）

4. 使用场景：
   - 测试数据准备
   - 数据验证
   - 批量数据处理
   - API测试
*/