# 模块3：计算引擎模块 (CalculationEngine)

## 📝 模块概述

计算引擎模块负责执行各种业务计算逻辑，包括子表级别的小计计算和主表级别的汇总计算。支持灵活的计算规则配置，可扩展到不同的业务场景。

## 🎯 职责描述

执行各种业务计算逻辑，包括子表级别的小计计算和主表级别的汇总计算。支持灵活的计算规则配置，可扩展到不同的业务场景。

## ⚙️ 核心功能

### 数据计算
- 根据计算规则对每个子表记录执行字段计算
- 通过自定义的js函数，来计算各字段的值
- 处理字段间的依赖关系
- **智能排序计算顺序**：根据字段依赖关系自动确定计算执行顺序

### 计算规则管理
- 管理字段依赖关系
- **依赖图构建**：构建字段依赖关系图，检测循环依赖
- **拓扑排序**：使用拓扑排序算法确定最优计算顺序

## 🔄 计算顺序处理机制

计算引擎需要处理字段间的复杂依赖关系，确保计算的正确性和效率。系统采用图论中的拓扑排序算法来解决字段计算顺序问题，主要包括以下几个方面：

### 核心概念
- **依赖关系分析**：分析每个计算字段的依赖关系，构建有向无环图
- **拓扑排序**：使用拓扑排序算法确定最优的计算执行顺序
- **循环依赖检测**：自动检测和报告配置错误导致的循环依赖
- **分层计算**：将字段按依赖层级分组，同层字段可并行计算
- **动态依赖**：支持基于数据内容的条件依赖关系

### 应用场景
- 复杂的财务计算链：单价×数量→小计→折扣→税费→总计
- 多级汇总计算：子表汇总→主表计算→最终结果
- 条件计算：根据客户类型、订单金额等条件动态计算

详细的算法实现和代码示例请参考：[字段计算顺序算法详解](3-2-calculation-order-algorithm.md)

### 1. 依赖分析
```javascript
// 分析计算依赖关系，确定执行顺序
const dependencyGraph = {
  "child.subtotal": [],                    // 无依赖，优先计算
  "main.totalAmount": ["child.subtotal"],  // 依赖子表计算结果
  "main.finalAmount": ["main.totalAmount"] // 依赖主表其他字段
};
```

### 2. 子表计算
```javascript
// 对每个子表记录执行计算
childRecordList.forEach(record => {
  childRules.forEach(rule => {
    const inputs = extractInputs(record, rule.dependencies);
    const result = evaluateFormula(rule.formula, inputs);
    record[rule.targetField] = applyPrecision(result, rule.precision);
  });
});
```

### 3. 主表计算
```javascript
// 执行主表汇总计算
mainRules.forEach(rule => {
  if (rule.aggregationType) {
    // 聚合计算
    const values = extractAggregationValues(childRecordList, rule.dependencies);
    const result = performAggregation(rule.aggregationType, values);
    mainRecord[rule.targetField] = applyPrecision(result, rule.precision);
  } else {
    // 普通计算
    const inputs = extractInputs(mainRecord, rule.dependencies);
    const result = evaluateFormula(rule.formula, inputs);
    mainRecord[rule.targetField] = applyPrecision(result, rule.precision);
  }
});
```

## ❌ 错误处理

### 错误类型分类

| 错误代码 | 错误类型 | 说明 |
|----------|----------|------|
| FORMULA_SYNTAX_ERROR | 公式语法错误 | 计算公式语法不正确 |
| DEPENDENCY_NOT_FOUND | 依赖字段不存在 | 计算依赖的字段在数据中不存在 |
| DIVISION_BY_ZERO | 除零错误 | 计算过程中出现除零操作 |
| CALCULATION_OVERFLOW | 计算溢出 | 计算结果超出数值范围 |
| AGGREGATION_ERROR | 聚合计算错误 | 聚合函数执行失败 |

### 错误恢复策略
```javascript
{
  errorRecovery: {
    skipInvalidRecords: true,     // 跳过无效记录
    useDefaultValues: true,       // 使用默认值
    logErrors: true,              // 记录错误日志
    continueOnError: false        // 遇到错误是否继续
  }
}
```

## 🔧 配置选项


## 📊 性能指标

## 🧪 测试用例

### 正常场景测试
4. JS公式计算

### 异常场景测试
1. 除零错误处理
2. 依赖字段缺失
3. 公式语法错误
4. 计算溢出处理

### 性能测试
1. 大数据量计算
2. 复杂公式性能
3. 并行计算效果

## 🔗 上下游模块接口

### 接收来自数据获取模块
```javascript
{
  recordData: {
    mainRecord: { /* 主表记录 */ },
    childRecordList: [ /* 子表记录列表 */ ]
  },
  calculationRules: { /* 计算规则配置 */ }
}
```

### 传递给验证对比模块
```javascript
{
  calculatedResults: {
    childCalculations: [ /* 子表计算结果 */ ],
    mainCalculations: { /* 主表计算结果 */ },
    calculationMetadata: { /* 计算元信息 */ }
  },
  originalData: { /* 原始数据，用于对比 */ },
  validationRules: { /* 验证规则 */ }
}
```

## 🔄 计算优化策略

### 并行计算
```javascript
// 子表记录并行计算
const childCalculationPromises = childRecordList.map(async (record) => {
  return await calculateChildRecord(record, childRules);
});

const childResults = await Promise.all(childCalculationPromises);
```
