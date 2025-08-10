# How to Create Unique Function Name

## 概述

在飞书低代码平台中创建新的云函数时，必须确保函数名称的唯一性。本文档详细说明如何为新函数创建独一无二的名称。

## 命名规则

### 基本要求

1. **项目内唯一性**：`apiName` 在同一个项目中必须唯一
2. **英文字符**：只能使用英文字母、数字和下划线
3. **驼峰命名**：推荐使用 camelCase 格式
4. **语义化**：名称应该清晰表达函数的功能

### 命名格式

**推荐格式**：`动词 + 名词` 或 `功能描述`

```
✅ 好的示例：
- createUser
- updateRecord
- deleteOrder
- getUserInfo
- batchProcessData
- validateInput

❌ 避免的示例：
- test1
- function1
- temp
- 用户创建 (中文)
```

## 检查名称唯一性

### 方法 1：搜索现有函数

在项目根目录执行搜索命令：

```bash
# 搜索所有 index.meta.json 文件中的 apiName
find . -name "index.meta.json" -exec grep -l "yourFunctionName" {} \;
```

### 方法 2：使用 ae function dev 命令

```bash
ae function dev
# 在函数列表中查看是否已存在同名函数
```

### 方法 3：检查函数目录

查看 `/functions/nodejs/modules/` 目录下是否已存在同名的函数目录。

## 命名最佳实践

### 1. 按功能分类命名

```
数据操作类：
- createRecord
- updateRecord  
- deleteRecord
- batchUpsertRecords

查询类：
- getUserInfo
- getOrderList
- findRelatedRecords

验证类：
- validateInput
- checkPermission
- verifyToken

工具类：
- formatData
- calculateTotal
- generateReport
```

### 2. 使用前缀区分模块

```
用户模块：
- userCreate
- userUpdate
- userDelete

订单模块：
- orderCreate
- orderProcess
- orderCancel

系统模块：
- systemInit
- systemBackup
- systemCleanup
```

### 3. 版本控制命名

```
第一版：createUser
升级版：createUserV2
重构版：createUserNew
```

## apiID 生成规则

系统会自动为每个函数生成唯一的 `apiID`：

**格式**：`包名_function_随机字符串`

```json
{
  "apiID": "package_facdb4__c__function_aa451ilq3qqku",
  "apiName": "createEditRecord"
}
```

**说明**：
- `package_facdb4__c`：包名
- `function`：固定前缀
- `aa451ilq3qqku`：系统生成的随机字符串

## 创建新函数的完整流程

### 步骤 1：确定函数功能

明确函数的具体功能和用途。

### 步骤 2：设计函数名称

根据功能设计一个语义化的 `apiName`。

### 步骤 3：检查名称唯一性

使用上述方法检查名称是否已被使用。

### 步骤 4：创建函数

使用 `ae function create` 命令创建函数：

```bash
ae function create
# 按提示输入函数名称和其他信息
```

### 步骤 5：验证创建结果

检查生成的 `index.meta.json` 文件，确认 `apiName` 和 `apiID` 正确。

## 常见错误和解决方案

### 错误 1：名称重复

**错误信息**：Function name already exists
**解决方案**：更换一个唯一的函数名称

### 错误 2：名称格式不正确

**错误信息**：Invalid function name format
**解决方案**：使用英文字符和 camelCase 格式

### 错误 3：名称过长

**错误信息**：Function name too long
**解决方案**：简化函数名称，保持在合理长度内

## 注意事项

1. **不要使用保留字**：避免使用系统保留的关键字
2. **考虑未来扩展**：选择的名称应该便于未来功能扩展
3. **团队协作**：在团队开发中，建立统一的命名规范
4. **文档记录**：为每个函数编写清晰的描述和文档

## 命名规范建议

### 团队协作规范

```
1. 统一前缀：按模块使用统一前缀
2. 动词在前：使用动词开头描述操作
3. 名词在后：使用名词描述操作对象
4. 避免缩写：使用完整的英文单词
5. 版本标识：需要版本控制时使用 V2、V3 等后缀
```

### 文档模板

为每个新函数创建时，建议在 `index.meta.json` 中包含完整的描述：

```json
{
  "apiName": "yourFunctionName",
  "label": {
    "zh_CN": "中文显示名称",
    "en_US": "English Display Name"
  },
  "description": {
    "zh_CN": "详细的中文功能描述",
    "en_US": "Detailed English function description"
  }
}
```