/**
 * 领星ERP AccessToken获取和续约函数
 * 支持获取新token和续约现有token
 */

const https = require('https');

module.exports = async function (params, context, logger) {
  logger.info('开始执行领星AccessToken操作');
  
  try {
    // 参数解构和默认值设置（硬编码debug参数）
    const { 
      appId = 'ak_6p4lBDrt1aPPF', 
      appSecret = 'b+llA9QRTsg1Dl3fpFLqrg==', 
      operation = 'get',
      accessToken = null,
      refreshToken = null
    } = params;
    
    // 参数校验
    validateParams(appId, appSecret, operation, accessToken, refreshToken);
    
    logger.info('参数校验通过', { 
      appId, 
      operation,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });
    
    // 执行对应操作
    const result = await executeOperation(operation, appId, appSecret, accessToken, refreshToken, logger);
    
    logger.info('领星AccessToken操作成功', {
      operation,
      hasToken: !!result.access_token,
      expiresIn: result.expires_in
    });
    
    return buildSuccessResponse(result, operation, appId, appSecret);
    
  } catch (error) {
    logger.error('领星AccessToken操作失败:', error.message);
    return buildErrorResponse(error, params);
  }
};

/**
 * 参数校验函数
 */
function validateParams(appId, appSecret, operation, accessToken, refreshToken) {
  if (!appId || !appSecret) {
    throw new Error('appId和appSecret为必填参数');
  }
  
  if (operation === 'refresh' && (!accessToken || !refreshToken)) {
    throw new Error('续约操作需要提供accessToken和refreshToken');
  }
  
  if (!['get', 'refresh'].includes(operation)) {
    throw new Error('不支持的操作类型，支持的操作: get, refresh');
  }
}

/**
 * 执行对应操作
 */
async function executeOperation(operation, appId, appSecret, accessToken, refreshToken, logger) {
  if (operation === 'get') {
    return await getAccessToken(appId, appSecret, logger);
  } else if (operation === 'refresh') {
    return await refreshAccessToken(appId, accessToken, refreshToken, logger);
  }
}

/**
 * 构建成功响应
 */
function buildSuccessResponse(result, operation, appId, appSecret) {
  return {
    success: true,
    code: 0,
    message: '操作成功',
    data: {
      ...result,
      appId,
      appSecret
    },
    meta: {
      operation,
      timestamp: new Date().toISOString(),
      appId
    }
  };
}

/**
 * 构建错误响应
 */
function buildErrorResponse(error, params) {
  return {
    success: false,
    code: -1,
    message: `领星AccessToken操作失败: ${error.message}`,
    error: {
      type: error.constructor.name,
      message: error.message,
      timestamp: new Date().toISOString()
    },
    meta: {
      operation: params.operation || 'get',
      timestamp: new Date().toISOString(),
      appId: params.appId
    }
  };
}

/**
 * 获取新的AccessToken
 */
async function getAccessToken(appId, appSecret, logger) {
  logger.info('开始获取新的AccessToken');
  
  const url = 'https://openapi.lingxing.com/api/auth-server/oauth/access-token';
  const requestData = `appId=${encodeURIComponent(appId)}&appSecret=${encodeURIComponent(appSecret)}`;
  
  logger.info('发送token请求', { url, appId });
  
  const response = await makeHttpsRequest(url, 'POST', requestData, {
    'Content-Type': 'application/x-www-form-urlencoded'
  }, true);
  
  logger.info('AccessToken获取成功', {
    hasToken: !!response.data?.access_token,
    expiresIn: response.data?.expires_in
  });
  
  // 领星API返回格式: { code: "200", msg: "OK", data: { access_token, refresh_token, expires_in } }
  if (response.code === '200' && response.data) {
    return response.data;
  } else {
    throw new Error(`领星API返回错误: ${response.msg || '未知错误'}`);
  }
}

/**
 * 续约AccessToken
 */
async function refreshAccessToken(appId, accessToken, refreshToken, logger) {
  logger.info('开始续约AccessToken');
  
  const url = 'https://openapi.lingxing.com/api/auth-server/oauth/refresh-token';
  const requestData = `appId=${encodeURIComponent(appId)}&access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
  
  logger.info('发送token续约请求', { url, appId });
  
  const response = await makeHttpsRequest(url, 'POST', requestData, {
    'Content-Type': 'application/x-www-form-urlencoded'
  }, true);
  
  logger.info('AccessToken续约成功', {
    hasToken: !!response.data?.access_token,
    expiresIn: response.data?.expires_in
  });
  
  // 领星API返回格式: { code: "200", msg: "OK", data: { access_token, refresh_token, expires_in } }
  if (response.code === '200' && response.data) {
    return response.data;
  } else {
    throw new Error(`领星API返回错误: ${response.msg || '未知错误'}`);
  }
}

/**
 * 发送HTTPS请求
 */
function makeHttpsRequest(url, method, data, headers = {}, isFormData = false) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = isFormData ? data : JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Feishu-Cloud-Function/1.0',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      },
      timeout: 30000
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsedData.message || responseData}`));
          }
        } catch (parseError) {
          reject(new Error(`响应解析失败: ${parseError.message}, 原始响应: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`请求失败: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    req.write(postData);
    req.end();
  });
}