/**
 * 获取当前用户有权限的SMS记录
 * 
 * @description 基于用户权限的SMS记录查询连接器，通过联表查询实现权限控制的数据访问
 * @param {Object} params - 输入参数
 * @param {number} params.page - 页码，从1开始，默认为1
 * @param {number} params.pageSize - 每页记录数，默认为20，最大100
 * @param {Object} context - 上下文对象，包含用户信息
 * @param {Object} logger - 日志记录器
 * @returns {Object} 返回包含SMS记录、分页信息和统计信息的结果对象
 */
module.exports = async function (params, context, logger) {
    // 函数开始执行的logger输出（必须）
    logger.info('getUserSmsRecords开始执行');
    
    // 入参解构赋值（必须）
    const {
        page = 1,
        pageSize = 20
    } = params || {};

    // 预构建结果对象（必须）
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
    
    const result = {
        success: false,
        data: {
            items: [],
            total: 0,
            has_more: false
        },
        error: null
    };

    try {
        // 获取当前用户ID
        const currentUserId = context.user?._id;
        if (!currentUserId) {
            throw new Error('无法获取当前用户ID');
        }

        logger.info('获取当前用户ID成功', { userId: currentUserId });

        // 第一步：查询当前用户的权限记录
        const otpAuthQuery = `
            SELECT _id, employee._id as employeeId, otpServiceName
            FROM otpAuth
            WHERE employee._id = '${currentUserId}'
        `;
        
        const otpAuthRecords = await context.db.oql(otpAuthQuery).execute();
        const otpAuthArray = Array.isArray(otpAuthRecords) ? otpAuthRecords : [];
        
        logger.info('用户权限查询完成', { 
            recordCount: otpAuthArray.length
        });

        // 如果用户没有权限记录，返回空数组
        if (otpAuthArray.length === 0) {
            logger.info('用户没有权限记录，返回空结果');
            result.success = true;
            return result;
        }

        // 第二步：提取所有otpServiceName值（多选选项）
        const allServiceNames = [];
        otpAuthArray.forEach((record) => {
            if (record.otpServiceName && Array.isArray(record.otpServiceName)) {
                // 多选选项是数组格式
                allServiceNames.push(...record.otpServiceName);
            } else if (record.otpServiceName) {
                // 处理可能的单个值情况
                allServiceNames.push(record.otpServiceName);
            }
        });

        // 去重
        const uniqueServiceNames = [...new Set(allServiceNames)];

        logger.info('服务权限提取完成', { 
            serviceCount: uniqueServiceNames.length,
            services: uniqueServiceNames
        });

        // 如果没有有效的服务名称，返回空数组
        if (uniqueServiceNames.length === 0) {
            logger.info('没有有效的服务权限，返回空结果');
            result.success = true;
            return result;
        }

        // 第三步：构建WHERE条件
        const whereConditions = uniqueServiceNames.map(serviceName => 
            `otpServiceName = '${serviceName}'`
        ).join(' OR ');

        // 第四步：执行总数查询
        const countQuery = `
            SELECT COUNT(*) as total
            FROM sms
            WHERE ${whereConditions}
        `;
        
        const countResult = await context.db.oql(countQuery).execute();
        const totalRecords = countResult?.[0]?.total || 0;
        
        result.data.total = totalRecords;

        logger.info('SMS总数查询完成', { totalRecords });

        // 如果总数为0，返回空结果
        if (totalRecords === 0) {
            logger.info('没有匹配的SMS记录，返回空结果');
            result.success = true;
            return result;
        }

        // 第五步：执行分页查询获取SMS记录（最终查询）
        const offset = (validatedPage - 1) * validatedPageSize;
        const smsQuery = `
            SELECT _id, otpServiceName,_createdBy, _createdAt,_updatedBy,isOtp, _updatedAt,message,sender,slotId,numberOwner,machineId,isOtp,category,otpServiceName,otpCode
            FROM sms
            WHERE ${whereConditions}
            ORDER BY _createdAt DESC
            LIMIT ${validatedPageSize} OFFSET ${offset}
        `;

        const smsRecords = await context.db.oql(smsQuery).execute();
        result.data.items = smsRecords || [];
        
        // 计算是否还有更多数据
        result.data.has_more = (offset + validatedPageSize) < totalRecords;
        
        result.success = true;
        logger.info(' result.data.items', { smsRecords });

        logger.info('SMS记录查询完成', {
            returnedRecords: result.data.items.length,
            page: validatedPage,
            pageSize: validatedPageSize,
            total: result.data.total,
            has_more: result.data.has_more
        });

        return result;

    } catch (error) {
        logger.info('函数执行出错', { 
            error: error.message
        });
        
        result.error = error.message;
        return result;
    }
};