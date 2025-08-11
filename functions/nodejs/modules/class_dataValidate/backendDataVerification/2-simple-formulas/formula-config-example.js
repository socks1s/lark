/**
 * 公式配置示例
 * 演示如何通过修改公式配置来改变计算逻辑和顺序
 */

// 示例1：基础采购单计算
const basicPurchaseFormulas = {
  "child.小计": "child.单价 * child.数量",
  "main.总价": "SUM(child.小计)"
};

// 示例2：带折扣的采购单（当前演示使用的）
const discountPurchaseFormulas = {
  "child.小计": "child.单价 * child.数量",
  "child.折扣后单价": "child.单价 * (1 - main.折扣率)",
  "child.折扣后小计": "child.折扣后单价 * child.数量",
  "main.基础总价": "SUM(child.小计)",
  "main.折扣金额": "main.基础总价 * main.折扣率",
  "main.最终总价": "SUM(child.折扣后小计)"
};

// 示例3：复杂业务场景 - 带税费和运费
const complexBusinessFormulas = {
  // 子表基础计算
  "child.小计": "child.单价 * child.数量",
  "child.税额": "child.小计 * main.税率",
  "child.含税小计": "child.小计 + child.税额",
  
  // 主表汇总
  "main.商品总价": "SUM(child.小计)",
  "main.税费总额": "SUM(child.税额)",
  "main.含税总价": "main.商品总价 + main.税费总额",
  "main.最终总价": "main.含税总价 + main.运费"
};

// 示例4：动态折扣 - 基于总价的阶梯折扣
const tieredDiscountFormulas = {
  // 第一轮：基础计算
  "child.小计": "child.单价 * child.数量",
  "main.基础总价": "SUM(child.小计)",
  
  // 第二轮：根据总价确定折扣率（需要自定义函数）
  "main.动态折扣率": "TIERED_DISCOUNT(main.基础总价)", // 自定义函数
  
  // 第三轮：应用动态折扣
  "child.折扣后单价": "child.单价 * (1 - main.动态折扣率)",
  "child.折扣后小计": "child.折扣后单价 * child.数量",
  "main.最终总价": "SUM(child.折扣后小计)"
};

// 测试不同公式配置的函数
function testDifferentFormulas() {
  const { autoCalculate } = require('./auto-dependency-demo');
  
  const testData = {
    mainRecord: { id: "PO001", 折扣率: 0.1, 税率: 0.13, 运费: 50 },
    childRecords: [
      { id: "item1", 单价: 100, 数量: 2 },
      { id: "item2", 单价: 200, 数量: 1 }
    ]
  };
  
  console.log("=== 测试不同公式配置 ===\n");
  
  // 测试基础公式
  console.log("1. 基础采购单计算:");
  const basicData = JSON.parse(JSON.stringify(testData));
  const basicResult = autoCalculate(basicData, basicPurchaseFormulas);
  console.log(`结果: 总价 = ${basicResult.finalData.mainRecord.总价}\n`);
  
  // 测试复杂业务公式
  console.log("2. 复杂业务场景计算:");
  const complexData = JSON.parse(JSON.stringify(testData));
  const complexResult = autoCalculate(complexData, complexBusinessFormulas);
  console.log(`结果: 最终总价 = ${complexResult.finalData.mainRecord.最终总价}\n`);
}

// 公式语法说明
const formulaSyntaxGuide = {
  "基础运算": {
    "加法": "field1 + field2",
    "减法": "field1 - field2", 
    "乘法": "field1 * field2",
    "除法": "field1 / field2"
  },
  
  "字段引用": {
    "主表字段": "main.字段名",
    "子表字段": "child.字段名"
  },
  
  "聚合函数": {
    "求和": "SUM(child.字段名)",
    "平均": "AVG(child.字段名)", // 需要扩展实现
    "最大值": "MAX(child.字段名)", // 需要扩展实现
    "最小值": "MIN(child.字段名)"  // 需要扩展实现
  },
  
  "条件表达式": {
    "三元运算": "condition ? value1 : value2", // 需要扩展实现
    "自定义函数": "CUSTOM_FUNCTION(参数)"      // 需要扩展实现
  }
};

console.log("📚 公式语法指南:");
console.log(JSON.stringify(formulaSyntaxGuide, null, 2));

// 如果直接运行此文件
if (require.main === module) {
  testDifferentFormulas();
}

module.exports = {
  basicPurchaseFormulas,
  discountPurchaseFormulas,
  complexBusinessFormulas,
  tieredDiscountFormulas,
  formulaSyntaxGuide,
  testDifferentFormulas
};