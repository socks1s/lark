# 差异树生成模块 (generateDiffTree)

## 更新日志

### 2025年最新更新 - undefined优先判断机制
- **重要变更**: 实现了undefined值的优先判断机制，确保在类型比较前正确处理undefined值
- **核心逻辑**: 在进行任何类型比较和状态判断之前，优先检查值是否为undefined
- **处理流程**: 标准化的值处理流程 - undefined检查 → 类型判断 → 具体比较
- **工具函数**: 通过统一的工具函数进行undefined检查，避免重复实现
- **影响范围**: 
  - 更新了所有比较器的处理逻辑
  - 统一了空值处理标准
  - 提高了比较结果的准确性

### 2024年最新更新 - 统计信息格式标准化
- **重要变更**: 统计信息输出格式已标准化，只保留核心的6个字段
- **移除字段**: 删除了性能相关指标（如 `totalNodes`、`totalComparisons`、`processingTime` 等）
- **保留字段**: 只保留节点状态统计信息（`total`、`unchanged`、`modified`、`added`、`deleted`、`ignored`）
- **影响范围**: 
  - 更新了统计信息收集器的输出格式
  - 修改了所有示例代码和文档
  - 确保与需求规范的完全一致性
- **升级指南**: 如果您的代码依赖旧的统计字段，请更新为使用新的标准化字段

这是一个完整的模块化差异树生成系统，用于比较两个JSON对象并生成详细的差异树结构。

## 🚀 快速开始

```javascript
const { generateDiffTree } = require('./index');

const oldData = { name: "张三", age: 25 };
const newData = { name: "张三", age: 26, email: "zhangsan@example.com" };

const result = generateDiffTree(oldData, newData);
console.log(result.tree);
```

## 📋 功能特性

- ✅ **完整的对象比较**: 支持嵌套对象、数组、原始类型的深度比较
- ✅ **状态传播机制**: 自动计算父节点状态（unchanged/modified/added/deleted/ignored）
- ✅ **字段忽略支持**: 支持路径模式和精确匹配的字段忽略
- ✅ **undefined优先处理**: 在类型判断前优先检查undefined值，确保处理准确性
- ✅ **性能优化**: 针对大型数组和复杂对象的优化策略
- ✅ **标准化统计信息**: 提供符合需求规范的统计信息格式
- ✅ **错误处理**: 完善的错误处理和诊断信息
- ✅ **模块化设计**: 清晰的模块分离，易于维护和扩展

## 🔧 API 使用

### 基础用法

```javascript
const result = generateDiffTree(oldData, newData);
```

## generateDiffTree 函数

### 功能描述
生成两个数据对象之间的差异树，用于比较和分析数据变化。

### 输入参数
- `oldData`: 旧数据对象
- `newData`: 新数据对象  
- `ignoreFields`: 忽略的字段数组
- `options`: 配置选项

### 输出结果
- `success`: 执行是否成功
- `tree`: 差异树结构
- `statistics`: 统计信息
- `metadata`: 元数据信息
- `diagnostics`: 诊断信息

---

# generateDiffTree 真实数据测试方案

## 概述

本方案为 `generateDiffTree` 函数提供了从线上数据库获取真实业务数据进行测试的完整解决方案。通过多种数据获取策略和预定义模板，可以快速构造真实的测试用例。

## 文件结构

```
generateDiffTree/
├── index.js                    # 原始 generateDiffTree 函数
├── index.meta.json             # 原始函数元数据
├── debug.param.json            # 原始调试参数
├── fetchRealTestData.js        # 真实数据获取模块
├── testDataGenerator.js        # 测试数据生成器
├── realDataTest.js             # 真实数据测试云函数
├── realDataTest.meta.json      # 测试云函数元数据
├── realDataTest.debug.param.json # 测试云函数调试参数
└── README.md                   # 使用说明文档
```

## 核心功能

### 1. 数据获取策略

#### `random` - 随机获取
- 从数据库中随机选择两条记录进行对比
- 适用于基础功能测试

#### `latest` - 最新记录对比
- 获取最新和次新的两条记录
- 适用于测试最近数据变化

#### `specific` - 指定条件获取
- 根据指定的记录ID或查询条件获取数据
- 适用于针对性测试

#### `version_compare` - 版本对比
- 获取同一业务实体的不同版本进行对比
- 适用于有版本控制的业务对象

### 2. 预定义模板

#### `basic_random` - 基础随机测试
```javascript
{
  strategy: 'random',
  fetchOptions: {
    excludeFields: ['_createTime', '_updateTime', 'lastUpdateTime']
  },
  diffOptions: {
    includeUnchanged: false,
    enableDiagnostics: true
  }
}
```

#### `latest_comparison` - 最新记录对比
```javascript
{
  strategy: 'latest',
  fetchOptions: {
    timeField: '_createTime',
    excludeFields: ['_updateTime', 'lastUpdateTime']
  },
  diffOptions: {
    includeUnchanged: true,
    maxDepth: 5
  }
}
```

#### `version_comparison` - 版本对比测试
```javascript
{
  strategy: 'version_compare',
  fetchOptions: {
    businessIdField: 'businessId',
    versionField: 'version'
  },
  diffOptions: {
    ignoreFields: ['_id', '_createTime', '_updateTime', 'version'],
    includeUnchanged: false,
    enableDiagnostics: true
  }
}
```

#### `deep_comparison` - 深度对比测试
```javascript
{
  strategy: 'random',
  fetchOptions: {
    removeNullValues: true,
    removeEmptyStrings: true
  },
  diffOptions: {
    maxDepth: 20,
    arrayComparison: 'content',
    includeUnchanged: true,
    enableDiagnostics: true
  }
}
```

## 使用方法

### 方法1：使用预定义模板（推荐）

```javascript
// 调用 realDataTest 云函数
const params = {
  objectApiName: "YourBusinessObject",
  testMode: "template",
  templateName: "basic_random",
  debug: true
};

const result = await application.function.invoke("generateDiffTreeRealDataTest", params);
```

### 方法2：自定义配置

```javascript
const params = {
  objectApiName: "YourBusinessObject",
  testMode: "custom",
  strategy: "latest",
  fetchOptions: {
    selectFields: ["field1", "field2", "field3"],
    excludeFields: ["_createTime", "_updateTime"],
    timeField: "_createTime"
  },
  diffOptions: {
    ignoreFields: ["_id", "lastUpdateTime"],
    includeUnchanged: true,
    maxDepth: 15,
    enableDiagnostics: true
  },
  debug: true
};

const result = await application.function.invoke("generateDiffTreeRealDataTest", params);
```

### 方法3：直接使用模块

```javascript
const { generateFromTemplate } = require('./testDataGenerator');

const testCase = await generateFromTemplate(
  "YourBusinessObject",
  "basic_random",
  {
    fetchOptions: { removeNullValues: true },
    diffOptions: { maxDepth: 20 }
  },
  logger
);
```

## 参数说明

### 输入参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|---------|
| objectApiName | string | 是 | 业务对象API名称 |
| testMode | string | 否 | 测试模式：template 或 custom |
| templateName | string | 否 | 预定义模板名称 |
| strategy | string | 否 | 数据获取策略（custom模式） |
| fetchOptions | object | 否 | 数据获取选项 |
| diffOptions | object | 否 | 差异对比选项 |
| saveResult | boolean | 否 | 是否保存测试结果 |
| debug | boolean | 否 | 是否返回详细调试信息 |

### fetchOptions 配置

| 参数名 | 类型 | 说明 |
|--------|------|---------|
| selectFields | array | 指定查询字段 |
| excludeFields | array | 排除字段列表 |
| timeField | string | 时间字段名（latest策略） |
| businessIdField | string | 业务ID字段（version_compare策略） |
| versionField | string | 版本字段（version_compare策略） |
| businessId | string | 指定业务ID（version_compare策略） |
| recordIds | array | 指定记录ID列表（specific策略） |
| whereCondition | object | 查询条件（specific策略） |
| removeNullValues | boolean | 是否移除null值 |
| removeEmptyStrings | boolean | 是否移除空字符串 |

### diffOptions 配置

| 参数名 | 类型 | 说明 |
|--------|------|---------|
| ignoreFields | array | 忽略字段列表 |
| includeUnchanged | boolean | 是否包含未变更字段 |
| maxDepth | number | 最大比较深度 |
| arrayComparison | string | 数组比较方式：index 或 content |
| enableDiagnostics | boolean | 是否启用诊断信息 |
| customComparators | object | 自定义比较器 |

## 输出结果

```javascript
{
  success: true,
  testId: "test_1703123456789",
  summary: {
    hasChanges: true,
    changeCount: 5,
    addedCount: 2,
    modifiedCount: 2,
    deletedCount: 1
  },
  metadata: {
    testId: "test_1703123456789",
    timestamp: "2023-12-21T03:17:36.789Z",
    objectApiName: "YourBusinessObject",
    strategy: "random",
    dataSource: "production_database"
  },
  diffResult: {
    success: true,
    hasChanges: true,
    statistics: { /* 详细统计信息 */ },
    tree: { /* 差异树结构 */ },
    diagnostics: { /* 诊断信息 */ }
  },
  // debug模式下包含
  inputData: {
    oldData: { /* 原始数据 */ },
    newData: { /* 新数据 */ },
    options: { /* 比较选项 */ }
  }
}
```

## 最佳实践

### 1. 选择合适的策略
- **开发测试**：使用 `basic_random` 模板
- **功能验证**：使用 `latest_comparison` 模板
- **版本控制场景**：使用 `version_comparison` 模板
- **深度测试**：使用 `deep_comparison` 模板

### 2. 性能优化
- 使用 `selectFields` 限制查询字段
- 合理设置 `maxDepth` 避免过深递归
- 批量测试时添加适当延迟

### 3. 数据清理
- 配置 `excludeFields` 排除不相关字段
- 使用 `removeNullValues` 清理空值
- 设置合适的 `ignoreFields` 忽略系统字段

### 4. 错误处理
- 确保目标对象有足够的测试数据
- 检查字段名称和数据类型匹配
- 监控数据库查询性能

## 扩展功能

### 1. 自定义比较器
```javascript
const customComparators = {
  'price': (oldVal, newVal) => {
    // 价格比较，忽略小数点后两位以外的差异
    return Math.abs(oldVal - newVal) < 0.01;
  }
};
```

### 2. 结果保存
设置 `saveResult: true` 可将测试结果保存到数据库，便于后续分析。

### 3. 批量测试
使用 `generateMultipleTestCases` 函数可批量生成多个测试用例。

## 注意事项

1. **数据权限**：确保有足够权限访问目标业务对象
2. **数据量**：大数据量对象建议使用字段过滤
3. **性能影响**：频繁测试可能对数据库造成压力
4. **数据敏感性**：注意不要在日志中暴露敏感数据
5. **版本兼容**：确保 `application.data.object` API 可用

## 故障排除

### 常见错误

1. **记录数量不足**
   - 确保目标对象至少有2条记录
   - 检查查询条件是否过于严格

2. **字段不存在**
   - 验证 `selectFields` 中的字段名
   - 检查 `timeField`、`businessIdField` 等配置

3. **权限不足**
   - 确认对目标对象的读取权限
   - 检查数据库连接状态

4. **内存溢出**
   - 减少 `maxDepth` 设置
   - 使用字段过滤减少数据量

通过这套完整的解决方案，你可以轻松地从线上数据库获取真实业务数据，对 `generateDiffTree` 函数进行全面的测试验证。

### 忽略字段

```javascript
// 忽略特定字段
const result = generateDiffTree(oldData, newData, ['email', 'user.password']);

// 使用模式匹配
const result = generateDiffTree(oldData, newData, ['*.temp', 'user.*.internal']);
```

### 配置选项

```javascript
const options = {
  maxStringLength: 100,        // 字符串长度限制
  arrayOptimization: 'deep',   // 数组优化策略: 'shallow' | 'deep'
  stringComparison: 'strict'   // 字符串比较模式: 'strict' | 'case-insensitive'
};

const result = generateDiffTree(oldData, newData, [], options);
```

## 📊 返回结果结构

```javascript
{
  success: true,              // 是否成功
  tree: {                     // 差异树根节点
    path: "root",
    status: "modified",       // unchanged | modified | added | deleted | ignored
    fieldType: "object",      // 字段类型
    children: { ... }         // 子节点
  },
  statistics: {               // 统计信息（符合需求规范）
    total: 15,                // 总节点数
    unchanged: 8,             // 未变更节点数
    modified: 4,              // 已修改节点数
    added: 2,                 // 新增节点数
    deleted: 1,               // 删除节点数
    ignored: 0                // 忽略节点数
  },
  metadata: {                 // 元数据
    version: "1.0.0",
    timestamp: "2024-01-01T00:00:00.000Z"
  },
  diagnostics: {              // 诊断信息
    errors: [],
    warnings: [],
    hasErrors: false,
    hasWarnings: false
  }
}
```

## 📊 统计信息说明

统计信息严格按照需求规范输出，包含以下字段：

- **total**: 总节点数（包括根节点在内的所有节点）
- **unchanged**: 未发生变化的节点数量
- **modified**: 值发生变化的节点数量
- **added**: 新增的节点数量
- **deleted**: 删除的节点数量
- **ignored**: 被忽略的节点数量

> **注意**: 统计信息格式已按照需求规范进行标准化，移除了之前的性能指标（如processingTime、totalComparisons等），专注于节点状态统计。

## 🏗️ 模块架构

```
generateDiffTree/
├── index.js                 # 主入口文件
├── core/
│   └── diffEngine.js        # 差异引擎核心
├── comparators/             # 比较器模块
│   ├── compareNodes.js      # 节点比较统一入口
│   ├── objectComparator.js  # 对象比较器
│   ├── arrayComparator.js   # 数组比较器
│   └── primitiveComparator.js # 原始类型比较器
├── nodes/                   # 节点处理模块
│   ├── nodeFactory.js       # 节点工厂
│   ├── nodeProcessor.js     # 节点处理器
│   └── statusPropagation.js # 状态传播
├── utils/                   # 工具模块
│   ├── typeUtils.js         # 类型工具
│   ├── pathUtils.js         # 路径工具
│   └── textUtils.js         # 文本工具
├── config/                  # 配置模块
│   ├── configManager.js     # 配置管理
│   └── versionManager.js    # 版本管理
└── stats/
    └── statisticsCollector.js # 统计收集器
```

## 🧪 测试和演示

- `demo.js` - 快速演示基本功能
- `test_example.js` - 详细测试用例和输出

运行演示：
```bash
node demo.js
```

运行详细测试：
```bash
node test_example.js
```

## 📝 状态说明

- **unchanged**: 值完全相同
- **modified**: 值发生变化
- **added**: 新增的字段
- **deleted**: 删除的字段  
- **ignored**: 被忽略的字段

## 🔍 高级特性

### 数组优化策略

- `shallow`: 简单索引比较，适合小数组
- `deep`: 深度比较，适合复杂数组结构

### 字符串比较模式

- `strict`: 严格比较（区分大小写）
- `case-insensitive`: 忽略大小写比较

### 字段忽略模式

- 精确路径: `user.email`
- 通配符: `*.temp`, `user.*.internal`
- 数组索引: `items[0].id`

## 🚀 性能特性

- 针对大型对象的内存优化
- 循环引用检测和处理
- 可配置的字符串长度限制
- 智能的数组比较策略

---

*该模块完全按照 `差异树生成需求规范.md` 实现，提供完整的模块化差异树生成功能。*