# How to Get Real Test Data Using Tool Functions

## 📝 概述

本文档详细介绍如何使用专用工具函数 `getTestMain` 和 `getTestChild` 从线上数据库获取真实的业务数据，用于云函数测试和开发调试。这些工具函数提供了灵活的查询参数，支持多种数据获取场景。

## ⚠️ 必读前置知识

### 1. 云函数测试工作流程 - 核心流程
- **为什么必读**：了解如何正确执行云函数测试，包括参数配置和命令执行方式
- **文档链接**：[Function Testing Workflow](../../workflow/function-testing/function-testing-workflow.md)

### 2. debug.param.json 配置指南 - 参数格式标准
- **为什么必读**：掌握测试参数的正确配置格式，确保工具函数能够正常执行
- **文档链接**：[Debug Param JSON Guide](./debug-param-json-guide.md)

## 🔧 工具函数概览

### getTestMain - 主表数据获取工具
- **功能**：获取主表（父表）的测试数据
- **路径**：`/modules/getTestMain`
- **适用场景**：获取独立的业务对象数据，如订单、用户、产品等主要业务实体

### getTestChild - 子表数据获取工具
- **功能**：获取子表数据，支持父子关联查询
- **路径**：`/modules/getTestChild`
- **适用场景**：获取依赖于父表的子表数据，如订单明细、用户地址、产品规格等

## 📋 getTestMain 使用指南

### 基本参数结构
```json
{
  "params": {
    "objectApiName": "testMain",
    "limit": 5,
    "selectFields": ["_id", "forwarderOrderId", "serialNumber"],
    "orderBy": "_id",
    "orderDirection": "asc"
  },
  "context": {}
}
```

### 核心参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `objectApiName` | String | ✅ | 要查询的对象API名称 |
| `recordIds` | Array/String | ❌ | 指定记录ID进行精确查询 |
| `selectFields` | Array | ❌ | 指定查询字段，不填则查询所有字段 |
| `conditions` | Object | ❌ | 查询条件对象，支持复杂条件 |
| `limit` | Number | ❌ | 限制返回记录数（默认100，最大200） |
| `offset` | Number | ❌ | 分页偏移量（默认0） |
| `orderBy` | String | ❌ | 排序字段（默认_id） |
| `orderDirection` | String | ❌ | 排序方向：'asc'或'desc'（默认'asc'） |
| `returnSingle` | Boolean | ❌ | 是否只返回单条记录（默认false） |

### 常用查询场景

#### 1. 基础数据获取
```json
{
  "params": {
    "objectApiName": "testMain",
    "limit": 10
  },
  "context": {}
}
```

#### 2. 指定字段查询
```json
{
  "params": {
    "objectApiName": "testMain",
    "selectFields": ["_id", "forwarderOrderId", "serialNumber", "_createdAt"],
    "limit": 20,
    "orderBy": "_createdAt",
    "orderDirection": "desc"
  },
  "context": {}
}
```

#### 3. 条件查询
```json
{
  "params": {
    "objectApiName": "testMain",
    "conditions": {
      "isCalculating": true,
      "_createdAt": {
        "$gte": "2024-01-01T00:00:00Z"
      }
    },
    "selectFields": ["_id", "forwarderOrderId", "isCalculating"],
    "limit": 50
  },
  "context": {}
}
```

#### 4. 按ID精确查询
```json
{
  "params": {
    "objectApiName": "testMain",
    "recordIds": ["123456789", "987654321"],
    "selectFields": ["_id", "forwarderOrderId", "serialNumber"]
  },
  "context": {}
}
```

### 执行命令
```bash
ae function dev getTestMain
```

## 📋 getTestChild 使用指南

### 基本参数结构
```json
{
  "params": {
    "objectApiName": "testChild",
    "parentObjectApiName": "testMain",
    "limit": 10,
    "selectFields": ["_id", "parentId", "childName", "childValue"],
    "includeParentInfo": true
  },
  "context": {}
}
```

### 核心参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `objectApiName` | String | ✅ | 子表对象API名称 |
| `parentObjectApiName` | String | ❌ | 父表对象API名称，用于关联查询 |
| `recordIds` | Array/String | ❌ | 子表记录ID进行精确查询 |
| `parentRecordIds` | Array/String | ❌ | 父记录ID，查询特定父记录的子表数据 |
| `selectFields` | Array | ❌ | 指定查询字段 |
| `conditions` | Object | ❌ | 查询条件对象 |
| `limit` | Number | ❌ | 限制返回记录数（默认100，最大200） |
| `offset` | Number | ❌ | 分页偏移量 |
| `orderBy` | String | ❌ | 排序字段 |
| `orderDirection` | String | ❌ | 排序方向 |
| `returnSingle` | Boolean | ❌ | 是否只返回单条记录 |
| `includeParentInfo` | Boolean | ❌ | 是否包含父记录信息 |

### 常用查询场景

#### 1. 基础子表查询
```json
{
  "params": {
    "objectApiName": "testChild",
    "limit": 10
  },
  "context": {}
}
```

#### 2. 按父记录ID查询子表
```json
{
  "params": {
    "objectApiName": "testChild",
    "parentObjectApiName": "testMain",
    "parentRecordIds": "1837438584997912",
    "includeParentInfo": true
  },
  "context": {}
}
```

#### 3. 多父记录的子表查询
```json
{
  "params": {
    "objectApiName": "testChild",
    "parentObjectApiName": "testMain",
    "parentRecordIds": ["1837438584997912", "1837702753032231"],
    "selectFields": ["_id", "parentId", "childName", "childValue"],
    "includeParentInfo": true
  },
  "context": {}
}
```

#### 4. 条件查询子表
```json
{
  "params": {
    "objectApiName": "testChild",
    "parentObjectApiName": "testMain",
    "conditions": {
      "childValue": { "$gt": 100 },
      "_createdAt": {
        "$gte": "2024-01-01T00:00:00Z"
      }
    },
    "selectFields": ["_id", "parentId", "childName", "childValue"],
    "includeParentInfo": true
  },
  "context": {}
}
```

#### 5. 获取最新子表记录
```json
{
  "params": {
    "objectApiName": "testChild",
    "parentObjectApiName": "testMain",
    "limit": 1,
    "orderBy": "_createdAt",
    "orderDirection": "desc",
    "returnSingle": true,
    "includeParentInfo": true
  },
  "context": {}
}
```

### 执行命令
```bash
ae function dev getTestChild
```

## 📊 返回数据结构

### 标准返回格式
```json
{
  "success": true,
  "data": [...],
  "isSingle": false,
  "totalCount": 165,
  "currentCount": 10,
  "hasMore": true,
  "queryInfo": {
    "objectApiName": "testMain",
    "selectFields": ["_id", "forwarderOrderId"],
    "conditions": {...},
    "limit": 10,
    "offset": 0,
    "orderBy": "_id",
    "orderDirection": "asc"
  }
}
```

### 字段说明
- `success`: 操作是否成功
- `data`: 查询结果数据（数组或单个对象）
- `isSingle`: 是否为单条记录
- `totalCount`: 符合条件的总记录数
- `currentCount`: 当前返回的记录数
- `hasMore`: 是否还有更多数据
- `queryInfo`: 查询参数信息

## 🔄 实际操作流程

### 步骤1：确定数据需求
- 确定需要获取的对象类型（主表或子表）
- 明确需要的字段和数据量
- 确定查询条件和排序要求

### 步骤2：配置参数文件
- 进入对应工具函数目录
- 编辑 `debug.param.json` 文件
- 根据需求配置查询参数

### 步骤3：执行查询
```bash
# 获取主表数据
cd /path/to/getTestMain
ae function dev getTestMain

# 获取子表数据
cd /path/to/getTestChild
ae function dev getTestChild
```

### 步骤4：分析结果
- 检查返回的数据结构
- 确认字段内容是否符合预期
- 记录有用的记录ID用于后续测试

## ⚠️ 注意事项

### 数据安全
- 仅在开发和测试环境使用
- 避免获取敏感数据字段
- 注意数据量控制，避免影响系统性能

### 参数验证
- `objectApiName` 必须是有效的对象API名称
- `limit` 参数不能超过200
- 字段名必须存在于目标对象中

### 错误处理
- 如遇到字段不存在错误，检查 `selectFields` 参数
- 如查询无结果，检查 `conditions` 和 `objectApiName`
- 注意父子表关联的正确性

## 💡 最佳实践

### 1. 渐进式查询
- 先用基础参数获取少量数据
- 确认数据结构后再扩展查询条件
- 逐步增加字段和数据量

### 2. 字段优化
- 只查询必要的字段，提高查询效率
- 优先使用系统字段（_id, _createdAt等）
- 避免查询大文本或二进制字段

### 3. 分页处理
- 大量数据使用分页查询
- 合理设置 `limit` 和 `offset`
- 注意 `hasMore` 字段判断是否有更多数据

### 4. 数据关联
- 子表查询时合理使用 `includeParentInfo`
- 通过 `parentRecordIds` 精确控制数据范围
- 注意父子表的关联字段正确性

## 🔗 相关参考文档

- [Function Testing Workflow](../../workflow/function-testing/function-testing-workflow.md) - 云函数测试完整流程
- [Debug Param JSON Guide](./debug-param-json-guide.md) - 测试参数配置标准
- [How to Get Object Fields Using Tool Functions](./how-to-get-object-fields-using-tool-functions.md) - 获取对象字段信息