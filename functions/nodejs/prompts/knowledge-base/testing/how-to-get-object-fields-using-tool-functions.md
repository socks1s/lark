# How to Get Object Fields Using Tool Functions

## 📝 概述

本文档详细介绍如何使用专用工具函数 `getObjectFields` 获取指定业务对象的所有字段信息。该工具函数是进行数据查询和测试参数配置的重要辅助工具，能够帮助开发者了解对象的完整字段结构。

## ⚠️ 必读前置知识

### 1. 云函数测试工作流程 - 核心流程
- **为什么必读**：了解如何正确执行云函数测试，包括参数配置和命令执行方式
- **文档链接**：[Function Testing Workflow](../../workflow/function-testing/function-testing-workflow.md)

### 2. debug.param.json 配置指南 - 参数格式标准
- **为什么必读**：掌握测试参数的正确配置格式，确保工具函数能够正常执行
- **文档链接**：[Debug Param JSON Guide](./debug-param-json-guide.md)

## 🔧 工具函数概览

### getObjectFields - 对象字段信息获取工具
- **功能**：获取指定业务对象的所有字段定义和属性信息
- **路径**：`/modules/getObjectFields`
- **适用场景**：
  - 了解对象的完整字段结构
  - 为数据查询配置正确的 `selectFields` 参数
  - 验证字段名称的有效性
  - 分析对象的数据模型

## 📋 使用指南

### 基本参数结构
```json
{
  "params": {
    "objectApiName": "testMain"
  },
  "context": {}
}
```

### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `objectApiName` | String | ✅ | 要查询字段信息的对象API名称 |

### 常用查询场景

#### 1. 获取主表字段信息
```json
{
  "params": {
    "objectApiName": "testMain"
  },
  "context": {}
}
```

#### 2. 获取子表字段信息
```json
{
  "params": {
    "objectApiName": "testChild"
  },
  "context": {}
}
```

#### 3. 获取自定义对象字段信息
```json
{
  "params": {
    "objectApiName": "customObject"
  },
  "context": {}
}
```

### 执行命令
```bash
ae function dev getObjectFields
```

## 📊 返回数据结构

### 标准返回格式
```json
{
  "fields": [
    {
      "apiName": "_id",
      "label": "记录ID",
      "type": "Number",
      "required": true,
      "description": "系统自动生成的唯一标识符"
    },
    {
      "apiName": "forwarderOrderId",
      "label": "转发订单ID",
      "type": "Text",
      "required": false,
      "description": "业务订单的唯一标识"
    },
    {
      "apiName": "serialNumber",
      "label": "序列号",
      "type": "Text",
      "required": false,
      "description": "业务序列号"
    },
    {
      "apiName": "isCalculating",
      "label": "是否计算中",
      "type": "Boolean",
      "required": false,
      "description": "标识记录是否处于计算状态"
    },
    {
      "apiName": "_createdAt",
      "label": "创建时间",
      "type": "DateTime",
      "required": true,
      "description": "记录创建时间"
    },
    {
      "apiName": "_updatedAt",
      "label": "更新时间",
      "type": "DateTime",
      "required": true,
      "description": "记录最后更新时间"
    }
  ]
}
```

### 字段属性说明
- `apiName`: 字段的API名称，用于数据查询和操作
- `label`: 字段的显示名称
- `type`: 字段数据类型（Text, Number, Boolean, DateTime, Decimal等）
- `required`: 是否为必填字段
- `description`: 字段的详细描述

## 🔄 实际操作流程

### 步骤1：确定目标对象
- 明确需要了解字段信息的对象API名称
- 确保对象名称的正确性

### 步骤2：配置参数文件
```bash
cd /path/to/getObjectFields
```

编辑 `debug.param.json` 文件：
```json
{
  "params": {
    "objectApiName": "your_object_api_name"
  },
  "context": {}
}
```

### 步骤3：执行查询
```bash
ae function dev getObjectFields
```

### 步骤4：分析字段信息
- 查看所有可用字段的API名称
- 了解字段的数据类型和约束
- 记录需要用于查询的字段名称

## 🎯 应用场景

### 1. 配置数据查询参数
获取字段信息后，可以正确配置其他工具函数的 `selectFields` 参数：

```json
{
  "params": {
    "objectApiName": "testMain",
    "selectFields": ["_id", "forwarderOrderId", "serialNumber", "_createdAt"],
    "limit": 10
  },
  "context": {}
}
```

### 2. 验证字段有效性
在编写测试数据或查询条件前，先确认字段是否存在：

```bash
# 1. 获取字段信息
ae function dev getObjectFields

# 2. 根据返回的字段信息配置查询
# 确保 selectFields 中的字段名称都在返回的 fields 列表中
```

### 3. 了解数据模型
分析对象的完整数据结构，为业务逻辑开发提供参考：

- 识别关键业务字段
- 了解字段的数据类型约束
- 分析必填字段和可选字段

### 4. 调试数据问题
当遇到字段相关错误时，使用此工具确认：

- 字段名称是否正确
- 字段是否存在于目标对象中
- 字段的数据类型是否匹配

## ⚠️ 注意事项

### 对象名称验证
- 确保 `objectApiName` 参数值正确
- 对象名称区分大小写
- 使用实际存在的对象API名称

### 权限考虑
- 确保当前用户有权限访问目标对象
- 某些系统对象可能有访问限制

### 数据类型理解
- 不同数据类型有不同的查询和操作方式
- 注意 DateTime 类型的格式要求
- Boolean 类型使用 true/false 值

## 💡 最佳实践

### 1. 预先探索
在进行复杂数据操作前，先使用 `getObjectFields` 了解对象结构：

```bash
# 探索主表结构
ae function dev getObjectFields  # objectApiName: "testMain"

# 探索子表结构  
ae function dev getObjectFields  # objectApiName: "testChild"
```

### 2. 字段选择优化
根据字段信息选择合适的查询字段：

- 优先选择索引字段（如 _id, _createdAt）
- 避免查询不必要的大文本字段
- 根据业务需求选择核心字段

### 3. 类型匹配
在配置查询条件时，确保数据类型匹配：

```json
{
  "conditions": {
    "_id": 123456789,           // Number 类型
    "isCalculating": true,      // Boolean 类型
    "forwarderOrderId": "ABC123", // Text 类型
    "_createdAt": {             // DateTime 类型
      "$gte": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 4. 文档记录
将常用对象的字段信息记录下来，便于后续开发：

```markdown
## testMain 对象字段
- _id (Number): 记录ID
- forwarderOrderId (Text): 转发订单ID  
- serialNumber (Text): 序列号
- isCalculating (Boolean): 是否计算中
- _createdAt (DateTime): 创建时间
- _updatedAt (DateTime): 更新时间
```

## 🔗 与其他工具函数的配合使用

### 配合 getTestMain 使用
```bash
# 1. 先获取字段信息
ae function dev getObjectFields  # objectApiName: "testMain"

# 2. 根据字段信息配置数据查询
ae function dev getTestMain      # 使用正确的 selectFields
```

### 配合 getTestChild 使用
```bash
# 1. 获取子表字段信息
ae function dev getObjectFields  # objectApiName: "testChild"

# 2. 获取父表字段信息（如需要）
ae function dev getObjectFields  # objectApiName: "testMain"

# 3. 配置子表数据查询
ae function dev getTestChild     # 使用正确的字段配置
```

## 🔗 相关参考文档

- [How to Get Real Test Data Using Tool Functions](./how-to-get-real-test-data-using-tool-functions.md) - 获取真实测试数据
- [Function Testing Workflow](../../workflow/function-testing/function-testing-workflow.md) - 云函数测试完整流程
- [Debug Param JSON Guide](./debug-param-json-guide.md) - 测试参数配置标准
- [Index Meta JSON Structure Guide](../function-management/index-meta-json-structure-guide.md) - 函数元数据结构指南