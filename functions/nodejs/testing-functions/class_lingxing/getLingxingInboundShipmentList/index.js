/**
 * 领星API - 查询发货单列表
 * 获取发货单列表数据，使用模块化设计复用tokenManager和httpClient
 * API Path: /erp/sc/routing/storage/shipment/getInboundShipmentList
 */

const TokenManager = require('../lingxingSdk/modules/tokenManager/TokenManager');
const HttpClient = require('../lingxingSdk/modules/httpClient/HttpClient');

/**
 * 云函数主入口
 * @param {Object} params - 输入参数
 * @param {string} params.search_value - 搜索的值
 * @param {string} params.search_field - 搜索字段：sku, shipment_sn, shipment_id
 * @param {string} params.sids - 店铺id，多个时通过英文逗号分隔
 * @param {string} params.mids - 国家id，多个时通过英文逗号分隔
 * @param {string} params.wid - 仓库id，多个时通过英文逗号分隔
 * @param {Array} params.logistics_type - 物流方式id
 * @param {number} params.status - 发货单状态：-1待配货，0待发货，1已发货，3已作废，4已删除
 * @param {string} params.print_status - 打印状态：0未打印，1已打印
 * @param {string} params.pick_status - 拣货状态：0未拣货，1已拣货
 * @param {number} params.time_type - 时间类型：3创建时间(精确到时分秒)，2创建时间，1到货时间，0发货时间，4更新时间(精确到时分秒)
 * @param {string} params.start_date - 开始日期
 * @param {string} params.end_date - 结束日期
 * @param {number} params.offset - 偏移量=(currentPage-1)*length
 * @param {number} params.length - 长度
 * @param {number} params.is_delete - 是否删除：0未删除(默认)，1已删除，2全部
 * @param {Object} context - 云函数上下文
 * @param {Object} logger - 日志对象
 * @returns {Promise<Object>} 发货单列表数据
 */
module.exports = async function (params, context, logger) {
    logger.info('开始执行领星发货单列表查询');
    
    try {
        // 初始化TokenManager和HttpClient
        const tokenManager = new TokenManager(logger);
        const httpClient = new HttpClient();
        
        logger.info('模块初始化完成');
        
        // 获取访问令牌
        const tokenResult = await tokenManager.getValidAccessToken();
        
        logger.info('获取访问令牌结果:', tokenResult);

        // if (!tokenResult.success) {
        //     logger.error('获取访问令牌失败:', tokenResult.error);
        //     return buildErrorResponse('获取访问令牌失败', tokenResult.error);
        // }
        const access_token = tokenResult.access_token;
        const appId = await application.globalVar.getVar("lingxingAppId");
        logger.info('访问令牌获取成功1', );
        
        // 构建请求参数
        const requestParams = {
            search_value: params.search_value || '',
            search_field: params.search_field || 'shipment_sn',
            sids: params.sids || '',
            mids: params.mids || '',
            wid: params.wid || '',
            logistics_type: params.logistics_type || [],
            status: params.status,
            print_status: params.print_status || '',
            pick_status: params.pick_status || '',
            time_type: params.time_type,
            start_date: params.start_date,
            end_date: params.end_date,
            offset: params.offset !== undefined ? params.offset : 0,
            length: params.length !== undefined ? params.length : 20,
            is_delete: params.is_delete !== undefined ? params.is_delete : 2
        };
        
        logger.info('开始调用领星API');
        
        // 使用HttpClient发起POST请求
        const response = await httpClient.post(
            '/erp/sc/routing/storage/shipment/getInboundShipmentList',
            appId,
            access_token,
            requestParams,
            logger
        );
        
        logger.info('API响应:', response);
        
        // 检查响应状态
        if (response.code === 0) {
            const { data, request_id, response_time } = response;
            logger.info(`查询成功，获取到 ${data.list ? data.list.length : 0} 个发货单`);
            
            return buildSuccessResponse(data, {
                total: data.list ? data.list.length : 0,
                request_id,
                response_time
            });
        } else {
            const { msg, message, error_details, request_id, code } = response;
            logger.error('API返回错误:', msg || message);
            if (error_details && error_details.length > 0) {
                logger.error('错误详情:', error_details);
            }
            
            return buildErrorResponse('查询发货单列表失败', msg || message, {
                error_details: error_details || [],
                request_id,
                code
            });
        }
        
    } catch (error) {
        const { message } = error;
        logger.error('领星发货单列表查询失败:', message);
        return buildErrorResponse('系统错误', message);
    }
};

/**
 * 构建成功响应
 * @param {*} data - 响应数据
 * @param {Object} summary - 汇总信息
 * @returns {Object} 成功响应对象
 */
function buildSuccessResponse(data, summary = {}) {
    return {
        success: true,
        data,
        summary
    };
}

/**
 * 构建错误响应
 * @param {string} message - 错误消息
 * @param {string} error - 错误详情
 * @param {Object} extra - 额外信息
 * @returns {Object} 错误响应对象
 */
function buildErrorResponse(message, error, extra = {}) {
    return {
        success: false,
        message,
        error,
        ...extra
    };
}