/**
 * @description SMS数据处理函数，解析JSON格式的SMS数据并存储到数据库
 * @param {Object} params - 参数对象
 * @param {string} params.jsonData - JSON格式的SMS数据字符串
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回处理结果，包含成功状态、数据和错误信息
 */
module.exports = async function (params, context, logger) {
    // 函数开始执行的logger输出（必须）
    logger.info('SMS数据处理函数开始执行');
    
    // 入参解构赋值（必须）
    const {
        jsonData
    } = params;
    
    // 预构建结果对象（必须）
    const result = {
        success: false,
        data: null,
        error: null
    };
    
    try {
        // 参数校验
        if (!jsonData) {
            result.error = '缺少必要参数：jsonData';
            logger.info('参数校验失败：缺少jsonData参数');
            return result;
        }
        
        // 解析JSON数据
        let parsedData;
        try {
            parsedData = JSON.parse(jsonData);
            logger.info('JSON数据解析成功');
        } catch (parseError) {
            result.error = 'JSON数据格式错误：' + parseError.message;
            logger.info('JSON解析失败：' + parseError.message);
            return result;
        }
        
        // 校验数据结构
        if (!parsedData.body) {
            result.error = '数据结构错误：缺少body字段';
            logger.info('数据结构校验失败：缺少body字段');
            return result;
        }
        
        const bodyData = parsedData.body;
        
        // 提取body对象中的各个字段
        const {
            BATTERY_INFO,
            BATTERY_PCT,
            CARD_SLOT,
            CURRENT_TIME,
            DEVICE_NAME,
            FROM,
            IPV4,
            IPV6,
            NET_TYPE,
            SMS
        } = bodyData;
        
        logger.info('成功提取body数据字段');
        
        // 整理record对象，映射到数据库字段
        const record = {
            message: SMS || '',                    // 消息内容
            metadata: JSON.stringify({             // 元数据，包含所有其他信息
                batteryInfo: BATTERY_INFO,
                batteryPct: BATTERY_PCT,
                cardSlot: CARD_SLOT,
                currentTime: CURRENT_TIME,
                ipv4: IPV4,
                ipv6: IPV6,
                netType: NET_TYPE,
                header: parsedData.header || {},
                query: parsedData.query || {}
            }),
            sender: FROM || '',                    // 发送方
            slotId: CARD_SLOT || '',              // 卡槽信息
            machineId: DEVICE_NAME || ''          // 设备名称
        };
        
        logger.info('record对象整理完成：' + JSON.stringify(record));
        
        // 使用application.data.object接口将数据存储到sms数据库
        const createResult = await application.data.object("sms").create(record);
        
        logger.info('数据库写入操作完成');
        
        // 设置成功结果
        result.success = true;
        result.data = {
            recordId: createResult._id,
            message: 'SMS数据处理并存储成功',
            extractedFields: {
                message: record.message,
                sender: record.sender,
                slotId: record.slotId,
                machineId: record.machineId
            }
        };
        
        logger.info('SMS数据处理函数执行成功');
        
    } catch (error) {
        result.error = '函数执行错误：' + error.message;
        logger.info('函数执行异常：' + error.message);
        logger.info('错误堆栈：' + error.stack);
    }
    
    return result;
};