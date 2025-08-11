/**
 * 获取飞书云函数出口IP地址
 * 用于将IP添加到领星ERP等第三方服务的白名单中
 */

module.exports = async function (params, context, logger) {
  logger.info('开始获取飞书云函数出口IP地址');
  
  try {
    const { testUrls = [], includeHeaders = false } = params;
    
    // 默认的IP检测服务列表
    const defaultUrls = [
      'https://api.ipify.org?format=json',
      'https://httpbin.org/ip',
      'https://api.myip.com',
      'https://ipapi.co/json/',
      'https://api.ip.sb/jsonip'
    ];
    
    // 合并用户提供的URL和默认URL
    const urlsToTest = [...new Set([...testUrls, ...defaultUrls])];
    
    logger.info(`将测试 ${urlsToTest.length} 个IP检测服务`);
    
    const results = [];
    const ipAddresses = new Set();
    
    // 并发请求多个IP检测服务
    const promises = urlsToTest.map(async (url, index) => {
      try {
        logger.info(`正在请求服务 ${index + 1}: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Feishu-Cloud-Function-IP-Detector/1.0',
            'Accept': 'application/json, text/plain, */*'
          },
          timeout: 10000 // 10秒超时
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        // 提取IP地址
        let ip = null;
        if (typeof data === 'object') {
          // 尝试从常见的JSON字段中提取IP
          ip = data.ip || data.origin || data.query || data.IPv4 || data.address;
        } else if (typeof data === 'string') {
          // 如果是纯文本，直接使用
          ip = data.trim();
        }
        
        if (ip) {
          // 验证IP格式
          const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          if (ipRegex.test(ip)) {
            ipAddresses.add(ip);
            
            const result = {
              service: url,
              ip: ip,
              success: true,
              responseTime: Date.now(),
              rawData: data
            };
            
            if (includeHeaders) {
              result.headers = Object.fromEntries(response.headers.entries());
            }
            
            results.push(result);
            logger.info(`服务 ${url} 返回IP: ${ip}`);
          } else {
            logger.warn(`服务 ${url} 返回的IP格式无效: ${ip}`);
            results.push({
              service: url,
              success: false,
              error: `Invalid IP format: ${ip}`,
              rawData: data
            });
          }
        } else {
          logger.warn(`无法从服务 ${url} 提取IP地址`);
          results.push({
            service: url,
            success: false,
            error: 'Unable to extract IP address',
            rawData: data
          });
        }
        
      } catch (error) {
        logger.error(`请求服务 ${url} 失败:`, error.message);
        results.push({
          service: url,
          success: false,
          error: error.message
        });
      }
    });
    
    // 等待所有请求完成
    await Promise.allSettled(promises);
    
    // 统计结果
    const uniqueIPs = Array.from(ipAddresses);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    logger.info(`IP检测完成: 成功 ${successCount} 个, 失败 ${failureCount} 个`);
    logger.info(`检测到的唯一IP地址: ${uniqueIPs.join(', ')}`);
    
    // 生成白名单建议
    const whitelistSuggestion = {
      description: '建议添加到领星ERP白名单的IP地址',
      ips: uniqueIPs,
      format: {
        singleLine: uniqueIPs.join(','),
        multiLine: uniqueIPs.join('\n'),
        cidr: uniqueIPs.map(ip => `${ip}/32`)
      }
    };
    
    const finalResult = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalServices: urlsToTest.length,
        successfulServices: successCount,
        failedServices: failureCount,
        uniqueIPCount: uniqueIPs.length,
        detectedIPs: uniqueIPs
      },
      whitelistSuggestion,
      detailedResults: results,
      recommendations: [
        '建议将检测到的所有IP地址都添加到白名单中',
        '飞书云函数可能使用多个出口IP，建议定期检查',
        '如果检测到多个不同的IP，说明飞书使用了IP池',
        '建议在生产环境中多次运行此函数以获取完整的IP列表'
      ]
    };
    
    logger.info('飞书云函数出口IP检测完成', {
      uniqueIPs: uniqueIPs,
      successRate: `${successCount}/${urlsToTest.length}`
    });
    
    return finalResult;
    
  } catch (error) {
    logger.error('获取出口IP失败:', error.message);
    throw new Error(`获取飞书云函数出口IP失败: ${error.message}`);
  }
};