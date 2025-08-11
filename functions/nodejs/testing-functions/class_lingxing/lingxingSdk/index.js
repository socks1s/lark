/**
 * 领星SDK云函数
 * 提供领星API的统一调用接口，包括token管理和业务接口调用
 * 
 * @param {Object} params - 输入参数
 * @param {string} params.action - 操作类型：'generateToken'|'refreshToken'|'httpRequest'
 * @param {string} params.appId - 企业的AppID
 * @param {string} params.appSecret - 企业的AppSecret（仅generateToken时需要）
 * @param {string} params.accessToken - 访问令牌（httpRequest时需要）
 * @param {string} params.refreshToken - 刷新令牌（refreshToken时需要）
 * @param {string} params.routeName - API路径（httpRequest时需要）
 * @param {string} params.method - 请求方法：'GET'|'POST'（httpRequest时需要）
 * @param {Object} params.requestParams - 请求参数（httpRequest时需要）
 * 
 * @returns {Object} 统一返回格式
 */

const axios = require('axios');
const md5 = require('md5');
const CryptoJS = require('crypto-js');
const Qs = require('qs');

const BASE_HOST = 'https://openapi.lingxing.com';

module.exports = async function (params, context, logger) {
    // 参数解构和默认值设置（硬编码debug参数）
    const {
        action,
        appId = await application.globalVar.getVar("lingxingAppId"),
        appSecret = await application.globalVar.getVar("lingxingAppSecret"),
        accessToken,
        refreshToken,
        routeName,
        method = 'GET',
        requestParams = {}
    } = params;

    // 结果对象预构建
    const result = {
        success: false,
        message: '',
        data: null,
        code: null
    };

    try {
        logger.info('领星SDK云函数开始执行', { action, appId, routeName, method });

        // 参数验证
        if (!action) {
            result.message = 'action参数不能为空';
            return result;
        }

        if (!appId) {
            result.message = 'appId参数不能为空';
            return result;
        }

        // 根据action执行不同操作
        switch (action) {
            case 'generateToken':
                if (!appSecret) {
                    result.message = 'generateToken操作需要appSecret参数';
                    return result;
                }
                result.data = await generateAccessToken(appId, appSecret, logger);
                break;

            case 'refreshToken':
                if (!refreshToken) {
                    result.message = 'refreshToken操作需要refreshToken参数';
                    return result;
                }
                result.data = await refreshTokenFunc(appId, refreshToken, logger);
                break;

            case 'httpRequest':
                if (!accessToken || !routeName) {
                    result.message = 'httpRequest操作需要accessToken和routeName参数';
                    return result;
                }
                result.data = await httpRequest(routeName, method, appId, accessToken, requestParams, logger);
                break;

            default:
                result.message = `不支持的操作类型: ${action}`;
                return result;
        }

        result.success = true;
        result.message = '操作成功';
        logger.info('领星SDK云函数执行成功', { action, success: true });

    } catch (error) {
        logger.error('领星SDK云函数执行失败', { error: error.message, stack: error.stack });
        result.message = `执行失败: ${error.message}`;
        result.data = null;
    }

    return result;
};

/**
 * AES/ECB/PKCS5PADDING加密
 */
function encrypt(content, appKey) {
    const _key = CryptoJS.enc.Utf8.parse(appKey);
    const encryptedECB = CryptoJS.AES.encrypt(content.trim(), _key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encryptedECB.toString();
}

/**
 * 根据params生成签名
 */
function generateSign(params, appKey) {
    const paramsArr = Object.keys(params).sort();//对参数进行排序
    const stringArr = paramsArr.map(key => {
        const value = isPlainObject(params[key]) ? JSON.stringify(params[key]) : String(params[key]);
        return `${key}=${value}`;
    });
    const paramsUrl = stringArr.join('&');
    const upperUrl = md5(paramsUrl).toString().toUpperCase();
    const encryptedString = encrypt(upperUrl, appKey);
    return encryptedString;
}

/**
 * 对URL处理成REST模式，并对参数编码
 */
function restQueryUrl(url, params) {
    const paramsUrl = Qs.stringify(params);
    return `${url}${paramsUrl ? '?' : ''}${paramsUrl}`;
}

/**
 * 判断指定参数是否是一个纯粹的对象或数组
 */
function isPlainObject(val) {
    return Object.prototype.toString.call(val) === '[object Object]' || Array.isArray(val);
}

/**
 * 封装请求方法
 * @param {string} url - 请求URL
 * @param {string} method - 请求方法（GET/POST）
 * @param {object} params - 请求参数
 * @param {object} headers - 请求头
 * @param {object} logger - 日志对象
 * @returns {Promise<object>} - 接口响应数据
 */
async function baseRequest(url, method, params, headers, logger) {
    const [_params, _data] = method.toUpperCase() === 'GET' ? [params, ''] : ['', params];
    
    logger.info('发起API请求', { url, method, params });
    
    try {
        const response = await axios({
            url: url,
            method: method,
            params: _params,
            data: _data,
            headers: headers || {}
        });
        
        logger.info('API请求成功', { status: response.status });
        return response.data;
    } catch (error) {
        logger.error('API请求失败', { error: error.message });
        throw error;
    }
}

/**
 * 根据appId和appSecret获取access-token和refresh-token
 */
async function generateAccessToken(appId, appSecret, logger) {
    const path = '/api/auth-server/oauth/access-token';
    const params = { appId, appSecret };
    const postUrl = restQueryUrl(BASE_HOST + path, params);
    
    const response = await baseRequest(postUrl, 'POST', '', {}, logger);
    
    if (Number(response.code) !== 200) {
        logger.error('获取token失败', { code: response.code, message: response.data?.throwable });
        throw new Error(response.data?.throwable || '获取token失败');
    }
    
    return response.data;
}

/**
 * 刷新token
 */
async function refreshTokenFunc(appId, refreshToken, logger) {
    const path = '/api/auth-server/oauth/refresh';
    const params = { appId, refreshToken };
    const postUrl = restQueryUrl(BASE_HOST + path, params);
    
    const response = await baseRequest(postUrl, 'POST', '', {}, logger);
    
    if (Number(response.code) !== 200) {
        logger.error('刷新token失败', { code: response.code, message: response.data?.throwable });
        throw new Error(response.data?.throwable || '刷新token失败');
    }
    
    return response.data;
}

/**
 * 业务接口请求
 * @param {string} routeName - 接口路由名称
 * @param {string} method - 请求方法（GET/POST）
 * @param {string} appId - 应用ID
 * @param {string} accessToken - 访问令牌
 * @param {object} params - 请求参数
 * @param {object} logger - 日志对象
 * @returns {Promise<object>} - 接口响应数据
 */
async function httpRequest(routeName, method, appId, accessToken, params, logger) {
    const baseParam = {
        'access_token': accessToken,
        'app_key': appId,
        timestamp: Math.round(new Date().getTime() / 1000)
    };
    
    const signParams = Object.assign({}, baseParam, params);
    const sign = generateSign(signParams, appId);
    baseParam.sign = sign;
    
    let url = BASE_HOST + routeName;
    let headers = {};
    let queryParam = params;
    
    if (method.toUpperCase() !== 'GET') {
        headers = { "Content-Type": "application/json" };
        url = restQueryUrl(url, baseParam);
    } else {
        queryParam = Object.assign({}, params, baseParam);
    }
    
    const response = await baseRequest(url, method, queryParam, headers, logger);
    return response;
}