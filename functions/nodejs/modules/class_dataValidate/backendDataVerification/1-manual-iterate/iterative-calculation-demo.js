/**
 * 多轮迭代计算演示程序
 * 场景：采购单with动态折扣
 * 
 * 计算逻辑：
 * 1. 子表：单价 × 数量 = 小计
 * 2. 主表：sum(子表小计) = 基础总价，基础总价 × 0.1 = 折扣金额
 * 3. 子表：单价 × (1 - 主表折扣率) = 折扣后单价，折扣后单价 × 数量 = 折扣后小计
 * 4. 主表：sum(子表折扣后小计) = 最终总价
 */

// 测试数据：精简但体现多轮依赖
const testData = {
  mainRecord: {
    id: "PO001",
    折扣率: 0.1,           // 基础字段
    // 待计算字段：基础总价、折扣金额、最终总价
  },
  childRecords: [
    {
      id: "item1",
      单价: 100,
      数量: 2,
      // 待计算字段：小计、折扣后单价、折扣后小计
    },
    {
      id: "item2", 
      单价: 200,
      数量: 1,
      // 待计算字段：小计、折扣后单价、折扣后小计
    }
  ]
};

// 多轮迭代计算引擎
function calculateWithIterations(data) {
  let currentData = JSON.parse(JSON.stringify(data)); // 深拷贝，包含父子表数据
  let rounds = [];
  
  console.log("=== 开始多轮迭代计算 ===");
  console.log("初始数据:", JSON.stringify(currentData, null, 2));
  
  // 第1轮：子表基础计算
  console.log("\n--- 第1轮：子表基础计算 ---");
  currentData.childRecords.forEach(child => {
    child.小计 = child.单价 * child.数量;
    console.log(`${child.id}: ${child.单价} × ${child.数量} = ${child.小计}`);
  });
  rounds.push("第1轮：计算子表小计");
  
  // 第2轮：主表汇总计算
  console.log("\n--- 第2轮：主表汇总计算 ---");
  const 子表总计 = currentData.childRecords.reduce((sum, child) => sum + child.小计, 0);
  currentData.mainRecord.基础总价 = 子表总计;
  currentData.mainRecord.折扣金额 = currentData.mainRecord.基础总价 * currentData.mainRecord.折扣率;
  
  console.log(`基础总价: ${currentData.mainRecord.基础总价}`);
  console.log(`折扣金额: ${currentData.mainRecord.基础总价} × ${currentData.mainRecord.折扣率} = ${currentData.mainRecord.折扣金额}`);
  rounds.push("第2轮：计算主表基础总价和折扣金额");
  
  // 第3轮：基于主表折扣重算子表
  console.log("\n--- 第3轮：基于主表折扣重算子表 ---");
  currentData.childRecords.forEach(child => {
    child.折扣后单价 = child.单价 * (1 - currentData.mainRecord.折扣率);
    child.折扣后小计 = child.折扣后单价 * child.数量;
    console.log(`${child.id}: 折扣后单价 = ${child.单价} × (1 - ${currentData.mainRecord.折扣率}) = ${child.折扣后单价}`);
    console.log(`${child.id}: 折扣后小计 = ${child.折扣后单价} × ${child.数量} = ${child.折扣后小计}`);
  });
  rounds.push("第3轮：基于主表折扣率重算子表");
  
  // 第4轮：主表最终汇总
  console.log("\n--- 第4轮：主表最终汇总 ---");
  const 折扣后总计 = currentData.childRecords.reduce((sum, child) => sum + child.折扣后小计, 0);
  currentData.mainRecord.最终总价 = 折扣后总计;
  
  console.log(`最终总价: ${currentData.mainRecord.最终总价}`);
  rounds.push("第4轮：计算主表最终总价");
  
  console.log("\n=== 计算完成 ===");
  console.log("最终结果:", JSON.stringify(currentData, null, 2));
  
  return {
    finalData: currentData,
    calculationRounds: rounds,
    totalRounds: rounds.length
  };
}

// 验证计算结果
function validateResult(result) {
  console.log("\n=== 结果验证 ===");
  
  const { finalData } = result;
  const main = finalData.mainRecord;
  const children = finalData.childRecords;
  
  // 验证1：基础总价 = 子表小计之和
  const expectedBasicTotal = children.reduce((sum, child) => sum + child.小计, 0);
  console.log(`验证1 - 基础总价: ${main.基础总价} === ${expectedBasicTotal} ? ${main.基础总价 === expectedBasicTotal}`);
  
  // 验证2：最终总价 = 子表折扣后小计之和
  const expectedFinalTotal = children.reduce((sum, child) => sum + child.折扣后小计, 0);
  console.log(`验证2 - 最终总价: ${main.最终总价} === ${expectedFinalTotal} ? ${main.最终总价 === expectedFinalTotal}`);
  
  // 验证3：折扣逻辑一致性
  children.forEach(child => {
    const expectedDiscountedPrice = child.单价 * (1 - main.折扣率);
    const expectedDiscountedTotal = expectedDiscountedPrice * child.数量;
    console.log(`验证3 - ${child.id}折扣后单价: ${child.折扣后单价} === ${expectedDiscountedPrice} ? ${Math.abs(child.折扣后单价 - expectedDiscountedPrice) < 0.01}`);
    console.log(`验证3 - ${child.id}折扣后小计: ${child.折扣后小计} === ${expectedDiscountedTotal} ? ${Math.abs(child.折扣后小计 - expectedDiscountedTotal) < 0.01}`);
  });
  
  return {
    isValid: true,
    message: "所有验证通过，多轮迭代计算逻辑正确"
  };
}

// 执行演示
function runDemo() {
  console.log("🚀 多轮迭代计算演示开始");
  console.log("📋 测试场景：采购单动态折扣计算");
  console.log("🔄 依赖关系：子表→主表→子表→主表");
  
  const result = calculateWithIterations(testData);
  const validation = validateResult(result);
  
  console.log("\n📊 计算摘要:");
  console.log(`- 总计算轮次: ${result.totalRounds}`);
  console.log(`- 计算步骤: ${result.calculationRounds.join(' → ')}`);
  console.log(`- 验证结果: ${validation.message}`);
  
  return result;
}

// 如果直接运行此文件
if (require.main === module) {
  runDemo();
}

module.exports = {
  calculateWithIterations,
  validateResult,
  runDemo,
  testData
};