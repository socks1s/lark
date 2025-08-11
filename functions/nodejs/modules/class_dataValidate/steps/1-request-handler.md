# 模块1：请求处理模块 (RequestHandler)

## 📝 模块概述

请求处理模块是数据验算系统的入口模块，负责接收外部请求，验证输入参数的完整性和合法性，并根据编辑类型（主表/子表）将请求路由到相应的处理流程。

## 🎯 职责描述

负责接收外部请求，验证输入参数的完整性和合法性，并根据编辑类型（主表/子表）将请求路由到相应的处理流程。

## ⚙️ 核心功能

- **参数验证**：检查必需参数是否存在，数据类型是否正确
- **编辑类型识别**：判断是主表编辑还是子表编辑
- **请求路由**：根据编辑类型选择相应的数据获取策略
- **错误处理**：对无效请求返回标准化错误信息

## 📋 输入输出参数简述

### 输入参数
- **editedRecord**: 用户编辑的记录数据（包含ID和修改字段）
- **editType**: 编辑类型（"main"主表 或 "child"子表）
- **mainObjectApiName**: 主表对象API名称
- **childObjectApiName**: 子表对象API名称
- **parentFieldApiName**: 子表外键字段名
- **verificationRules**: 验证规则配置（容差、计算规则等）

### 输出参数
- **成功时**: 返回 `requestContext` 对象，包含处理后的请求上下文、路由策略和验证规则
- **失败时**: 返回错误信息，包含错误代码、消息和详细信息

## 📥 输入格式

### 输入参数结构
```javascript
{
  editedRecord: {
    id: "purchase_001",
    totalAmount: 15000.00,        // 用户提交的采购单总价
    discountRate: 0.05,           // 用户提交的折扣率
    finalAmount: 14250.00         // 用户提交的最终金额
  },
  editType: "main",               // 主表编辑 | "child" 子表编辑
  mainObjectApiName: "PurchaseOrder",
  childObjectApiName: "PurchaseOrderItem", 
  parentFieldApiName: "purchaseOrderId",
  verificationRules: {
    tolerance: 0.01,              // 绝对容差1分钱
    relativeTolerance: 0.001,     // 相对容差0.1%
    calculationRules: {
      childRules: [
        {
          targetField: "subtotal",
          formula: "price * quantity",
          dependencies: ["price", "quantity"]
        }
      ],
      mainRules: [
        {
          targetField: "totalAmount", 
          formula: "SUM(child.subtotal)",
          dependencies: ["child.subtotal"]
        },
        {
          targetField: "finalAmount",
          formula: "totalAmount * (1 - discountRate)",
          dependencies: ["totalAmount", "discountRate"]
        }
      ]
    }
  }
}
```

### 参数说明

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| editedRecord | Object | 是 | 用户编辑的记录数据 |
| editType | String | 是 | 编辑类型："main"(主表) 或 "child"(子表) |
| mainObjectApiName | String | 是 | 主表对象API名称 |
| childObjectApiName | String | 是 | 子表对象API名称 |
| parentFieldApiName | String | 是 | 子表中指向主表的外键字段名 |
| verificationRules | Object | 是 | 验证规则配置 |

### 验证规则结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| tolerance | Number | 绝对容差值 |
| relativeTolerance | Number | 相对容差值（百分比） |
| calculationRules.childRules | Array | 子表计算规则列表 |
| calculationRules.mainRules | Array | 主表计算规则列表 |

### 计算规则结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| targetField | String | 目标计算字段名 |
| formula | String | 计算公式 |
| dependencies | Array | 依赖字段列表 |

## 📤 输出格式

### 验证通过的输出
```javascript
{
  success: true,
  requestContext: {
    editType: "main",
    editedRecordId: "purchase_001",
    objectConfig: {
      mainObjectApiName: "PurchaseOrder",
      childObjectApiName: "PurchaseOrderItem",
      parentFieldApiName: "purchaseOrderId"
    },
    verificationRules: {
      tolerance: 0.01,
      relativeTolerance: 0.001,
      calculationRules: {
        childRules: [
          {
            targetField: "subtotal",
            formula: "price * quantity",
            dependencies: ["price", "quantity"]
          }
        ],
        mainRules: [
          {
            targetField: "totalAmount", 
            formula: "SUM(child.subtotal)",
            dependencies: ["child.subtotal"]
          },
          {
            targetField: "finalAmount",
            formula: "totalAmount * (1 - discountRate)",
            dependencies: ["totalAmount", "discountRate"]
          }
        ]
      }
    },
    routingStrategy: "main_table_edit",
    editedRecord: {
      id: "purchase_001",
      totalAmount: 15000.00,
      discountRate: 0.05,
      finalAmount: 14250.00
    }
  }
}
```

### 验证失败的输出
```javascript
{
  success: false,
  error: {
    code: "INVALID_PARAMETERS",
    message: "缺少必需参数：editType",
    details: {
      missingFields: ["editType"],
      invalidFields: [],
      invalidValues: []
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔍 参数验证规则

### 必需参数检查
- `editedRecord`: 必须存在且为对象类型
- `editType`: 必须为 "main" 或 "child"
- `mainObjectApiName`: 必须为非空字符串
- `childObjectApiName`: 必须为非空字符串
- `parentFieldApiName`: 必须为非空字符串
- `verificationRules`: 必须存在且包含必要的子字段

### 数据类型验证
- `editedRecord.id`: 必须为字符串
- `tolerance`: 必须为正数
- `relativeTolerance`: 必须为0-1之间的数值
- `calculationRules`: 必须包含有效的计算规则数组

### 业务逻辑验证
- 计算规则中的 `dependencies` 字段必须在数据中存在
- 公式语法必须符合支持的表达式格式
- 主表和子表的计算规则不能为空

## 🛣️ 路由策略

### 主表编辑路由 (main_table_edit)
- 适用于：`editType === "main"`
- 数据获取策略：根据主表ID获取主表记录和所有关联子表记录
- 计算优先级：先计算子表字段，再计算主表汇总字段

### 子表编辑路由 (child_table_edit)
- 适用于：`editType === "child"`
- 数据获取策略：根据子表记录的父ID获取主表记录和所有兄弟子表记录
- 计算优先级：先计算当前子表记录，再重新计算主表汇总字段

## ❌ 错误处理

### 错误类型分类

| 错误代码 | 错误类型 | 说明 |
|----------|----------|------|
| INVALID_PARAMETERS | 参数错误 | 缺少必需参数或参数类型错误 |
| INVALID_EDIT_TYPE | 编辑类型错误 | editType 不是有效值 |
| INVALID_CALCULATION_RULES | 计算规则错误 | 计算规则格式不正确 |
| MISSING_DEPENDENCIES | 依赖字段缺失 | 计算规则中的依赖字段在数据中不存在 |

### 错误信息格式
```javascript
{
  success: false,
  error: {
    code: "错误代码",
    message: "错误描述信息",
    details: {
      missingFields: ["缺失的字段列表"],
      invalidFields: ["无效的字段列表"],
      invalidValues: ["无效的值列表"]
    },
    timestamp: "错误发生时间",
    module: "RequestHandler"
  }
}
```

## 🔧 配置选项

### 默认配置
```javascript
{
  validation: {
    strictMode: true,           // 严格模式：所有参数必须符合规范
    allowEmptyRules: false,     // 是否允许空的计算规则
    maxRulesCount: 50          // 最大计算规则数量限制
  },
  routing: {
    defaultStrategy: "auto",    // 默认路由策略
    enableCaching: true        // 是否启用路由缓存
  },
  performance: {
    timeout: 5000,             // 参数验证超时时间(ms)
    maxRecordSize: 1000000     // 最大记录大小限制(bytes)
  }
}
```

## 📊 性能指标

### 处理时间基准
- 参数验证：< 5ms
- 路由决策：< 2ms
- 错误处理：< 1ms

### 内存使用
- 基础内存占用：< 10MB
- 单次请求内存增量：< 1MB

## 🧪 测试用例

### 正常场景测试
1. 主表编辑请求验证
2. 子表编辑请求验证
3. 复杂计算规则验证

### 异常场景测试
1. 缺少必需参数
2. 无效的编辑类型
3. 错误的计算规则格式
4. 依赖字段缺失

### 边界条件测试
1. 最大计算规则数量
2. 最大记录大小
3. 极值容差设置

## 🔗 下游模块接口

处理成功后，将 `requestContext` 传递给 **[数据获取模块](./2-data-retriever.md)**：

```javascript
{
  requestContext: {
    editType: "main",
    editedRecordId: "purchase_001",
    objectConfig: { /* 对象配置 */ },
    verificationRules: { /* 验证规则 */ },
    routingStrategy: "main_table_edit",
    editedRecord: { /* 编辑的记录数据 */ }
  }
}
```