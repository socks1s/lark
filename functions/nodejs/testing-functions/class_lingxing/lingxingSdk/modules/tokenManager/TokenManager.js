/**
 * Token管理器 (TokenManager)
 * 负责领星API的Token生成、刷新、缓存管理和应用凭证获取
 */

const HttpClient = require('../httpClient/HttpClient');

class TokenManager {
    constructor(logger) {
        if (!logger) {
            throw new Error('TokenManager必须传入logger实例');
        }
        this.BASE_HOST = 'https://openapi.lingxing.com';
        this.tokenCache = new Map(); // 内存缓存
        this.httpClient = new HttpClient(); // 使用HttpClient处理HTTP请求
        this.logger = logger; // 存储传入的logger实例
    }

    /**
     * 获取应用凭证 (getCredentials)
     * 从飞书全局变量获取lingxingAppId和lingxingAppSecret配置
     * @returns {Promise<Object>} 包含appId和appSecret的对象
     */
    async getCredentials() {
        try {
            const appId = await application.globalVar.getVar("lingxingAppId");
            const appSecret = await application.globalVar.getVar("lingxingAppSecret");
            
            if (!appId || !appSecret) {
                throw new Error('无法获取领星应用凭证，请检查飞书全局变量配置');
            }
            
            return { appId, appSecret };
        } catch (error) {
            throw new Error(`获取应用凭证失败: ${error.message}`);
        }
    }

    /**
     * 获取Token (generateToken)
     * 自动获取凭证并生成access-token和refresh-token
     * @returns {Promise<Object>} Token信息
     */
    async generateToken() {
        // 自动获取凭证
        const credentials = await this.getCredentials();
        const { appId, appSecret } = credentials;
        
        const path = '/api/auth-server/oauth/access-token';
        const params = { appId, appSecret };
        const url = this.BASE_HOST + path;
        
        this.logger.info('开始生成Token', { appId });
        
        try {
            // 使用HttpClient的restQueryUrl和baseRequest方法
            const postUrl = this.httpClient.restQueryUrl(url, params);
            const response = await this.httpClient.baseRequest(postUrl, 'POST', '', {}, this.logger);
            
            if (Number(response.code) !== 200) {
                this.logger.error('生成Token失败', { code: response.code, message: response.data?.throwable });
                throw new Error(response.data?.throwable || '生成Token失败');
            }
            
            // 缓存Token
            const tokenData = response.data;
            await this.setTokenCache(appId, tokenData);
            
            this.logger.info('Token生成成功', { appId, expiresIn: tokenData.expires_in });
            return tokenData;
        } catch (error) {
            this.logger.error('生成Token异常', { error: error.message });
            throw error;
        }
    }

    /**
     * 刷新Token (refreshToken)
     * 自动获取凭证和refreshToken，刷新访问令牌
     * @param {string} [refreshToken] - 刷新令牌（可选，不传则从缓存自动获取）
     * @returns {Promise<Object>} 新的Token信息
     */
    async refreshToken(refreshToken = null) {
        // 自动获取凭证
        const credentials = await this.getCredentials();
        const { appId } = credentials;
        
        // 如果没有传入refreshToken，尝试从缓存获取
        if (!refreshToken) {
            const cachedToken = await this.getTokenCache(appId);
            if (cachedToken && cachedToken.refresh_token) {
                refreshToken = cachedToken.refresh_token;
                this.logger.info('从缓存获取refreshToken', { appId });
            } else {
                // 缓存中没有refreshToken，主动调用generateToken生成新Token
                this.logger.info('缓存中无可用refreshToken，主动生成新Token', { appId });
                const newTokenData = await this.generateToken();
                if (newTokenData && newTokenData.refresh_token) {
                    refreshToken = newTokenData.refresh_token;
                    this.logger.info('成功生成新Token并获取refreshToken', { appId });
                } else {
                    throw new Error('生成新Token失败或返回的Token中无refreshToken');
                }
            }
        }
        
        const path = '/api/auth-server/oauth/refresh';
        const params = { appId, refreshToken };
        const url = this.BASE_HOST + path;
        
        this.logger.info('开始刷新Token', { appId });
        
        try {
            // 使用HttpClient的restQueryUrl和baseRequest方法
            const postUrl = this.httpClient.restQueryUrl(url, params);
            const response = await this.httpClient.baseRequest(postUrl, 'POST', '', {}, this.logger);
            
            if (Number(response.code) !== 200) {
                this.logger.error('刷新Token失败', { code: response.code, message: response.data?.throwable });
                throw new Error(response.data?.throwable || '刷新Token失败');
            }
            
            // 更新缓存
            const tokenData = response.data;
            await this.setTokenCache(appId, tokenData);
            
            this.logger.info('Token刷新成功', { appId, expiresIn: tokenData.expires_in });
            return tokenData;
        } catch (error) {
            this.logger.error('刷新Token异常', { error: error.message });
            throw error;
        }
    }

    /**
     * Token缓存 - 设置缓存
     * @param {string} appId - 应用ID
     * @param {Object} tokenData - Token数据
     */
    async setTokenCache(appId, tokenData) {
        const cacheKey = `lingxing_token_${appId}`;
        const cacheData = {
            ...tokenData,
            cachedAt: Date.now(),
            expiresAt: Date.now() + (tokenData.expires_in * 1000) - 300000 // 提前5分钟过期
        };
        
        try {
            // 使用飞书全局变量进行持久化缓存
            await application.globalVar.setVar(cacheKey, JSON.stringify(cacheData));
            // 同时保存到内存缓存以提高性能
            this.tokenCache.set(cacheKey, cacheData);
        } catch (error) {
            // 如果全局变量设置失败，至少保存到内存缓存
            this.tokenCache.set(cacheKey, cacheData);
        }
    }

    /**
     * Token缓存 - 获取缓存
     * @param {string} appId - 应用ID
     * @returns {Promise<Object|null>} 缓存的Token数据
     */
    async getTokenCache(appId) {
        const cacheKey = `lingxing_token_${appId}`;
        
        // 先尝试从内存缓存获取
        let cachedData = this.tokenCache.get(cacheKey);
        
        // 如果内存缓存没有，尝试从全局变量获取
        if (!cachedData) {
            try {
                const globalCacheData = await application.globalVar.getVar(cacheKey);
                if (globalCacheData) {
                    cachedData = JSON.parse(globalCacheData);
                    // 恢复到内存缓存
                    this.tokenCache.set(cacheKey, cachedData);
                }
            } catch (error) {
                // 忽略全局变量获取错误
            }
        }
        
        if (!cachedData) {
            return null;
        }
        
        // 检查是否过期
        if (Date.now() > cachedData.expiresAt) {
            // 清除过期缓存
            this.tokenCache.delete(cacheKey);
            try {
                await application.globalVar.setVar(cacheKey, '');
            } catch (error) {
                // 忽略清除错误
            }
            return null;
        }
        
        return cachedData;
    }

    /**
     * Token缓存 - 清除缓存
     * @param {string} appId - 应用ID（可选，不传则清除所有缓存）
     */
    async clearTokenCache(appId = null) {
        if (appId) {
            const cacheKey = `lingxing_token_${appId}`;
            this.tokenCache.delete(cacheKey);
            try {
                await application.globalVar.setVar(cacheKey, '');
            } catch (error) {
                // 忽略清除错误
            }
        } else {
            this.tokenCache.clear();
            // 注意：无法批量清除全局变量，需要具体的appId
        }
    }

    /**
     * 获取有效的访问令牌
     * 优先从缓存获取，如果缓存无效则重新生成
     * @returns {Promise<Object>} 包含访问令牌和来源信息的对象
     */
    async getValidAccessToken() {
        // 自动获取凭证
        const credentials = await this.getCredentials();
        const { appId, appSecret } = credentials;
        
        // 先尝试从缓存获取
        const cachedToken = await this.getTokenCache(appId);
        if (cachedToken) {
            this.logger.info('使用缓存Token', { appId });
            return {
                access_token: cachedToken.access_token,
                source: 'cache',
                message: '从缓存获取有效Token',
                cachedAt: new Date(cachedToken.cachedAt).toISOString(),
                expiresAt: new Date(cachedToken.expiresAt).toISOString()
            };
        }
        
        // 缓存无效，重新生成
        this.logger.info('缓存Token无效，重新生成', { appId });
        const tokenData = await this.generateToken();
        return {
            access_token: tokenData.access_token,
            source: 'regenerated',
            message: '重新生成新Token',
            expires_in: tokenData.expires_in,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * 检查Token是否有效
     * @param {Object} tokenData - Token数据
     * @returns {boolean} 是否有效
     */
    isTokenValid(tokenData) {
        if (!tokenData || !tokenData.access_token) {
            return false;
        }
        
        if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
            return false;
        }
        
        return true;
    }
}

module.exports = TokenManager;