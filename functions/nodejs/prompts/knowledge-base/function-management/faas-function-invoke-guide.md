# Feishu Cloud Function Invocation Guide

## 📝 概述

本文档介绍如何在飞书云函数中使用 `faas.function(...).invoke` 方法调用其他飞书云函数。

## ⚠️ 必读前置知识

### 1. 如何查找函数 ApiName - 获取正确的函数标识符
- **为什么必读**：确保在调用时使用正确的函数 ApiName，避免函数名称错误导致的调用失败
- **文档链接**：[How to Find Function ApiName](./how-to-find-function-apiname.md)

### 2. 云函数文件结构规范 - 理解函数组织方式
- **为什么必读**：了解云函数的目录结构和命名规范，确保正确引用函数名称
- **文档链接**：[云函数的基本组成与目录结构](./cloud-function-basic-structure-and-directory.md)

### 3. 调试参数配置标准 - 理解函数参数格式
- **为什么必读**：掌握函数参数的标准格式，确保正确传递参数给被调用函数
- **文档链接**：[Debug Param JSON Guide](../testing/debug-param-json-guide.md)

## 🎯 核心语法

### 基本调用语法

```javascript
const result = await faas.function("functionApiName").invoke({
    param1: value1,
    param2: value2,
    // ... 其他参数
});
```

### 语法要素说明

- **`faas.function()`**：飞书云函数调用的入口方法
- **`"functionApiName"`**：被调用函数的API名称（字符串格式）
- **`.invoke({})`**：执行调用并传递参数对象
- **`await`**：异步等待调用结果返回

## 📋 典型应用示例

### 1. 版本冲突检测

```javascript
const versionConflictCheckResult = await faas.function("versionConflictCheck").invoke({
    record: mainRecord, 
    objectApiName: mainObjectApiName
});
```

### 2. 批量记录操作

```javascript
const committedRecords = (await faas.function("batchUpsertRecords").invoke({
    recordList: recordList,
    objectApiName: objectApiName
})).allSuccessList;
```

### 3. 主子表关联

```javascript
const updatedChildRecords = (await faas.function("relateParentChildRecords").invoke({
    childRecordList: childRecordList,
    parentRecord: parentRecord,
    parentFieldApiName: parentFieldApiName
})).updatedChildRecordList;
```

## 📤 返回值处理

### 基本获取

```javascript
const result = await faas.function("functionApiName").invoke(params);
```

### 解构获取

```javascript
const firstItem = (await faas.function("functionApiName").invoke(params)).arrayField[0];
```

## ⚠️ 错误处理

### 基本错误捕获

```javascript
try {
    const result = await faas.function("functionApiName").invoke(params);
    // 处理成功结果
} catch (error) {
    logger.error('函数调用失败:', error);
    // 处理错误情况
}
```

## 🚨 常见错误

### 1. 函数名称错误
```javascript
// ❌ 错误：函数名不存在
await faas.function("nonExistentFunction").invoke(params);

// ✅ 正确：使用正确的函数名（如何查找函数名：教程[How to Find Function ApiName]在本文的顶部）
await faas.function("batchUpsertRecords").invoke(params);
```

### 2. 参数类型错误
```javascript
// ❌ 错误：参数类型不匹配
await faas.function("batchUpsertRecords").invoke({
    recordList: "not an array", // 应该是数组
    objectApiName: 123 // 应该是字符串
});

// ✅ 正确：使用正确的参数类型（如何查看函数的入参结构，教程[Function File Structure Guide]在本文的顶部）
await faas.function("batchUpsertRecords").invoke({
    recordList: [record1, record2],
    objectApiName: "testMain"
});
```

### 3. 异步处理错误
```javascript
// ❌ 错误：忘记使用 await
const result = faas.function("functionApiName").invoke(params); // 返回 Promise

// ✅ 正确：使用 await 等待结果
const result = await faas.function("functionApiName").invoke(params);
```

## 📚 相关参考文档

- [Function Testing Workflow](../../workflow/function-testing/function-testing-workflow.md) - 云函数测试完整流程
- [Index Meta JSON Structure Guide](index-meta-json-structure-guide.md) - 函数元数据配置指南