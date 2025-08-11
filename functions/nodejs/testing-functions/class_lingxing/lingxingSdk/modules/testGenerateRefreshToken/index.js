/**
 * @description 领星SDK云函数主入口 - 提供领星API的统一调用接口，包括token管理和业务接口调用
 * @param {Object} params - 参数对象
 * @param {string} params.action - 操作类型：'generateToken'|'refreshToken'|'httpRequest'|'getValidToken'
 * @param {string} params.appId - 企业的AppID（可选，默认从全局变量获取）
 * @param {string} params.appSecret - 企业的AppSecret（仅generateToken时需要，可选，默认从全局变量获取）
 * @param {string} params.accessToken - 访问令牌（httpRequest时需要）
 * @param {string} params.refreshToken - 刷新令牌（refreshToken时需要）
 * @param {string} params.routeName - API路径（httpRequest时需要）
 * @param {string} params.method - 请求方法：'GET'|'POST'（httpRequest时需要，默认GET）
 * @param {Object} params.requestParams - 请求参数（httpRequest时需要，默认空对象）
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回统一格式的结果对象，包含success、message、data、code字段
 */

const TokenManager = require('../tokenManager/TokenManager');
const HttpClient = require('../httpClient/HttpClient');

module.exports = async function (params, context, logger) {
    // 函数开始执行的logger输出（必须）
    logger.info('领星SDK云函数主入口开始执行');
    
    // 入参解构赋值（必须）
    const {
        action,
        appId,
        appSecret,
        accessToken,
        refreshToken,
        routeName,
        method = 'GET',
        requestParams = {}
    } = params;
    
    // 预构建结果对象（必须）
    const result = {
        success: false,
        message: '',
        data: null,
        code: null
    };

    try {
        logger.info('开始处理请求', { action, routeName, method });

        // 参数验证
        if (!action) {
            result.message = 'action参数不能为空';
            logger.info('参数验证失败：action参数不能为空');
            return result;
        }

        // 初始化TokenManager和HttpClient
        const tokenManager = new TokenManager(logger);
        const httpClient = new HttpClient(logger);

        // 根据action执行不同操作
        switch (action) {
            case 'generateToken':
                logger.info('执行generateToken操作');
                
                // generateToken方法已优化，自动获取凭证，无需传递任何参数
                result.data = await tokenManager.generateToken();
                break;

            case 'refreshToken':
                logger.info('执行refreshToken操作');
                
                // refreshToken方法已优化，可以传递refreshToken参数或自动从缓存获取
                if (refreshToken) {
                    // 如果提供了refreshToken参数，直接使用
                    result.data = await tokenManager.refreshToken(refreshToken);
                } else {
                    // 如果没有提供refreshToken参数，让TokenManager自动处理
                    result.data = await tokenManager.refreshToken();
                }
                break;

            case 'httpRequest':
                if (!accessToken || !routeName) {
                    result.message = 'httpRequest操作需要accessToken和routeName参数';
                    logger.info('参数验证失败：httpRequest操作缺少必要参数');
                    return result;
                }
                logger.info('执行httpRequest操作');
                
                // 获取appId（如果未提供则从全局变量获取）
                let requestAppId = appId;
                if (!requestAppId) {
                    const credentials = await tokenManager.getCredentials();
                    requestAppId = credentials.appId;
                }
                
                if (method.toUpperCase() === 'GET') {
                    result.data = await httpClient.get(routeName, requestAppId, accessToken, requestParams);
                } else {
                    result.data = await httpClient.post(routeName, requestAppId, accessToken, requestParams);
                }
                break;

            case 'getValidToken':
                logger.info('执行getValidToken操作');
                
                // 调用优化后的getValidAccessToken方法，无需传递任何参数
                const validTokenResult = await tokenManager.getValidAccessToken();
                result.data = validTokenResult;
                break;

            default:
                result.message = `不支持的操作类型: ${action}`;
                logger.info('不支持的操作类型', { action });
                return result;
        }

        result.success = true;
        result.message = '操作成功';
        logger.info('领星SDK云函数主入口执行成功', { action, success: true });

    } catch (error) {
        logger.error('领星SDK云函数主入口执行失败', { 
            error: error.message, 
            stack: error.stack,
            action 
        });
        result.message = `执行失败: ${error.message}`;
        result.data = null;
        
        // 如果错误响应中包含code，则设置到结果中
        if (error.code) {
            result.code = error.code;
        }
    }

    return result;
};