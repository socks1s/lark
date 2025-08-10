# 模块2：数据获取模块 (DataRetriever)

## 📝 模块概述

数据获取模块负责根据编辑类型和记录信息，从数据库中获取完整的主子表数据集。确保无论是主表编辑还是子表编辑，都能获得一致的数据结构。

## 🎯 职责描述

根据编辑类型和记录信息，从数据库中获取完整的主子表数据集。确保无论是主表编辑还是子表编辑，都能获得一致的数据结构。

## ⚙️ 核心功能

### 主表/子表编辑场景处理
- **主表编辑**：根据主表记录ID获取主表数据和所有关联子表记录
- **子表编辑**：根据子表记录获取其父记录和所有兄弟记录

### 数据统一化
- 将主表和子表数据整合为统一的数据结构
- 建立主子表之间的关联关系映射
- 确保数据字段命名和类型的一致性

### 数据完整性检查
- 验证主表记录是否存在
- 检查子表记录的完整性
- 确认计算所需的依赖字段都已获取

## 📋 输入输出参数简述

### 输入参数
- **requestContext**: 请求上下文（来自请求处理模块）
- **databaseConfig**: 数据库连接配置信息

//获取主表数据：
- **mainObjectApiName**: 主表对象API名称
- **mainRecordId**: 主数据id

//获取子表数据（调用： batchFindRelatedRecords ）：
- **childObjectApiName**: 子表对象API名称
- **parentFieldApiName**: 子表外键字段名

batchFindRelatedRecords:
input:
  - parentFieldApiName
  - parentRecord
  - childObjectApiName
  - selectChildFields
output:
  - relatedRecords

### 输出参数
- **成功时**: 返回 `dataContext` 对象，包含主表数据、子表数据列表和数据获取元信息
- **失败时**: 返回错误信息，包含错误类型、消息和重试建议

## 📥 输入格式

### 输入参数结构
```javascript
{
  requestContext: {
    editType: "main",
    editedRecordId: "purchase_001",
    objectConfig: {
      mainObjectApiName: "PurchaseOrder",
      childObjectApiName: "PurchaseOrderItem",
      parentFieldApiName: "purchaseOrderId"
    },
    routingStrategy: "main_table_edit",
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
          }
        ]
      }
    },
    editedRecord: {
      id: "purchase_001",
      totalAmount: 15000.00,
      discountRate: 0.05,
      finalAmount: 14250.00
    }
  },
  databaseConfig: {
    connectionString: "...",
    timeout: 30000,
    retryAttempts: 3,
    poolSize: 10
  }
}
```

### 参数说明

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| requestContext | Object | 是 | 来自请求处理模块的上下文信息 |
| databaseConfig | Object | 是 | 数据库连接配置 |

## 📤 输出格式

### 成功获取数据的输出
```javascript
{
  success: true,
  dataContext: {
    mainRecord: {
      id: "purchase_001",
      supplierName: "供应商A",
      orderDate: "2024-01-15",
      totalAmount: 15000.00,      // 当前数据库中的总价
      discountRate: 0.05,
      finalAmount: 14250.00,
      status: "draft",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    childRecordList: [
      {
        id: "item_001",
        purchaseOrderId: "purchase_001",
        productName: "商品A",
        price: 100.00,             // 单价
        quantity: 50,              // 数量
        subtotal: 5000.00,         // 小计
        category: "electronics",
        createdAt: "2024-01-15T09:15:00Z"
      },
      {
        id: "item_002", 
        purchaseOrderId: "purchase_001",
        productName: "商品B",
        price: 200.00,
        quantity: 50,
        subtotal: 10000.00,
        category: "furniture",
        createdAt: "2024-01-15T09:20:00Z"
      }
    ]
  }
}
```

### 数据获取失败的输出
```javascript
{
  success: false,
  error: {
    code: "DATA_RETRIEVAL_FAILED",
    message: "无法获取主表记录",
    details: {
      recordId: "purchase_001",
      tableName: "PurchaseOrder",
      sqlError: "Table 'PurchaseOrder' doesn't exist",
      queryAttempts: 3
    },
    timestamp: "2024-01-15T10:30:00.000Z",
    module: "DataRetriever"
  }
}
```

## 🔄 数据获取策略

### 主表编辑策略 (main_table_edit)

**执行步骤**：
1. 根据 `editedRecordId` 查询主表记录
2. 使用主表ID查询所有关联的子表记录
3. 验证数据完整性
4. 构建统一的数据上下文

**SQL查询示例**：
```sql
-- 主表查询
SELECT * FROM PurchaseOrder WHERE id = 'purchase_001';

-- 子表查询
SELECT * FROM PurchaseOrderItem WHERE purchaseOrderId = 'purchase_001';
```

### 子表编辑策略 (child_table_edit)

**执行步骤**：
1. 根据 `editedRecordId` 查询子表记录
2. 从子表记录中提取父表ID
3. 查询父表记录
4. 查询所有兄弟子表记录
5. 构建统一的数据上下文


## 🔍 数据完整性检查

### 主表记录检查
- 记录是否存在
- 必需字段是否完整
- 数据类型是否正确
- 业务状态是否有效

### 子表记录检查
- 关联关系是否正确
- 外键约束是否满足
- 记录数量是否合理
- 数据一致性验证

### 依赖字段检查
根据计算规则中的 `dependencies`，确保所有依赖字段都存在于获取的数据中：

```javascript
// 检查子表计算依赖
childRules.forEach(rule => {
  rule.dependencies.forEach(field => {
    // 验证每个子表记录都包含依赖字段
    childRecordList.forEach(record => {
      if (!(field in record)) {
        throw new Error(`子表记录缺少依赖字段: ${field}`);
      }
    });
  });
});

// 检查主表计算依赖
mainRules.forEach(rule => {
  rule.dependencies.forEach(field => {
    if (field.startsWith('child.')) {
      // 子表聚合字段，已在上面检查
    } else if (!(field in mainRecord)) {
      throw new Error(`主表记录缺少依赖字段: ${field}`);
    }
  });
});
```

## 🚀 性能优化

### 查询优化
- 使用索引优化查询性能
- 批量查询减少数据库往返
- 查询结果缓存
- 连接池管理

### 数据传输优化
- 只查询必需字段
- 数据压缩传输
- 分页处理大数据集
- 异步数据加载

### 缓存策略
```javascript
{
  cacheConfig: {
    enableCache: true,
    cacheExpiry: 300,          // 缓存过期时间(秒)
    cacheKey: "dataContext_{recordId}_{timestamp}",
    invalidateOnUpdate: true   // 数据更新时失效缓存
  }
}
```

## ❌ 错误处理

### 错误类型分类

| 错误代码 | 错误类型 | 说明 |
|----------|----------|------|
| DATABASE_CONNECTION_FAILED | 连接错误 | 无法连接到数据库 |
| RECORD_NOT_FOUND | 记录不存在 | 指定的记录不存在 |
| DATA_RETRIEVAL_FAILED | 查询失败 | 数据查询执行失败 |
| DATA_INTEGRITY_ERROR | 数据完整性错误 | 数据不完整或不一致 |
| DEPENDENCY_FIELD_MISSING | 依赖字段缺失 | 计算依赖的字段不存在 |

### 重试机制
```javascript
{
  retryConfig: {
    maxAttempts: 3,
    retryDelay: 1000,          // 重试间隔(ms)
    exponentialBackoff: true,  // 指数退避
    retryableErrors: [
      "DATABASE_CONNECTION_FAILED",
      "QUERY_TIMEOUT"
    ]
  }
}
```

## 🔧 配置选项

### 数据库配置
```javascript
{
  database: {
    connectionString: "mysql://user:pass@host:port/db",
    timeout: 30000,
    retryAttempts: 3,
    poolSize: 10,
    maxConnections: 50,
    idleTimeout: 300000
  },
  query: {
    maxRecordsLimit: 10000,    // 最大记录数限制
    queryTimeout: 15000,       // 查询超时时间
    enableQueryLog: true       // 启用查询日志
  },
  cache: {
    enableCache: true,
    cacheExpiry: 300,
    maxCacheSize: 100          // 最大缓存条目数
  }
}
```

## 📊 性能指标

### 处理时间基准
- 主表查询：< 50ms
- 子表查询：< 100ms
- 数据完整性检查：< 20ms
- 总处理时间：< 200ms

### 数据量限制
- 最大子表记录数：10,000条
- 单条记录最大大小：1MB
- 总数据传输量：< 50MB

## 🧪 测试用例

### 正常场景测试
1. 主表编辑数据获取
2. 子表编辑数据获取
3. 大数据量处理
4. 复杂关联关系处理

### 异常场景测试
1. 记录不存在
2. 数据库连接失败
3. 查询超时
4. 依赖字段缺失

### 性能测试
1. 并发查询测试
2. 大数据量查询测试
3. 缓存命中率测试

## 🔗 上下游模块接口

### 接收来自请求处理模块
```javascript
{
  requestContext: {
    editType: "main",
    editedRecordId: "purchase_001",
    objectConfig: { /* 对象配置 */ },
    verificationRules: { /* 验证规则 */ }
  }
}
```

### 传递给计算引擎模块
```javascript
{
  dataContext: {
    mainRecord: { /* 主表记录 */ },
    childRecordList: [ /* 子表记录列表 */ ],
    dataMetadata: { /* 数据元信息 */ }
  },
  calculationRules: { /* 从requestContext提取的计算规则 */ }
}
```

## 🔄 数据流转示例

### 主表编辑流程
```
用户编辑主表 → 请求处理模块 → 数据获取模块
                                    ↓
获取主表记录(purchase_001) ← 数据库查询
                                    ↓
获取子表记录列表 ← 数据库查询(WHERE purchaseOrderId = 'purchase_001')
                                    ↓
数据完整性检查 → 构建dataContext → 传递给计算引擎模块
```

### 子表编辑流程
```
用户编辑子表 → 请求处理模块 → 数据获取模块
                                   ↓
获取子表记录(item_001) ← 数据库查询
                                   ↓
提取父表ID(purchase_001) → 获取主表记录 ← 数据库查询
                                   ↓
获取所有兄弟记录 ← 数据库查询(WHERE purchaseOrderId = 'purchase_001')
                                   ↓
数据完整性检查 → 构建dataContext → 传递给计算引擎模块
```