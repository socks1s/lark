# Debug Param JSON Guide

## 概述

`debug.param.json` 是云函数测试的核心配置文件，它为 `ae function dev` 命令提供测试参数。本文档详细说明如何编写一份合适的 `debug.param.json` 文件。

## 文件作用

`debug.param.json` 文件的主要作用：
- 为云函数测试提供输入参数
- 模拟真实的函数调用场景
- 支持多种测试场景的参数配置
- 确保测试数据的格式正确性

## 编写步骤

### 步骤 1：查找函数的 apiName

在开始编写测试参数之前，需要先确定要测试的函数名称。

**参考文档**：[如何查看函数 ApiName](../function-management/how-to-find-function-apiname.md)

### 步骤 2：分析函数的输入参数定义

打开函数目录中的 `index.meta.json` 文件，查看 `input` 字段中定义的参数结构。

**参考文档**：[云函数的基本组成与目录结构](../function-management/cloud-function-basic-structure-and-directory.md) - 第2节 index.meta.json

### 步骤 3：准备测试数据

根据 `index.meta.json` 中的参数定义，准备相应的测试数据。

## 参数格式要求

### 基本原则

1. **严格匹配**：参数必须严格按照 `index.meta.json` 中 `input` 字段定义的格式
2. **类型正确**：每个参数的数据类型必须与元数据定义一致
3. **必填参数**：所有标记为 `required: true` 的参数都必须提供
4. **有效数据**：使用真实、有效的测试数据
5. **正确包装**：所有参数必须包装在 `params` 对象中，并包含 `context` 对象

### 标准文件结构

⚠️ **重要格式要求**：`debug.param.json` 文件必须使用以下标准结构：

```json
{
  "params": {
    // 这里放置所有函数参数
  },
  "context": {}
}
```

### 常见参数类型及格式

#### Text 类型

  "operation": "edit"


#### Number 类型

  "count": 10,
  "price": 99.99


#### Record 类型

  "mainRecord": {
    "_id": 1838377468174395,
    "forwarderOrderId": "TEST-EDIT-001",
    "recordVersion": 1,
    "approvalStatus": "pending"


#### RecordList 类型

  "childRecordList": [
    {
      "_id": 1838447358845888,
      "shippingOrderId": "661-66"
    },
    {
      "_id": 1838447358845999,
      "shippingOrderId": "662-77"
    }
  ]


#### Boolean 类型

  "isActive": true,
  "hasChildren": false


## 完整示例

### 基础单场景配置

```json
{
  "params": {
    "mainRecord": {
      "_id": 1838377468174395,
      "forwarderOrderId": "TEST-EDIT-001",
      "recordVersion": 1,
      "approvalStatus": "pending"
    },
    "mainObjectApiName": "testMain",
    "parentFieldApiName": "forwarderOrder",
    "childObjectApiName": "testChild",
    "operation": "edit",
    "childRecordList": [
      {
        "_id": 1838447358845018,
        "shippingOrderId": "661-66"
      },
      {
        "shippingOrderId": "662-77"
      }
    ]
  },
  "context": {}
}
```

### 标准配置格式（必须严格遵循）

⚠️ **重要提醒**：`debug.param.json` 文件中只能包含一份测试用例，不允许多个场景同时存在，否则会导致测试报错。

```json
{
  "params": {
    "mainRecord": {
      "_id": 1838377468174395,
      "forwarderOrderId": "TEST-EDIT-001",
      "recordVersion": 1,
      "approvalStatus": "pending"
    },
    "operation": "edit",
    "childRecordList": [
      {
        "_id": 1838447358845018,
        "shippingOrderId": "661-66"
      }
    ]
  },
  "context": {}
}
```

## 编写检查清单 (Writing Checklist)

在完成 `debug.param.json` 编写后，请按以下清单检查：

- [ ] **格式正确性**：JSON 格式无语法错误
- [ ] **参数完整性**：包含 `index.meta.json` 中定义的所有必填参数
- [ ] **类型匹配性**：每个参数的数据类型与元数据定义严格一致
- [ ] **数据有效性**：测试数据符合业务逻辑要求
- [ ] **单一测试用例**：文件中只包含一个测试场景，不存在多场景配置
- [ ] **严格格式遵循**：完全按照 `index.meta.json` 中声明的入参格式输入

⚠️ **关键提醒**：
- 一个 `debug.param.json` 文件只能包含一份测试用例
- 必须严格按照 `index.meta.json` 中的参数定义格式编写
- 所有参数必须包装在 `params` 对象中，并包含**可以为空**的 `context` 对象
- 任何格式偏差都可能导致测试时报错

### 详细检查项

#### 格式检查
- [ ] JSON 格式正确，无语法错误
- [ ] 所有字符串使用双引号
- [ ] 数字类型不使用引号
- [ ] 布尔值使用 true/false（小写）

#### 参数检查
- [ ] 所有必填参数（required: true）都已提供
- [ ] 参数名称与 `index.meta.json` 中的 `key` 完全一致
- [ ] 参数类型与元数据定义匹配
- [ ] Record 类型包含必要的字段（如 `_id`）

#### 数据有效性检查
- [ ] 使用真实、有意义的测试数据
- [ ] ID 字段使用合理的数值
- [ ] 枚举类型的值在允许范围内
- [ ] 关联字段的数据保持一致性

## 测试流程

### 1. 准备阶段
1. 确定要测试的函数 apiName
2. 分析函数的输入参数定义
3. 准备测试数据

### 2. 编写阶段
1. 创建或编辑 `debug.param.json` 文件
2. 按照参数定义填写测试数据
3. 验证 JSON 格式正确性

### 3. 测试阶段
1. 执行 `ae function dev` 命令
2. 搜索并选择函数 apiName
3. 查看测试结果

**详细测试方法参考**：[AI 测试指南](../../../../../docs/guides/aa/aaas/a.md)

## 常见错误及解决方案 (Common Errors and Solutions)

### 1. 多场景配置错误
**错误示例**：
```json
{
  "scenarios": {
    "test1": {...},
    "test2": {...}
  }
}
```
**解决方案**：删除 scenarios 包装，使用正确的 params/context 结构

### 2. 参数格式不匹配
**错误原因**：未严格按照 `index.meta.json` 中的参数定义格式编写
**解决方案**：
- 仔细对比 `index.meta.json` 中的 `input` 定义
- 确保每个参数的 `key`、`type`、`required` 都严格匹配
- 使用正确的数据类型（Text、Number、Record、RecordList、Boolean）
- 确保参数正确包装在 `params` 对象中

### 4. 必填参数缺失
**错误现象**：测试时提示参数缺失
**解决方案**：检查 `index.meta.json` 中所有 `required: true` 的参数是否都已在 `params` 对象中提供

### 5. 数据类型错误
**常见错误**：
- Number 类型使用了字符串格式
- Boolean 类型使用了字符串 "true"/"false"
- Record 类型缺少必要字段

**解决方案**：严格按照参数类型要求提供数据

## 最佳实践 (Best Practices)

### 1. 严格格式遵循
- **必须严格按照** `index.meta.json` 中的参数定义格式编写
- **正确的文件结构**：使用 `params` 和 `context` 对象包装
- **一个文件一个测试用例**：不允许多场景配置
- **参数类型精确匹配**：确保数据类型与元数据定义完全一致

### 2. 数据真实性
- 使用真实、有意义的测试数据
- 避免使用无效的 ID 或不存在的记录
- 确保测试数据符合业务逻辑

### 3. 测试用例设计
- **单一职责**：每个测试文件专注测试一个特定场景
- **边界测试**：包含正常值、边界值、异常值的测试
- **业务场景覆盖**：选择最具代表性的业务场景进行测试

### 4. 文件管理
- **版本控制**：将测试参数文件纳入版本控制
- **命名规范**：使用描述性的文件名（如 `debug.param.json`）
- **文档注释**：在必要时添加注释说明测试场景

### 5. 定期维护
- **同步更新**：当函数参数定义变更时，及时更新测试参数
- **清理无效数据**：定期检查和清理过期的测试数据
- **测试验证**：定期运行测试确保参数文件的有效性

## 相关文档链接

- [如何查看函数 ApiName](../function-management/how-to-find-function-apiname.md) - 查找函数标识符
- [云函数的基本组成与目录结构](../function-management/cloud-function-basic-structure-and-directory.md) - 了解三个核心文件的作用
- [函数测试工作流程](../../workflow/function-testing/function-testing-workflow.md) - 完整的测试流程说明
- [AI 测试指南](../../../../../docs/guides/aa/aaas/a.md) - AI 助手测试方法
- [如何创建唯一函数名](../function-management/how-to-create-unique-function-name.md) - 函数命名规范