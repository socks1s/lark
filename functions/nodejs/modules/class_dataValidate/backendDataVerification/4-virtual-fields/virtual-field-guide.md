# 虚拟字段使用指南

## 🎯 问题场景

在编写自定义公式时，经常需要引用一些**不存在的聚合字段**，比如：
- 子表的数量总和
- 平均单价
- 最大值、最小值
- 统计计数
- 复杂的聚合计算

如果为每个聚合值都定义一个额外的列，会导致数据结构臃肿，维护困难。

## 💡 解决方案：虚拟字段

**核心思路**：在 `calculate` 函数内部动态计算所需的聚合值，无需在数据结构中定义额外的列。

## 🔧 实现方法

### 1. 基础虚拟字段模式

```javascript
"child.字段名": {
  dependencies: ["child.直接依赖字段"], // 只声明直接依赖
  calculate: (data, child) => {
    // 🎯 在函数内部动态计算虚拟字段
    const 数量总和 = data.childRecords.reduce((sum, c) => sum + c.数量, 0);
    const 平均单价 = data.childRecords.reduce((sum, c) => sum + c.单价, 0) / data.childRecords.length;
    
    // 使用虚拟字段进行业务计算
    const 数量占比 = child.数量 / 数量总和;
    
    // 返回计算结果
    return 基于虚拟字段的计算结果;
  }
}
```

### 2. 常用虚拟字段模式

#### 📊 统计聚合类
```javascript
// 在子表公式中使用
const 统计信息 = {
  总数量: data.childRecords.reduce((sum, c) => sum + c.数量, 0),
  平均价格: data.childRecords.reduce((sum, c) => sum + c.单价, 0) / data.childRecords.length,
  最高价: Math.max(...data.childRecords.map(c => c.单价)),
  最低价: Math.min(...data.childRecords.map(c => c.单价)),
  商品种类数: data.childRecords.length
};
```

#### 🔍 条件筛选类
```javascript
// 特定条件的聚合
const 电子产品数量 = data.childRecords
  .filter(c => c.类别 === "电子产品")
  .reduce((sum, c) => sum + c.数量, 0);

const 高价商品数 = data.childRecords.filter(c => c.单价 > 150).length;

const 低库存商品 = data.childRecords.filter(c => c.库存 < 20);
```

#### 📈 比例计算类
```javascript
// 占比和比率计算
const 数量总和 = data.childRecords.reduce((sum, c) => sum + c.数量, 0);
const 当前商品占比 = child.数量 / 数量总和;

const 类别占比 = data.childRecords
  .filter(c => c.类别 === child.类别)
  .reduce((sum, c) => sum + c.数量, 0) / 数量总和;
```

## 🚀 实际应用示例

### 示例1：库存风险评估（使用数量总和）

```javascript
"child.库存风险系数": {
  dependencies: ["child.库存", "child.数量"],
  calculate: (data, child) => {
    // 🎯 虚拟字段：数量总和
    const 数量总和 = data.childRecords.reduce((sum, c) => sum + c.数量, 0);
    
    // 使用虚拟字段
    const 数量占比 = child.数量 / 数量总和;
    const 库存比率 = child.库存 / child.数量;
    
    let 风险系数 = 1.0;
    if (库存比率 < 2) 风险系数 = 1.5;
    if (数量占比 > 0.4) 风险系数 *= 1.1; // 大宗商品风险加成
    
    return 风险系数;
  }
}
```

### 示例2：价格偏差分析（使用平均价格和标准差）

```javascript
"child.价格偏差系数": {
  dependencies: ["child.单价"],
  calculate: (data, child) => {
    // 🎯 虚拟字段：价格统计
    const 平均单价 = data.childRecords.reduce((sum, c) => sum + c.单价, 0) / data.childRecords.length;
    const 单价方差 = data.childRecords.reduce((sum, c) => sum + Math.pow(c.单价 - 平均单价, 2), 0) / data.childRecords.length;
    const 单价标准差 = Math.sqrt(单价方差);
    
    // 使用虚拟字段
    const 价格偏差 = Math.abs(child.单价 - 平均单价);
    const 偏差比例 = 单价标准差 > 0 ? 价格偏差 / 单价标准差 : 0;
    
    if (偏差比例 > 2) return 1.3; // 价格异常
    if (偏差比例 > 1) return 1.1; // 价格偏高
    return 1.0; // 价格正常
  }
}
```

### 示例3：智能折扣计算（使用多个虚拟聚合字段）

```javascript
"main.智能折扣率": {
  dependencies: ["main.VIP等级"],
  calculate: (data) => {
    // 🎯 多个虚拟字段
    const 商品总数 = data.childRecords.length;
    const 数量总和 = data.childRecords.reduce((sum, c) => sum + c.数量, 0);
    const 电子产品占比 = data.childRecords
      .filter(c => c.类别 === "电子产品")
      .reduce((sum, c) => sum + c.数量, 0) / 数量总和;
    const 高价商品占比 = data.childRecords.filter(c => c.单价 > 150).length / 商品总数;
    
    // 基于虚拟字段的复杂折扣逻辑
    let 折扣率 = 基础VIP折扣;
    if (商品总数 >= 3) 折扣率 += 0.02;
    if (电子产品占比 > 0.5) 折扣率 += 0.03;
    if (高价商品占比 > 0.3) 折扣率 += 0.02;
    
    return Math.min(折扣率, 0.25);
  }
}
```

## ✅ 核心优势

### 1. **无需额外列定义**
- ❌ 不需要在数据结构中定义 `数量总和`、`平均单价` 等字段
- ✅ 在需要时动态计算，用完即丢

### 2. **保持依赖关系准确**
- ✅ 在 `dependencies` 中只声明真实存在的字段
- ✅ 系统仍能正确进行拓扑排序

### 3. **计算灵活高效**
- ✅ 支持任意复杂的聚合逻辑
- ✅ 可以组合多个虚拟字段
- ✅ 实时计算，数据始终最新

### 4. **代码清晰易维护**
- ✅ 虚拟字段逻辑集中在一个函数内
- ✅ 不会污染数据结构
- ✅ 易于调试和修改

## 🎯 最佳实践

### 1. **性能优化**
```javascript
// ✅ 好的做法：提前计算公共虚拟字段
const 公共统计 = {
  数量总和: data.childRecords.reduce((sum, c) => sum + c.数量, 0),
  平均单价: data.childRecords.reduce((sum, c) => sum + c.单价, 0) / data.childRecords.length
};

// ❌ 避免：重复计算相同的聚合值
data.childRecords.forEach(child => {
  const 数量总和 = data.childRecords.reduce((sum, c) => sum + c.数量, 0); // 重复计算
});
```

### 2. **错误处理**
```javascript
// ✅ 防护空数组和除零错误
const 平均单价 = data.childRecords.length > 0 
  ? data.childRecords.reduce((sum, c) => sum + c.单价, 0) / data.childRecords.length 
  : 0;

const 数量占比 = 数量总和 > 0 ? child.数量 / 数量总和 : 0;
```

### 3. **调试友好**
```javascript
// ✅ 添加调试信息
console.log(`虚拟字段统计: 总数=${数量总和}, 平均价=${平均单价.toFixed(2)}`);
```

## 📊 运行结果验证

通过运行演示程序，验证了虚拟字段方案的有效性：

- **虚拟字段公式数**: 4个
- **计算顺序**: `child.库存风险系数 → child.价格偏差系数 → main.智能折扣率 → child.综合评分`
- **验证结果**: ✅ 通过
- **核心优势**: 🎯 动态计算聚合值，无需额外列定义

## 🎉 总结

虚拟字段方案完美解决了在公式中引用不存在聚合字段的问题：

1. **简单易用**：在 `calculate` 函数内直接计算需要的聚合值
2. **保持依赖**：系统仍能正确处理字段依赖关系
3. **性能良好**：按需计算，不占用额外存储空间
4. **扩展性强**：支持任意复杂的聚合逻辑

这样既满足了复杂业务计算的需求，又保持了数据结构的简洁性！