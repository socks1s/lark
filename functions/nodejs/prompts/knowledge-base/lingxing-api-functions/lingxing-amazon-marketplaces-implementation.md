# 领星亚马逊市场列表函数实现详解

## 📝 概述

本文档详细介绍了 `lingxingAmazonMarketplaces` 云函数的完整实现过程，包括API签名算法、云函数适配、配置文件设计和调试验证等关键技术环节。

## 🎯 功能目标

- **核心功能**：查询领星ERP中所有亚马逊市场列表
- **扩展功能**：支持市场筛选、数据映射和统计分析
- **云函数适配**：符合飞书低代码平台的云函数调用规范
- **调试支持**：提供完整的调试参数配置和元数据定义

## 🏗️ 技术架构

### 核心组件结构

```
lingxingAmazonMarketplaces/
├── index.js              # 主要实现逻辑
├── index.meta.json       # 云函数元数据配置
├── debug.param.json      # 调试参数配置
└── README.md            # 功能说明文档
```

### 技术栈选择

- **加密算法**：AES-128-ECB + MD5哈希
- **HTTP客户端**：Node.js原生 `https` 模块
- **参数处理**：`querystring` 模块进行URL编码
- **错误处理**：Promise-based异步错误捕获

## 🔐 API签名算法实现

### 签名生成流程

领星API采用多层加密的签名机制，确保请求的安全性：

```javascript
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
```

### AES加密实现要点

**关键技术细节**：
- **加密模式**：AES-128-ECB
- **填充方式**：PKCS5PADDING
- **密钥处理**：直接使用appId，确保16字节长度
- **输出格式**：Base64编码

```javascript
function aesEncrypt(data, key) {
    // 确保密钥长度为16字节（AES-128）
    let keyBuffer = Buffer.from(key, 'utf8');
    if (keyBuffer.length < 16) {
        const paddedKey = Buffer.alloc(16);
        keyBuffer.copy(paddedKey);
        keyBuffer = paddedKey;
    } else if (keyBuffer.length > 16) {
        keyBuffer = keyBuffer.slice(0, 16);
    }
    
    // 创建AES-128-ECB加密器
    const cipher = crypto.createCipheriv('aes-128-ecb', keyBuffer, null);
    cipher.setAutoPadding(true); // PKCS5PADDING
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}
```

## 🌐 HTTP请求处理

### HTTPS客户端实现

使用Node.js原生 `https` 模块实现稳定的API调用：

```javascript
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
```

**设计考虑**：
- **超时控制**：30秒超时机制防止请求挂起
- **错误处理**：区分网络错误和JSON解析错误
- **数据流处理**：逐块接收响应数据，避免内存溢出

## ☁️ 云函数适配实现

### 入口函数设计

云函数主入口遵循飞书低代码平台的标准格式：

```javascript
module.exports = async function (params, context, logger) {
    logger.info('开始执行领星亚马逊市场列表查询');
    
    try {
        const result = await queryAmazonMarketplaces(params, logger);
        
        // 应用筛选条件
        if (params.filters && result.success && result.data) {
            const filteredData = filterMarkets(result.data, params.filters);
            result.data = filteredData;
            result.summary.total = filteredData.length;
        }
        
        return result;
    } catch (error) {
        logger.error('领星亚马逊市场列表查询失败:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};
```

### 参数验证机制

实现严格的参数验证，确保API调用的可靠性：

```javascript
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
```

## 📋 配置文件设计

### 元数据配置 (index.meta.json)

定义云函数的完整接口规范：

```json
{
  "apiID": "package_facdb4__c__function_lingxingAmazonMarketplaces",
  "apiName": "lingxingAmazonMarketplaces",
  "label": {
    "zh_CN": "领星亚马逊市场列表查询",
    "en_US": "Lingxing Amazon Marketplaces Query"
  },
  "input": [
    {
      "key": "access_token",
      "type": "Text",
      "required": true,
      "label": "访问令牌"
    },
    {
      "key": "filters",
      "type": "JSON",
      "required": false,
      "label": "筛选条件"
    }
  ],
  "output": [
    {
      "key": "success",
      "type": "Boolean",
      "required": true
    },
    {
      "key": "data",
      "type": "JSON",
      "required": false
    }
  ]
}
```

### 调试参数配置 (debug.param.json)

提供真实的API调试环境：

```json
{
  "params": {
    "access_token": "3b75cd45-ed6b-461b-ab9d-cd1cce821d05",
    "app_key": "ak_6p4lBDrt1aPPF",
    "appId": "ak_6p4lBDrt1aPPF",
    "filters": {
      "region": "",
      "country": "",
      "code": ""
    }
  },
  "context": {}
}
```

## 🔧 实现过程中的关键问题

### 1. AES加密算法适配

**问题**：初始实现使用了错误的密钥处理方式
**解决方案**：
- 直接使用appId作为AES密钥，而非MD5哈希
- 确保密钥长度符合AES-128要求（16字节）
- 使用ECB模式和PKCS5PADDING填充

### 2. 云函数模块导出冲突

**问题**：多个 `module.exports` 声明导致函数无法正确调用
**解决方案**：
- 主入口使用 `module.exports = function`
- 工具函数使用 `module.exports.functionName = function`

### 3. 加密API兼容性问题

**问题**：`crypto.createCipher` 在新版本Node.js中已废弃
**解决方案**：
- 升级到 `crypto.createCipheriv`
- 明确指定加密算法和参数

## 🧪 调试验证过程

### 调试命令

```bash
node -e "const fn = require('./index.js'); const params = require('./debug.param.json'); fn(params.params, params.context, console).then(result => console.log('结果:', JSON.stringify(result, null, 2))).catch(err => console.error('错误:', err));"
```

### 成功响应示例

```json
{
  "success": true,
  "data": [
    {
      "mid": 1,
      "region": "NA",
      "aws_region": "NA",
      "country": "美国",
      "code": "US",
      "marketplace_id": "ATVPDKIKX0DER"
    }
  ],
  "summary": {
    "total": 23,
    "regions": {
      "NA": 4,
      "EU": 11,
      "IN": 1,
      "JP": 1,
      "CN": 1,
      "AU": 1,
      "AE": 1,
      "SG": 1,
      "SA": 1,
      "TR": 1
    },
    "request_id": "B6EF0650-FB42-2EC6-FFA4-FF16286399CD",
    "response_time": "2025-08-07 04:23:52"
  }
}
```

## 🎨 扩展功能实现

### 市场筛选功能

```javascript
function filterMarkets(markets, filters = {}) {
    return markets.filter(market => {
        // 地区筛选
        if (filters.region && market.region !== filters.region) {
            return false;
        }
        
        // 国家筛选
        if (filters.country && market.country !== filters.country) {
            return false;
        }
        
        // 代码筛选
        if (filters.code && market.code !== filters.code) {
            return false;
        }
        
        return true;
    });
}
```

### 数据映射功能

```javascript
function getMarketMappings(markets) {
    const mappings = {
        byRegion: {},
        byCode: {},
        byMarketplaceId: {}
    };
    
    markets.forEach(market => {
        // 按地区分组
        if (!mappings.byRegion[market.region]) {
            mappings.byRegion[market.region] = [];
        }
        mappings.byRegion[market.region].push(market);
        
        // 按代码映射
        mappings.byCode[market.code] = market;
        
        // 按市场ID映射
        mappings.byMarketplaceId[market.marketplace_id] = market;
    });
    
    return mappings;
}
```

## 📊 性能优化考虑

### 1. 内存管理
- 使用流式处理接收HTTP响应数据
- 及时释放大型JSON对象的引用

### 2. 错误处理
- 区分不同类型的错误（网络、解析、业务逻辑）
- 提供详细的错误信息用于调试

### 3. 日志记录
- 关键步骤的信息日志
- 敏感信息的脱敏处理

## 🔗 相关参考

- [领星API新手指南](../lingxing-api-documents/lingxing-api-newbie-guide.md) - API基础使用说明
- [云函数调用规范](../../../../../docs/guides/aa/aaas/a.md) - 飞书低代码平台规范
- [函数测试工作流程](../../workflow/function-testing/function-testing-workflow.md) - 函数开发测试流程

## 💡 最佳实践总结

1. **严格遵循API文档**：签名算法必须完全按照官方文档实现
2. **完善的错误处理**：区分不同错误类型，提供有用的调试信息
3. **模块化设计**：将核心功能拆分为独立的工具函数
4. **配置文件规范**：元数据和调试参数的标准化配置
5. **充分的调试验证**：确保在真实环境中的功能正确性