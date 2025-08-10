/**
 * 领星API - 查询亚马逊市场列表
 * 获取亚马逊所有市场列表数据
 * API Path: /erp/sc/data/seller/allMarketplace
 */

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

/**
 * 云函数主入口
 * @param {Object} params - 输入参数
 * @param {Object} params.filters - 可选的筛选条件
 * @param {string} params.filters.region - 地区筛选
 * @param {string} params.filters.country - 国家筛选
 * @param {string} params.filters.code - 国家代码筛选
 * @param {Object} context - 云函数上下文
 * @param {Object} logger - 日志对象
 * @returns {Promise<Object>} 亚马逊市场列表数据
 */
module.exports = async function (params, context, logger) {
    logger.info('开始执行领星亚马逊市场列表查询');
    
    try {
        // 调用 lingxingAccessToken 函数获取认证信息
        const tokenResult = await faas.function("getLingxingAccessToken").invoke({ operation: "get" });
        
        if (!tokenResult.success) {
            const { error } = tokenResult;
            logger.error('获取访问令牌失败:', error);
            return buildErrorResponse('获取访问令牌失败', error);
        }
        
        const { access_token, appId, appSecret } = tokenResult.data;
        const app_key = appId; // app_key 就是 appId
        
        logger.info('访问令牌获取成功');
        
        // 查询亚马逊市场列表
        const result = await queryAmazonMarketplaces({
            access_token,
            app_key,
            appId
        }, logger);
        
        if (result.success) {
            const { data, summary } = result;
            logger.info('查询完成，返回结果');
            return buildSuccessResponse(data, summary);
        } else {
            const { error, error_details, request_id, code } = result;
            logger.error('查询失败:', error);
            return buildErrorResponse('查询亚马逊市场列表失败', error, {
                error_details,
                request_id,
                code
            });
        }
    } catch (error) {
        const { message } = error;
        logger.error('领星亚马逊市场列表查询失败:', message);
        return buildErrorResponse('系统错误', message);
    }
};

/**
 * 生成MD5哈希
 * @param {string} data - 要加密的数据
 * @returns {string} MD5哈希值（大写）
 */
function generateMD5(data) {
    return crypto.createHash('md5').update(data, 'utf8').digest('hex').toUpperCase();
}

/**
 * AES加密
 * @param {string} data - 要加密的数据
 * @param {string} key - 加密密钥（appId）
 * @returns {string} 加密后的字符串
 */
function aesEncrypt(data, key) {
    // 确保密钥长度为16字节（AES-128）
    let keyBuffer = Buffer.from(key, 'utf8');
    if (keyBuffer.length < 16) {
        // 如果密钥不足16字节，用0填充
        const paddedKey = Buffer.alloc(16);
        keyBuffer.copy(paddedKey);
        keyBuffer = paddedKey;
    } else if (keyBuffer.length > 16) {
        // 如果密钥超过16字节，截取前16字节
        keyBuffer = keyBuffer.slice(0, 16);
    }
    
    // 创建AES-128-ECB加密器
    const cipher = crypto.createCipheriv('aes-128-ecb', keyBuffer, null);
    cipher.setAutoPadding(true); // PKCS5PADDING
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

/**
 * 生成API签名
 * @param {Object} params - 请求参数
 * @param {string} appId - 应用ID
 * @returns {string} 签名字符串
 */
function generateSign(params, appId) {
    // 1. 参数按ASCII排序
    const sortedKeys = Object.keys(params).sort();
    
    // 2. 拼接参数字符串（排除空值）
    const paramString = sortedKeys
        .filter(key => params[key] !== '' && params[key] !== null && params[key] !== undefined)
        .map(key => `${key}=${params[key]}`)
        .join('&');
    
    // 3. MD5加密并转大写
    const md5Hash = generateMD5(paramString);
    
    // 4. AES加密
    const sign = aesEncrypt(md5Hash, appId);
    
    return sign;
}

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

/**
 * 发起HTTPS GET请求
 * @param {string} url - 请求URL
 * @returns {Promise<Object>} 响应数据
 */
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`JSON解析失败: ${error.message}`));
                }
            });
        });
        
        request.on('error', (error) => {
            reject(new Error(`请求失败: ${error.message}`));
        });
        
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('请求超时'));
        });
    });
}



/**
 * 查询亚马逊市场列表
 * @param {Object} config - 配置参数
 * @param {string} config.access_token - 访问令牌
 * @param {string} config.app_key - 企业ID
 * @param {string} config.appId - 应用ID（用于签名）
 * @param {Object} logger - 日志对象
 * @returns {Promise<Object>} 亚马逊市场列表数据
 */
async function queryAmazonMarketplaces({ access_token, app_key, appId }, logger = console) {
    try {
        // 验证必要参数
        if (!access_token) {
            throw new Error('access_token 参数不能为空');
        }
        if (!app_key) {
            throw new Error('app_key 参数不能为空');
        }
        if (!appId) {
            throw new Error('appId 参数不能为空');
        }
        
        logger.info('开始查询亚马逊市场列表...');
        
        // 构建请求参数
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const params = {
            access_token,
            app_key,
            timestamp
        };
        
        // 生成签名
        const sign = generateSign(params, appId);
        params.sign = sign;
        
        // 构建请求URL
        const baseUrl = 'https://openapi.lingxing.com/erp/sc/data/seller/allMarketplace';
        const queryString = querystring.stringify(params);
        const requestUrl = `${baseUrl}?${queryString}`;
        
        logger.info('请求URL构建完成');
        logger.info('请求参数:', {
            access_token: access_token.substring(0, 10) + '...',
            app_key,
            timestamp,
            sign: sign.substring(0, 10) + '...'
        });
        
        // 发起请求
        const response = await httpsGet(requestUrl);
        
        // API调用成功
        
        // 检查响应状态
        if (response.code === 0) {
            const { data, request_id, response_time } = response;
            logger.info(`查询成功，获取到 ${data.length} 个亚马逊市场`);
            
            // 输出市场概览
            const marketSummary = data.reduce((acc, market) => {
                acc[market.region] = (acc[market.region] || 0) + 1;
                return acc;
            }, {});
            
            logger.info('市场分布:', marketSummary);
            
            return {
                success: true,
                data,
                summary: {
                    total: data.length,
                    regions: marketSummary,
                    request_id,
                    response_time
                }
            };
        } else {
            const { msg, message, error_details, request_id, code } = response;
            logger.error('API返回错误:', msg || message);
            if (error_details && error_details.length > 0) {
                logger.error('错误详情:', error_details);
            }
            
            return {
                success: false,
                error: msg || message,
                error_details: error_details || [],
                request_id,
                code
            };
        }
        
    } catch (error) {
        const { message, stack } = error;
        logger.error('查询亚马逊市场列表失败:', message);
        logger.error('错误堆栈:', stack);
        
        return {
            success: false,
            error: message,
            stack
        };
    }
}

/**
 * 根据条件筛选市场
 * @param {Array} markets - 市场列表
 * @param {Object} filters - 筛选条件
 * @param {string} filters.region - 地区筛选
 * @param {string} filters.country - 国家筛选
 * @param {string} filters.code - 国家代码筛选
 * @returns {Array} 筛选后的市场列表
 */
function filterMarkets(markets, filters = {}) {
    let filteredMarkets = [...markets];
    
    if (filters.region) {
        filteredMarkets = filteredMarkets.filter(market => 
            market.region.toLowerCase() === filters.region.toLowerCase()
        );
    }
    
    if (filters.country) {
        filteredMarkets = filteredMarkets.filter(market => 
            market.country.includes(filters.country)
        );
    }
    
    if (filters.code) {
        filteredMarkets = filteredMarkets.filter(market => 
            market.code.toLowerCase() === filters.code.toLowerCase()
        );
    }
    
    return filteredMarkets;
}

/**
 * 获取市场映射关系
 * @param {Array} markets - 市场列表
 * @returns {Object} 映射关系对象
 */
function getMarketMappings(markets) {
    const mappings = {
        midToMarketplaceId: {},
        marketplaceIdToMid: {},
        codeToMid: {},
        midToCode: {}
    };
    
    markets.forEach(market => {
        mappings.midToMarketplaceId[market.mid] = market.marketplace_id;
        mappings.marketplaceIdToMid[market.marketplace_id] = market.mid;
        mappings.codeToMid[market.code] = market.mid;
        mappings.midToCode[market.mid] = market.code;
    });
    
    return mappings;
}

// 导出工具函数供其他模块使用
module.exports.queryAmazonMarketplaces = queryAmazonMarketplaces;
module.exports.filterMarkets = filterMarkets;
module.exports.getMarketMappings = getMarketMappings;
module.exports.generateSign = generateSign;