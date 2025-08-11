# AE Source Push Index.meta.json 格式错误解决方案

## 📝 错误描述

在执行 `ae source push` 命令时，遇到 `index.meta.json` 文件格式错误导致的部署失败问题。

## 🚨 错误症状

- `ae source push` 命令执行失败
- 错误日志显示 `index.meta.json` 格式相关错误
- 函数无法正常部署到云端环境

## 🔍 常见错误类型

### 1. label 和 description 字段格式错误

**错误示例**：
```json
{
  "label": {"zh_CN": "中文名称", "en_US": "English Name"},
  "description": {"zh_CN": "中文描述", "en_US": "English Description"}
}
```

**正确格式**：
```json
{
  "label": "中文名称",
  "description": "中文描述"
}
```

### 2. apiID 格式错误

**错误示例**：
```json
{
  "apiID": "package_facdb4__c__function_functionName"
}
```

**正确格式**：
```json
{
  "apiID": "function_functionName"
}
```

### 3. 参数类型定义错误

**错误示例**：
```json
{
  "type": "Record",
  "objectApiName": "testMain__c",
  "fieldApiNames": ["field1", "field2"]
}
```

**推荐格式**：
```json
{
  "type": "JSON"
}
```

## 🛠️ 解决方案

### 步骤 1：检查 label 和 description 字段

确保函数级别的 `label` 和 `description` 字段使用字符串格式：

```json
{
  "apiID": "function_yourFunctionName",
  "apiName": "yourFunctionName",
  "label": "函数显示名称",
  "description": "函数功能描述"
}
```

### 步骤 2：修正 apiID 格式

将 `apiID` 修改为标准格式：

```json
{
  "apiID": "function_yourFunctionName"
}
```

### 步骤 3：优化参数类型定义

对于复杂数据结构，推荐使用 `JSON` 类型：

```json
{
  "inputs": [
    {
      "name": "complexData",
      "type": "JSON",
      "label": "复杂数据",
      "description": "包含多个字段的复杂数据结构"
    }
  ]
}
```

### 步骤 4：重新推送

修复配置文件后，重新执行推送命令：

```bash
ae source push
```

## ✅ 验证方法

1. **格式验证**：使用 JSON 格式验证工具检查文件格式
2. **推送测试**：执行 `ae source push` 命令确认无错误
3. **功能测试**：使用 `ae function dev` 命令测试函数功能

## 🔗 相关参考

- [Index.meta.json 文件结构指南](../../knowledge-base/function-management/index-meta-json-structure-guide.md)
- [AE Source Push Workflow](../../workflow/source-code-management/ae-source-push-workflow.md) - 源代码推送完整流程

## 💡 预防措施

1. **模板使用**：使用标准的 `index.meta.json` 模板
2. **格式检查**：推送前进行格式验证
3. **类型选择**：优先使用 `JSON` 类型处理复杂数据
4. **命名规范**：严格遵循 `apiID` 命名规范