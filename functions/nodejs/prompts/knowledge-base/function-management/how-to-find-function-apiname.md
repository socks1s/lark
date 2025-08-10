# How to Find Function ApiName

## 概述

每个云函数都有一个唯一的 `apiName`，这是函数的标识符，用于在测试和调用时识别具体的函数。本文档详细说明如何查找函数的 `apiName`。

## 文件结构说明

每个云函数都包含成对的文件：

```
/functions/nodejs/modules/class_createEditRecord/createEditRecord/
├── index.js              # 函数主体代码
├── index.meta.json       # 函数元数据文件（包含 apiName）
└── debug.param.json      # 测试参数文件
```

## 查找 apiName 的方法

### 步骤 1：定位函数目录

找到你要查看的函数目录，例如：
```
/package_facdb4__c（项目根目录）/functions/nodejs/modules/class_createEditRecord/createEditRecord/
```

### 步骤 2：打开 index.meta.json 文件

在函数目录中，打开 `index.meta.json` 文件。

### 步骤 3：查找 apiName 字段

在 `index.meta.json` 文件中，找到 `apiName` 字段：

```json
{
  "apiID": "package_facdb4__c__function_aa451ilq3qqku",
  "apiName": "createEditRecord",
  "label": {
    "zh_CN": "创建/编辑记录",
    "en_US": "Create/Edit Record"
  },
  "description": {
    "zh_CN": "根据操作类型创建或编辑父子记录",
    "en_US": "Create or edit parent-child records based on operation type"
  }
}
```

**重要字段说明**：
- `apiName`: 函数的 API 名称，用于测试和调用（如：`createEditRecord`）
- `apiID`: 函数的唯一标识符，系统自动生成
- `label`: 函数的显示名称（支持多语言）
- `description`: 函数的描述信息

## 实际应用

### 在测试中使用

当使用 `ae function dev` 命令测试函数时，需要输入的就是 `apiName`：

```bash
ae function dev
# 在弹出的选择界面中，输入：createEditRecord
```

### 在函数调用中使用

在其他云函数中调用时，也使用 `apiName`：

```javascript
const result = await faas.function("createEditRecord").invoke({
  // 参数
});
```

## 注意事项

1. **唯一性**：每个项目中的 `apiName` 必须唯一
2. **不可修改**：`apiName` 一旦创建，不建议随意修改
3. **命名规范**：通常使用 camelCase 格式
4. **区分大小写**：`apiName` 是区分大小写的

## 常见问题

**Q: 如果找不到 index.meta.json 文件怎么办？**
A: 检查函数目录是否正确，每个有效的云函数目录都必须包含此文件。

**Q: apiName 和 apiID 有什么区别？**
A: `apiName` 是人类可读的函数名称，`apiID` 是系统生成的唯一标识符。

**Q: 可以修改 apiName 吗？**
A: 技术上可以，但不建议，因为可能影响其他依赖此函数的代码。