/**
 * HTTP客户端 (HttpClient)
 * 负责领星API的HTTP请求处理、签名生成和响应处理
 */

const axios = require('axios');
const md5 = require('md5');
const CryptoJS = require('crypto-js');
const Qs = require('qs');

class HttpClient {
    constructor() {
        this.BASE_HOST = 'https://openapi.lingxing.com';
        this.defaultTimeout = 30000; // 30秒超时
    }

    /**
     * GET请求 (get)
     * 发起GET请求到领星API
     * @param {string} routeName - API路由名称
     * @param {string} appId - 应用ID
     * @param {string} accessToken - 访问令牌
     * @param {Object} params - 请求参数
     * @param {Object} logger - 日志对象
     * @returns {Promise<Object>} API响应数据
     */
    async get(routeName, appId, accessToken, params = {}, logger) {
        return await this.request('GET', routeName, appId, accessToken, params, logger);
    }

    /**
     * POST请求 (post)
     * 发起POST请求到领星API
     * @param {string} routeName - API路由名称
     * @param {string} appId - 应用ID
     * @param {string} accessToken - 访问令牌
     * @param {Object} params - 请求参数
     * @param {Object} logger - 日志对象
     * @returns {Promise<Object>} API响应数据
     */
    async post(routeName, appId, accessToken, params = {}, logger) {
        return await this.request('POST', routeName, appId, accessToken, params, logger);
    }

    /**
     * 通用HTTP请求方法
     * @param {string} method - 请求方法（GET/POST）
     * @param {string} routeName - API路由名称
     * @param {string} appId - 应用ID
     * @param {string} accessToken - 访问令牌
     * @param {Object} params - 请求参数
     * @param {Object} logger - 日志对象
     * @returns {Promise<Object>} API响应数据
     */
    async request(method, routeName, appId, accessToken, params = {}, logger) {
        // 构建基础参数
        const baseParam = {
            'access_token': accessToken,
            'app_key': appId,
            timestamp: Math.round(new Date().getTime() / 1000)
        };
        
        // 合并参数用于签名
        const signParams = Object.assign({}, baseParam, params);
        const sign = this.generateSign(signParams, appId);
        baseParam.sign = sign;
        
        let url = this.BASE_HOST + routeName;
        let headers = {};
        let queryParam = params;
        
        // 根据请求方法处理参数
        if (method.toUpperCase() !== 'GET') {
            headers = { "Content-Type": "application/json" };
            url = this.restQueryUrl(url, baseParam);
        } else {
            queryParam = Object.assign({}, params, baseParam);
        }
        
        logger?.info('发起业务API请求', { 
            method, 
            routeName, 
            appId, 
            paramsCount: Object.keys(params).length 
        });
        
        try {
            const response = await this.baseRequest(url, method, queryParam, headers, logger);
            
            // 处理响应
            return this.handleResponse(response, logger);
        } catch (error) {
            return this.handleError(error, logger);
        }
    }

    /**
     * 签名生成 (generateSign)
     * 根据参数生成领星API所需的签名
     * @param {Object} params - 参数对象
     * @param {string} appKey - 应用密钥
     * @returns {string} 生成的签名
     */
    generateSign(params, appKey) {
        // 对参数进行排序
        const paramsArr = Object.keys(params).sort();
        
        // 构建参数字符串
        const stringArr = paramsArr.map(key => {
            const value = this.isPlainObject(params[key]) ? JSON.stringify(params[key]) : String(params[key]);
            return `${key}=${value}`;
        });
        
        const paramsUrl = stringArr.join('&');
        const upperUrl = md5(paramsUrl).toString().toUpperCase();
        const encryptedString = this.encrypt(upperUrl, appKey);
        
        return encryptedString;
    }

    /**
     * AES/ECB/PKCS5PADDING加密
     * @param {string} content - 待加密内容
     * @param {string} appKey - 加密密钥
     * @returns {string} 加密后的字符串
     */
    encrypt(content, appKey) {
        const _key = CryptoJS.enc.Utf8.parse(appKey);
        const encryptedECB = CryptoJS.AES.encrypt(content.trim(), _key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return encryptedECB.toString();
    }

    /**
     * 判断指定参数是否是一个纯粹的对象或数组
     * @param {*} val - 待判断的值
     * @returns {boolean} 是否为纯对象或数组
     */
    isPlainObject(val) {
        return Object.prototype.toString.call(val) === '[object Object]' || Array.isArray(val);
    }

    /**
     * 对URL处理成REST模式，并对参数编码
     * @param {string} url - 基础URL
     * @param {Object} params - 参数对象
     * @returns {string} 处理后的URL
     */
    restQueryUrl(url, params) {
        const paramsUrl = Qs.stringify(params);
        return `${url}${paramsUrl ? '?' : ''}${paramsUrl}`;
    }

    /**
     * 封装基础请求方法
     * @param {string} url - 请求URL
     * @param {string} method - 请求方法（GET/POST）
     * @param {Object} params - 请求参数
     * @param {Object} headers - 请求头
     * @param {Object} logger - 日志对象
     * @returns {Promise<Object>} 接口响应数据
     */
    async baseRequest(url, method, params, headers, logger) {
        const [_params, _data] = method.toUpperCase() === 'GET' ? [params, ''] : ['', params];
        
        try {
            const response = await axios({
                url: url,
                method: method,
                params: _params,
                data: _data,
                headers: headers || {},
                timeout: this.defaultTimeout
            });
            
            logger?.info('HTTP请求成功', { 
                status: response.status,
                responseSize: JSON.stringify(response.data).length 
            });
            
            return response.data;
        } catch (error) {
            logger?.error('HTTP请求失败', { 
                error: error.message,
                code: error.code,
                status: error.response?.status 
            });
            throw error;
        }
    }

    /**
     * 处理API响应
     * @param {Object} response - API响应数据
     * @param {Object} logger - 日志对象
     * @returns {Object} 处理后的响应数据
     */
    handleResponse(response, logger) {
        // 检查响应状态
        if (response.code && Number(response.code) !== 200) {
            logger?.error('API业务错误', { 
                code: response.code, 
                message: response.data?.throwable || response.message 
            });
            
            throw new Error(`API业务错误 [${response.code}]: ${response.data?.throwable || response.message || '未知错误'}`);
        }
        
        logger?.info('API响应处理成功', { 
            hasData: !!response.data,
            dataType: typeof response.data 
        });
        
        return response;
    }

    /**
     * 处理请求错误
     * @param {Error} error - 错误对象
     * @param {Object} logger - 日志对象
     * @throws {Error} 处理后的错误
     */
    handleError(error, logger) {
        let errorMessage = '请求失败';
        let errorCode = 'UNKNOWN_ERROR';
        
        if (error.response) {
            // 服务器响应错误
            errorCode = `HTTP_${error.response.status}`;
            errorMessage = `HTTP错误 ${error.response.status}: ${error.response.statusText}`;
            
            if (error.response.data) {
                errorMessage += ` - ${JSON.stringify(error.response.data)}`;
            }
        } else if (error.request) {
            // 网络错误
            errorCode = 'NETWORK_ERROR';
            errorMessage = '网络请求失败，请检查网络连接';
        } else if (error.code === 'ECONNABORTED') {
            // 超时错误
            errorCode = 'TIMEOUT_ERROR';
            errorMessage = '请求超时，请稍后重试';
        } else {
            // 其他错误
            errorMessage = error.message || '未知错误';
        }
        
        logger?.error('HTTP客户端错误处理', { 
            errorCode, 
            errorMessage, 
            originalError: error.message 
        });
        
        const processedError = new Error(errorMessage);
        processedError.code = errorCode;
        processedError.originalError = error;
        
        throw processedError;
    }

    /**
     * 批量请求方法
     * @param {Array} requests - 请求配置数组
     * @param {Object} options - 批量请求选项
     * @param {Object} logger - 日志对象
     * @returns {Promise<Array>} 批量请求结果
     */
    async batchRequest(requests, options = {}, logger) {
        const { 
            concurrency = 5, // 并发数
            retryCount = 2,   // 重试次数
            retryDelay = 1000 // 重试延迟(ms)
        } = options;
        
        logger?.info('开始批量请求', { 
            requestCount: requests.length, 
            concurrency, 
            retryCount 
        });
        
        const results = [];
        const chunks = this.chunkArray(requests, concurrency);
        
        for (const chunk of chunks) {
            const chunkPromises = chunk.map(async (requestConfig, index) => {
                const { method, routeName, appId, accessToken, params } = requestConfig;
                
                for (let attempt = 0; attempt <= retryCount; attempt++) {
                    try {
                        const result = await this.request(method, routeName, appId, accessToken, params, logger);
                        return { success: true, data: result, index: requestConfig.index || index };
                    } catch (error) {
                        if (attempt === retryCount) {
                            logger?.error('批量请求项失败', { 
                                index: requestConfig.index || index, 
                                error: error.message 
                            });
                            return { success: false, error: error.message, index: requestConfig.index || index };
                        }
                        
                        // 等待后重试
                        await this.sleep(retryDelay * (attempt + 1));
                    }
                }
            });
            
            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);
        }
        
        const successCount = results.filter(r => r.success).length;
        logger?.info('批量请求完成', { 
            total: results.length, 
            success: successCount, 
            failed: results.length - successCount 
        });
        
        return results;
    }

    /**
     * 数组分块工具方法
     * @param {Array} array - 原数组
     * @param {number} size - 块大小
     * @returns {Array} 分块后的数组
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * 延迟工具方法
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} Promise对象
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 设置默认超时时间
     * @param {number} timeout - 超时时间(毫秒)
     */
    setTimeout(timeout) {
        this.defaultTimeout = timeout;
    }

    /**
     * 获取当前超时设置
     * @returns {number} 当前超时时间(毫秒)
     */
    getTimeout() {
        return this.defaultTimeout;
    }
}

module.exports = HttpClient;