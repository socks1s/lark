/**
 * 自动依赖解析演示程序
 * 通过输入公式配置，系统自动判断计算顺序
 */

// 测试数据
const testData = {
  mainRecord: { id: "PO001", 折扣率: 0.1 },
  childRecords: [
    { id: "item1", 单价: 100, 数量: 2 },
    { id: "item2", 单价: 200, 数量: 1 }
  ]
};

// 公式配置：定义字段计算规则
const formulaConfig = {
  // 子表公式
  "child.小计": "child.单价 * child.数量",
  "child.折扣后单价": "child.单价 * (1 - main.折扣率)",
  "child.折扣后小计": "child.折扣后单价 * child.数量",
  
  // 主表公式
  "main.基础总价": "SUM(child.小计)",
  "main.折扣金额": "main.基础总价 * main.折扣率", 
  "main.最终总价": "SUM(child.折扣后小计)"
};

// 解析公式依赖关系
function parseDependencies(formulas) {
  const dependencies = {};
  
  for (const [field, formula] of Object.entries(formulas)) {
    dependencies[field] = extractFieldReferences(formula);
  }
  
  return dependencies;
}

// 提取公式中的字段引用
function extractFieldReferences(formula) {
  const references = [];
  
  // 匹配 main.字段名 或 child.字段名
  const fieldPattern = /(main|child)\.([a-zA-Z\u4e00-\u9fa5_][a-zA-Z0-9\u4e00-\u9fa5_]*)/g;
  let match;
  
  while ((match = fieldPattern.exec(formula)) !== null) {
    const fullField = match[0]; // 如 "main.折扣率"
    if (!references.includes(fullField)) {
      references.push(fullField);
    }
  }
  
  // 处理聚合函数 SUM(child.字段)
  const sumPattern = /SUM\(child\.([a-zA-Z\u4e00-\u9fa5_][a-zA-Z0-9\u4e00-\u9fa5_]*)\)/g;
  while ((match = sumPattern.exec(formula)) !== null) {
    const field = `child.${match[1]}`;
    if (!references.includes(field)) {
      references.push(field);
    }
  }
  
  return references;
}

// 拓扑排序：确定计算顺序
function topologicalSort(dependencies, baseFields) {
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();
  
  function visit(field) {
    if (visiting.has(field)) {
      throw new Error(`检测到循环依赖: ${field}`);
    }
    if (visited.has(field)) return;
    
    // 如果是基础字段，跳过
    if (baseFields.includes(field)) return;
    
    visiting.add(field);
    
    // 先访问依赖字段
    const deps = dependencies[field] || [];
    for (const dep of deps) {
      visit(dep);
    }
    
    visiting.delete(field);
    visited.add(field);
    sorted.push(field);
  }
  
  // 访问所有需要计算的字段
  for (const field of Object.keys(dependencies)) {
    visit(field);
  }
  
  return sorted;
}

// 执行单个公式计算
function executeFormula(field, formula, data) {
  console.log(`计算 ${field}: ${formula}`);
  
  if (field.startsWith('child.')) {
    // 子表字段计算
    const fieldName = field.split('.')[1];
    data.childRecords.forEach(child => {
      const result = evaluateFormula(formula, data, child);
      child[fieldName] = result;
      console.log(`  ${child.id}.${fieldName} = ${result}`);
    });
  } else if (field.startsWith('main.')) {
    // 主表字段计算
    const fieldName = field.split('.')[1];
    const result = evaluateFormula(formula, data);
    data.mainRecord[fieldName] = result;
    console.log(`  main.${fieldName} = ${result}`);
  }
}

// 公式求值器（简化版）
function evaluateFormula(formula, data, currentChild = null) {
  let expression = formula;
  
  // 处理聚合函数 SUM(child.字段)
  expression = expression.replace(/SUM\(child\.([^)]+)\)/g, (match, fieldName) => {
    const sum = data.childRecords.reduce((total, child) => {
      return total + (child[fieldName] || 0);
    }, 0);
    return sum;
  });
  
  // 替换主表字段引用
  expression = expression.replace(/main\.([a-zA-Z\u4e00-\u9fa5_][a-zA-Z0-9\u4e00-\u9fa5_]*)/g, (match, fieldName) => {
    return data.mainRecord[fieldName] || 0;
  });
  
  // 替换子表字段引用
  if (currentChild) {
    expression = expression.replace(/child\.([a-zA-Z\u4e00-\u9fa5_][a-zA-Z0-9\u4e00-\u9fa5_]*)/g, (match, fieldName) => {
      return currentChild[fieldName] || 0;
    });
  }
  
  // 安全求值（简化版，实际应用中需要更严格的安全检查）
  try {
    return eval(expression);
  } catch (error) {
    console.error(`公式计算错误: ${formula} -> ${expression}`, error);
    return 0;
  }
}

// 自动计算引擎
function autoCalculate(data, formulas) {
  console.log("=== 自动依赖解析计算 ===");
  
  // 1. 解析依赖关系
  const dependencies = parseDependencies(formulas);
  console.log("依赖关系:", JSON.stringify(dependencies, null, 2));
  
  // 2. 识别基础字段（无需计算的字段）
  const baseFields = ['main.折扣率', 'child.单价', 'child.数量'];
  
  // 3. 拓扑排序确定计算顺序
  const calculationOrder = topologicalSort(dependencies, baseFields);
  console.log("计算顺序:", calculationOrder);
  
  // 4. 按顺序执行计算
  console.log("\n=== 开始按依赖顺序计算 ===");
  calculationOrder.forEach((field, index) => {
    console.log(`\n--- 步骤${index + 1}: ${field} ---`);
    executeFormula(field, formulas[field], data);
  });
  
  console.log("\n=== 计算完成 ===");
  console.log("最终结果:", JSON.stringify(data, null, 2));
  
  return {
    finalData: data,
    calculationOrder,
    dependencies
  };
}

// 验证结果
function validateAutoResult(result) {
  const { finalData } = result;
  const main = finalData.mainRecord;
  const children = finalData.childRecords;
  
  console.log("\n=== 自动计算结果验证 ===");
  
  // 验证基础总价
  const expectedBasicTotal = children.reduce((sum, child) => sum + child.小计, 0);
  console.log(`基础总价验证: ${main.基础总价} === ${expectedBasicTotal} ? ${main.基础总价 === expectedBasicTotal}`);
  
  // 验证最终总价
  const expectedFinalTotal = children.reduce((sum, child) => sum + child.折扣后小计, 0);
  console.log(`最终总价验证: ${main.最终总价} === ${expectedFinalTotal} ? ${main.最终总价 === expectedFinalTotal}`);
  
  return main.基础总价 === expectedBasicTotal && main.最终总价 === expectedFinalTotal;
}

// 演示函数
function runAutoDemo() {
  console.log("🤖 自动依赖解析演示开始");
  console.log("📝 公式配置:", JSON.stringify(formulaConfig, null, 2));
  
  // 深拷贝测试数据
  const data = JSON.parse(JSON.stringify(testData));
  
  // 执行自动计算
  const result = autoCalculate(data, formulaConfig);
  
  // 验证结果
  const isValid = validateAutoResult(result);
  
  console.log("\n📊 自动计算摘要:");
  console.log(`- 计算字段数: ${result.calculationOrder.length}`);
  console.log(`- 计算顺序: ${result.calculationOrder.join(' → ')}`);
  console.log(`- 验证结果: ${isValid ? '✅ 通过' : '❌ 失败'}`);
  
  return result;
}

// 如果直接运行此文件
if (require.main === module) {
  runAutoDemo();
}

module.exports = {
  autoCalculate,
  parseDependencies,
  topologicalSort,
  runAutoDemo,
  formulaConfig,
  testData
};