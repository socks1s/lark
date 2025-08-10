/**
 * 领星API - 查询亚马逊店铺列表
 * 查询得到企业已授权到领星ERP的全部亚马逊店铺信息
 * API Path: /erp/sc/data/seller/lists
 */

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

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
 * 云函数主入口
 * @param {Object} params - 输入参数
 * @param {string} params.access_token - 访问令牌
 * @param {string} params.app_key - 企业ID
 * @param {string} params.appId - 应用ID（用于签名）
 * @param {Object} params.filters - 可选的筛选条件
 * @param {Object} context - 云函数上下文
 * @param {Object} logger - 日志对象
 * @returns {Promise<Object>} 亚马逊店铺列表数据
 */
module.exports = async function (params, context, logger) {
    logger.info('开始执行领星亚马逊店铺列表查询');
    
    try {
        const result = await queryAmazonStores(params, logger);
        
        // 如果有筛选条件，应用筛选
        if (params.filters && result.success && result.data) {
            const filteredData = filterStores(result.data, params.filters);
            result.data = filteredData;
            result.summary.total = filteredData.length;
            logger.info(`应用筛选条件后，剩余 ${filteredData.length} 个店铺`);
        }
        
        return result;
    } catch (error) {
        logger.error('领星亚马逊店铺列表查询失败:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * 查询亚马逊店铺列表
 * @param {Object} config - 配置参数
 * @param {string} config.access_token - 访问令牌
 * @param {string} config.app_key - 企业ID
 * @param {string} config.appId - 应用ID（用于签名）
 * @param {Object} logger - 日志对象
 * @returns {Promise<Object>} 亚马逊店铺列表数据
 */
async function queryAmazonStores(config, logger = console) {
    try {
        // 验证必要参数
        if (!config.access_token) {
            throw new Error('access_token 参数不能为空');
        }
        if (!config.app_key) {
            throw new Error('app_key 参数不能为空');
        }
        if (!config.appId) {
            throw new Error('appId 参数不能为空');
        }
        
        logger.info('开始查询亚马逊店铺列表...');
        
        // 构建请求参数
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const params = {
            access_token: config.access_token,
            app_key: config.app_key,
            timestamp: timestamp
        };
        
        // 生成签名
        const sign = generateSign(params, config.appId);
        params.sign = sign;
        
        // 构建请求URL
        const baseUrl = 'https://openapi.lingxing.com/erp/sc/data/seller/lists';
        const queryString = querystring.stringify(params);
        const requestUrl = `${baseUrl}?${queryString}`;
        
        logger.info('请求URL构建完成');
        logger.info('请求参数:', {
            access_token: config.access_token.substring(0, 10) + '...',
            app_key: config.app_key,
            timestamp: timestamp,
            sign: sign.substring(0, 10) + '...'
        });
        
        // 发起请求
        const response = await httpsGet(requestUrl);
        
        // 检查响应状态
        if (response.code === 0) {
            logger.info(`查询成功，获取到 ${response.data.length} 个亚马逊店铺`);
            
            // 输出店铺概览
            const storeSummary = {
                total: response.data.length,
                regions: {},
                status: {},
                adsEnabled: 0
            };
            
            response.data.forEach(store => {
                // 统计地区分布
                storeSummary.regions[store.region] = (storeSummary.regions[store.region] || 0) + 1;
                
                // 统计状态分布
                const statusText = getStatusText(store.status);
                storeSummary.status[statusText] = (storeSummary.status[statusText] || 0) + 1;
                
                // 统计广告授权
                if (store.has_ads_setting === 1) {
                    storeSummary.adsEnabled++;
                }
            });
            
            logger.info('店铺分布:', storeSummary);
            
            return {
                success: true,
                data: response.data,
                summary: {
                    ...storeSummary,
                    request_id: response.request_id,
                    response_time: response.response_time
                }
            };
        } else {
            logger.error('API返回错误:', response.message);
            if (response.error_details && response.error_details.length > 0) {
                logger.error('错误详情:', response.error_details);
            }
            
            return {
                success: false,
                error: response.message,
                error_details: response.error_details || [],
                request_id: response.request_id,
                code: response.code
            };
        }
        
    } catch (error) {
        logger.error('查询亚马逊店铺列表失败:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 根据条件筛选店铺
 * @param {Array} stores - 店铺列表
 * @param {Object} filters - 筛选条件
 * @param {string} filters.region - 地区筛选
 * @param {string} filters.country - 国家筛选
 * @param {number} filters.status - 状态筛选
 * @param {number} filters.has_ads_setting - 广告授权筛选
 * @returns {Array} 筛选后的店铺列表
 */
function filterStores(stores, filters = {}) {
    let filteredStores = [...stores];
    
    if (filters.region) {
        filteredStores = filteredStores.filter(store => 
            store.region.toLowerCase() === filters.region.toLowerCase()
        );
    }
    
    if (filters.country) {
        filteredStores = filteredStores.filter(store => 
            store.country.includes(filters.country)
        );
    }
    
    if (filters.status !== undefined && filters.status !== null) {
        filteredStores = filteredStores.filter(store => 
            store.status === filters.status
        );
    }
    
    if (filters.has_ads_setting !== undefined && filters.has_ads_setting !== null) {
        filteredStores = filteredStores.filter(store => 
            store.has_ads_setting === filters.has_ads_setting
        );
    }
    
    return filteredStores;
}

/**
 * 获取状态文本描述
 * @param {number} status - 状态码
 * @returns {string} 状态描述
 */
function getStatusText(status) {
    const statusMap = {
        0: '停止同步',
        1: '正常',
        2: '授权异常',
        3: '欠费停服'
    };
    return statusMap[status] || '未知状态';
}

/**
 * 获取店铺映射关系
 * @param {Array} stores - 店铺列表
 * @returns {Object} 映射关系对象
 */
function getStoreMappings(stores) {
    const mappings = {
        sidToSellerId: {},
        sellerIdToSid: {},
        sidToMarketplaceId: {},
        marketplaceIdToSid: {}
    };
    
    stores.forEach(store => {
        mappings.sidToSellerId[store.sid] = store.seller_id;
        mappings.sellerIdToSid[store.seller_id] = store.sid;
        mappings.sidToMarketplaceId[store.sid] = store.marketplace_id;
        mappings.marketplaceIdToSid[store.marketplace_id] = store.sid;
    });
    
    return mappings;
}

// 导出工具函数供其他模块使用
module.exports.queryAmazonStores = queryAmazonStores;
module.exports.filterStores = filterStores;
module.exports.getStoreMappings = getStoreMappings;
module.exports.getStatusText = getStatusText;
module.exports.generateSign = generateSign;