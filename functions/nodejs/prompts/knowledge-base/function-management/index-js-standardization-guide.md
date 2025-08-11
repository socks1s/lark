# Index.js 文件标准化规范指南

## 📝 概述

本文档定义了云函数主文件（`index.js`）的标准化编写规范。

## 🎯 核心要求

### 1. 函数注释规范（必须）
```javascript
/**
 * @description [函数功能描述]
 * @param {Object} params - 参数对象
 * @param {string} params.[参数名] - [参数说明]
 * @param {Object} context - 上下文对象
 * @param {Logger} logger - 日志记录器
 * @return {Object} 返回[具体说明]
 */
module.exports = async function (params, context, logger) {
    // 函数实现
};
```

### 2. 函数顶部处理： 1.函数开始执行的logger输出（必须）  2.入参解构赋值（必须） 3.预构建结果对象（必须）
```javascript
module.exports = async function (params, context, logger) {
    // 函数开始执行的logger输出（必须）
    logger.info('[具体函数名]开始执行');
    
    // 入参解构赋值（必须）
    const {
        objectApiName,
        recordIds,
        selectFields = [],
        limit = 100
    } = params;
    
    // 预构建结果对象（必须）
    const result = {
        success: false,
        data: null,
        error: null
    };
    
    // 业务逻辑...
    return result;
};
```

### 3. 使用Logger替代console.log（必须）
```javascript
// ✅ 正确
logger.info('处理开始'); //必须使用logger替代console.log

// ❌ 错误
console.log('处理开始');  // 禁止使用console.log，必须使用logger.info
```

## 📋 检查清单

### 必须检查项
- [ ] 函数注释规范：添加完整的JSDoc注释
- [ ] 入参解构赋值：使用解构语法获取参数，设置默认值
- [ ] 函数开始执行日志：记录`logger.info('[函数名]开始执行');`
- [ ] Logger处理：所有`console.log()`已替换为`logger.info()`
- [ ] 结果对象预构建：预先构建完整的返回对象结构

### 可选检查项
- [ ] 参数校验：根据业务需要添加参数验证逻辑
- [ ] 错误处理：适当的try-catch和错误信息记录

## 🚫 常见错误

### 1. 直接使用 params 属性
```javascript
// ❌ 错误
if (!params.objectApiName) { }

// ✅ 正确
const { objectApiName } = params;
if (!objectApiName) { }
```

### 2. 动态构建返回对象
```javascript
// ❌ 错误
if (success) {
    return { data: result, success: true };
} else {
    return { error: errorMsg };  // 不同的结构
}

// ✅ 正确
const result = { success: false, data: null, error: null };
if (success) {
    result.success = true;
    result.data = processedData;
} else {
    result.error = errorMsg;
}
return result;  // 始终返回相同结构
```

## 💡 最佳实践

1. **一致性优先**：所有函数都应遵循相同的代码结构
2. **预见性设计**：结果对象应考虑到所有可能的执行情况
3. **防御性编程**：充分的参数校验和错误处理
4. **可观测性**：适当的日志记录便于调试和监控