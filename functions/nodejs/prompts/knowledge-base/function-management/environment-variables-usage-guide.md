# 飞书云函数环境变量使用指南

## 📝 概述

本文档详细介绍如何在飞书低代码云函数中使用环境变量，包括环境变量的获取方法、最佳实践和常见使用场景。环境变量是管理敏感信息（如API密钥、数据库连接字符串等）的安全方式。

## 🔧 环境变量获取方法

### 基本语法

在飞书云函数中，使用以下方法获取环境变量：

```javascript
const variableValue = await application.globalVar.getVar("variable_name");
```

### 参数说明

- `variable_name`：环境变量的名称（字符串类型）
- 返回值：环境变量的值（字符串类型），如果变量不存在则返回 `undefined`

## 💡 使用示例

### 示例1：获取API密钥

```javascript
module.exports = async function (params, context, logger) {
  try {
    // 获取API密钥
    const apiKey = await application.globalVar.getVar("ERP_API_KEY");
    const apiSecret = await application.globalVar.getVar("ERP_API_SECRET");
    
    // 检查环境变量是否存在
    if (!apiKey || !apiSecret) {
      throw new Error('缺少必要的API配置信息');
    }
    
    logger.info('成功获取API配置');
    
    // 使用环境变量进行API调用
    const result = await callExternalAPI(apiKey, apiSecret);
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    logger.error('获取环境变量失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};
```


## 🛡️ 安全最佳实践

### 1. 日志安全

```javascript
module.exports = async function (params, context, logger) {
  const apiKey = await application.globalVar.getVar("API_KEY");
  
  // ✅ 正确：不在日志中暴露敏感信息
  logger.info('API密钥获取成功', { hasApiKey: !!apiKey });
  
  // ❌ 错误：在日志中暴露敏感信息
  // logger.info('API密钥:', apiKey); // 不要这样做！
};
```
