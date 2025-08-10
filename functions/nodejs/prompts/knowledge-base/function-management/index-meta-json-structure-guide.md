# Index.meta.json 文件结构指南

## 概述

`index.meta.json` 是飞书低代码云函数的核心配置文件，定义了函数的元数据信息、输入输出参数、显示信息等。<mcreference link="https://bytedance.larkoffice.com/wiki/wikcn6VSZyHsVJIzGMBYl4IsNEd" index="1">1</mcreference>

## 基本结构与字段说明

`index.meta.json` 文件由两个核心部分组成：**基础信息**、**入参/出参定义**。

### 完整示例

#### 1. 基础信息部分
```json
{
  "apiID": "package_facdb4__c__function_[唯一标识]",
  "apiName": "函数名称",
  "label": {
    "zh_CN": "中文显示名称",
    "en_US": "English Display Name"
  },
  "description": {
    "zh_CN": "中文描述信息",
    "en_US": "English Description"
  },
  "longTaskMode": false,
  "frontendSDKInvokable": true
}
```

**⚠️ 重要提醒**：
- **基础信息**中的 `label` 和 `description` 必须使用**双语格式**（中英文对象）

#### 基础信息详解

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| **apiID** | String | ✓ | 全局唯一标识符，格式：`package_facdb4__c__function_[随机字符串]`，总长度≤30字符 |
| **apiName** | String | ✓ | API调用名称，驼峰命名法，必须与文件名一致 |
| **label** | Object | ✓ | 函数显示名称，支持中英文多语言 |
| **description** | Object | ✓ | 函数详细描述，支持中英文多语言 |
| **longTaskMode** | Boolean | ✓ | 是否为长任务模式，默认 `false` |
| **frontendSDKInvokable** | Boolean | ✓ | 是否允许前端SDK调用，默认 `true` |
**📋 apiID 最佳实践**：
1. **格式规范**：本项目名_函数名，例如：`package_facdb4__c_getUserData`
2. **稳定性原则**：一旦创建，就不要轻易修改，除非迫不得已，因为apiID修改后，调用会失效
3. **字符限制**：只能包含英文字母、下划线、数字，不可包含"-"等特殊字符
4. **长度限制**：apiID长度≤30字符

#### 2. 入参/出参定义部分
```json
{
  "input": [
    {
      "key": "userId",
      "type": "Text",
      "label": "用户ID",
      "required": true,
      "description": "用户的唯一标识符"
    },
    {
      "key": "count",
      "type": "Number",
      "label": "数量",
      "required": false,
      "description": "需要处理的数据数量"
    }
  ],
  "output": [
    {
      "key": "success",
      "type": "Boolean",
      "label": "是否成功",
      "required": true,
      "description": "操作执行结果状态"
    },
    {
      "key": "data",
      "type": "JSON",
      "label": "返回数据",
      "required": false,
      "description": "具体的业务数据内容"
    }
  ]
}
```
**⚠️ 重要提醒**：
- **入参/出参**中的 `label` 和 `description` 只能使用**中文字符串格式**，使用双语格式会报错

#### 入参/出参详解

##### 官方支持的参数类型

| 推荐类型 | 数据内容 | 说明 |
|---------|---------|------|
| **Text** | 字符串、API名称 | 简单文本数据 |
| **Number** | 数值、计数器 | 普通数字计算 |
| **Decimal** | 高精度金额 | 财务相关计算 |
| **BigInt** | 超大整数 | 大数值处理 |
| **Boolean** | 开关状态 | 真假判断 |
| **Date** | 日期 | 不含时间信息 |
| **DateTime** | 日期时间 | 完整日期时间信息 |
| **Multilingual** | 多语言文本 | 国际化文本内容 |
| **RichText** | 富文本内容 | 格式化文本 |
| **Email** | 邮箱地址 | 带格式验证 |
| **MobileNumber** | 手机号码 | 带格式验证 |
| **JSON** | 复杂数据、记录 | **结构化数据的首选类型** |
| **Record** | 单条记录 | 需指定objectApiName，建议用JSON替代 |
| **RecordList** | 记录列表 | 需指定objectApiName和fieldApiNames，建议用JSON替代 |

#### 💡 最佳实践
- 优先使用 **JSON** 类型处理复杂数据，提高函数通用性和灵活性
- 避免使用 Record/RecordList，除非有特殊平台集成需求
- 对于数组、列表等复合数据，统一使用 JSON 类型

#### 3. 完整配置示例
```json
{
  "apiID": "package_facdb4__c_getUserData",
  "apiName": "getUserData",
  "label": {
    "zh_CN": "获取用户数据",
    "en_US": "Get User Data"
  },
  "description": {
    "zh_CN": "根据用户ID获取用户相关数据信息",
    "en_US": "Get user related data information by user ID"
  },
  "longTaskMode": false,
  "frontendSDKInvokable": true,
  "input": [
    {
      "key": "userId",
      "type": "Text",
      "label": "用户ID",
      "required": true,
      "description": "用户的唯一标识符"
    },
    {
      "key": "count",
      "type": "Number",
      "label": "数量",
      "required": false,
      "description": "需要处理的数据数量"
    }
  ],
  "output": [
    {
      "key": "success",
      "type": "Boolean",
      "label": "是否成功",
      "required": true,
      "description": "操作执行结果状态"
    },
    {
      "key": "data",
      "type": "JSON",
      "label": "返回数据",
      "required": false,
      "description": "具体的业务数据内容"
    }
  ]
}
```

## 参数定义规范

## 开发与调试

### 创建流程
1. **基础信息**：确定apiID、apiName、label、description
2. **需求分析**：分析输入输出需求，选择合适参数类型
3. **参数定义**：编写详细的参数定义和描述
4. **格式验证**：检查JSON格式和字段完整性

### 常见问题与解决方案

| 问题类型 | 具体问题 | 解决方案 |
|----------|----------|----------|
| **格式错误** | 参数label/description使用对象格式 | 参数级别用字符串，函数级别用对象 |
| **类型错误** | 使用非官方类型（List、Array） | 使用官方类型，数组数据用JSON |
| **字段缺失** | 缺少required字段或必填字段 | 按模板检查所有必填字段 |
| **配置错误** | Record/RecordList缺少配置 | 添加objectApiName或改用JSON |

### 验证清单
- [ ] JSON格式正确无误
- [ ] 所有必填字段已完整填写
- [ ] 参数类型选择合适：仅使用官方支持的参数类型，避免自定义或非标准类型
- [ ] 所有的入参/出参，都需要包含required字段，否则会导致验证警告
- [ ] **label/description格式符合规范：基础信息用双语对象，入参/出参用中文字符串**
- [ ] **apiID长度不超过30个字符，否则会报错**
- [ ] 特殊类型配置完整

## 相关文档

- [云函数的基本组成与目录结构](./cloud-function-basic-structure-and-directory.md)
- [Debug Param JSON Guide](../testing/debug-param-json-guide.md)

## 参考资源

- <mcreference link="https://bytedance.larkoffice.com/wiki/wikcn6VSZyHsVJIzGMBYl4IsNEd" index="1">1</mcreference> 

## 总结

正确配置 `index.meta.json` 的关键要素：

1. **结构完整**：包含所有必填字段，格式规范
2. **类型合适**：根据数据特点选择最佳参数类型
3. **描述清晰**：提供详细的参数说明和使用指导
4. **JSON优先**：复杂数据结构优先使用JSON类型

遵循本指南可以创建结构清晰、功能完整、易于维护的云函数配置文件。