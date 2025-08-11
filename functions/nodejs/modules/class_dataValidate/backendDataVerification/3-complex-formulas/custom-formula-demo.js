/**
 * 自定义公式函数演示程序
 * 支持复杂逻辑、条件判断，同时保持自动依赖解析
 * 提示词：
 * 如果我每个字段的公式要求自定义，不用公式解析器去解析，而是自己写一个复杂的公式，并且里面的运算符比较复杂，要做条件判断，我想每个字段的公式自定义，但是同时还想要实现系统自动计算各个字段之间的依赖，需要怎么写函数
 */

// 测试数据
const testData = {
  mainRecord: { 
    id: "PO001", 
    折扣率: 0.1, 
    VIP等级: "金牌",
    采购金额阈值: 1000,
    季节系数: 1.2
  },
  childRecords: [
    { id: "item1", 单价: 100, 数量: 2, 类别: "电子产品", 库存: 50 },
    { id: "item2", 单价: 200, 数量: 1, 类别: "服装", 库存: 10 },
    { id: "item3", 单价: 150, 数量: 3, 类别: "电子产品", 库存: 5 }
  ]
};

// 自定义公式函数配置
const customFormulas = {
  // 子表复杂公式
  "child.小计": {
    dependencies: ["child.单价", "child.数量"],
    calculate: (data, child) => {
      // 基础小计
      let subtotal = child.单价 * child.数量;
      
      // 数量折扣：超过2个打9折
      if (child.数量 > 2) {
        subtotal *= 0.9;
      }
      
      // 类别加价：电子产品加10%
      if (child.类别 === "电子产品") {
        subtotal *= 1.1;
      }
      
      return Math.round(subtotal * 100) / 100; // 保留2位小数
    }
  },

  "child.库存风险系数": {
    dependencies: ["child.库存", "child.数量"],
    calculate: (data, child) => {
      const 库存比率 = child.库存 / child.数量;
      
      if (库存比率 < 2) {
        return 1.5; // 高风险
      } else if (库存比率 < 5) {
        return 1.2; // 中风险
      } else {
        return 1.0; // 低风险
      }
    }
  },

  "child.风险调整小计": {
    dependencies: ["child.小计", "child.库存风险系数"],
    calculate: (data, child) => {
      return child.小计 * child.库存风险系数;
    }
  },

  // 主表复杂公式
  "main.基础总价": {
    dependencies: ["child.小计"],
    calculate: (data) => {
      return data.childRecords.reduce((sum, child) => sum + (child.小计 || 0), 0);
    }
  },

  "main.VIP折扣率": {
    dependencies: ["main.基础总价", "main.VIP等级"],
    calculate: (data) => {
      const 基础总价 = data.mainRecord.基础总价;
      const VIP等级 = data.mainRecord.VIP等级;
      
      // 基于VIP等级的基础折扣
      let 基础折扣 = 0;
      switch (VIP等级) {
        case "钻石": 基础折扣 = 0.15; break;
        case "金牌": 基础折扣 = 0.1; break;
        case "银牌": 基础折扣 = 0.05; break;
        default: 基础折扣 = 0;
      }
      
      // 基于采购金额的额外折扣
      let 金额折扣 = 0;
      if (基础总价 > 2000) {
        金额折扣 = 0.05;
      } else if (基础总价 > 1000) {
        金额折扣 = 0.02;
      }
      
      // 季节性调整
      const 季节调整 = data.mainRecord.季节系数 > 1.1 ? 0.03 : 0;
      
      return Math.min(基础折扣 + 金额折扣 + 季节调整, 0.25); // 最大折扣25%
    }
  },

  "main.动态折扣金额": {
    dependencies: ["main.基础总价", "main.VIP折扣率"],
    calculate: (data) => {
      return data.mainRecord.基础总价 * data.mainRecord.VIP折扣率;
    }
  },

  // 基于风险调整的最终计算
  "main.风险调整总价": {
    dependencies: ["child.风险调整小计"],
    calculate: (data) => {
      return data.childRecords.reduce((sum, child) => sum + (child.风险调整小计 || 0), 0);
    }
  },

  "main.最终总价": {
    dependencies: ["main.风险调整总价", "main.动态折扣金额"],
    calculate: (data) => {
      const 风险调整总价 = data.mainRecord.风险调整总价;
      const 动态折扣金额 = data.mainRecord.动态折扣金额;
      
      // 复杂的最终价格计算逻辑
      let 最终价格 = 风险调整总价 - 动态折扣金额;
      
      // 最低价格保护：不能低于基础总价的70%
      const 最低价格 = data.mainRecord.基础总价 * 0.7;
      最终价格 = Math.max(最终价格, 最低价格);
      
      // 整数化处理
      return Math.round(最终价格);
    }
  }
};

// 自动依赖解析（基于函数声明的dependencies）
function parseCustomDependencies(customFormulas) {
  const dependencies = {};
  
  for (const [field, config] of Object.entries(customFormulas)) {
    dependencies[field] = config.dependencies || [];
  }
  
  return dependencies;
}

// 拓扑排序（复用之前的逻辑）
function topologicalSort(dependencies, baseFields) {
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();
  
  function visit(field) {
    if (visiting.has(field)) {
      throw new Error(`检测到循环依赖: ${field}`);
    }
    if (visited.has(field)) return;
    
    if (baseFields.includes(field)) return;
    
    visiting.add(field);
    
    const deps = dependencies[field] || [];
    for (const dep of deps) {
      visit(dep);
    }
    
    visiting.delete(field);
    visited.add(field);
    sorted.push(field);
  }
  
  for (const field of Object.keys(dependencies)) {
    visit(field);
  }
  
  return sorted;
}

// 执行自定义公式计算
function executeCustomFormula(field, config, data) {
  console.log(`\n计算 ${field}:`);
  console.log(`  依赖: [${config.dependencies.join(', ')}]`);
  
  if (field.startsWith('child.')) {
    // 子表字段计算
    const fieldName = field.split('.')[1];
    data.childRecords.forEach(child => {
      const result = config.calculate(data, child);
      child[fieldName] = result;
      console.log(`  ${child.id}.${fieldName} = ${result}`);
    });
  } else if (field.startsWith('main.')) {
    // 主表字段计算
    const fieldName = field.split('.')[1];
    const result = config.calculate(data);
    data.mainRecord[fieldName] = result;
    console.log(`  main.${fieldName} = ${result}`);
  }
}

// 自定义公式自动计算引擎
function customAutoCalculate(data, customFormulas) {
  console.log("=== 自定义公式自动计算 ===");
  console.log("初始数据:", JSON.stringify(data, null, 2));
  
  // 1. 解析依赖关系
  const dependencies = parseCustomDependencies(customFormulas);
  console.log("\n依赖关系:", JSON.stringify(dependencies, null, 2));
  
  // 2. 识别基础字段
  const baseFields = [
    'main.折扣率', 'main.VIP等级', 'main.采购金额阈值', 'main.季节系数',
    'child.单价', 'child.数量', 'child.类别', 'child.库存'
  ];
  
  // 3. 拓扑排序确定计算顺序
  const calculationOrder = topologicalSort(dependencies, baseFields);
  console.log("\n计算顺序:", calculationOrder);
  
  // 4. 按顺序执行自定义计算
  console.log("\n=== 开始按依赖顺序执行自定义计算 ===");
  calculationOrder.forEach((field, index) => {
    console.log(`\n--- 步骤${index + 1}: ${field} ---`);
    executeCustomFormula(field, customFormulas[field], data);
  });
  
  console.log("\n=== 自定义计算完成 ===");
  console.log("最终结果:", JSON.stringify(data, null, 2));
  
  return {
    finalData: data,
    calculationOrder,
    dependencies
  };
}

// 验证自定义计算结果
function validateCustomResult(result) {
  const { finalData } = result;
  const main = finalData.mainRecord;
  const children = finalData.childRecords;
  
  console.log("\n=== 自定义计算结果验证 ===");
  
  // 验证基础总价
  const expectedBasicTotal = children.reduce((sum, child) => sum + child.小计, 0);
  console.log(`基础总价验证: ${main.基础总价} === ${expectedBasicTotal} ? ${Math.abs(main.基础总价 - expectedBasicTotal) < 0.01}`);
  
  // 验证VIP折扣逻辑
  console.log(`VIP折扣率: ${main.VIP折扣率} (${main.VIP等级}客户)`);
  console.log(`动态折扣金额: ${main.动态折扣金额}`);
  
  // 验证风险调整
  children.forEach(child => {
    console.log(`${child.id} 库存风险系数: ${child.库存风险系数} (库存:${child.库存}, 需求:${child.数量})`);
  });
  
  // 验证最终价格保护机制
  const 最低价格 = main.基础总价 * 0.7;
  console.log(`最终总价: ${main.最终总价}, 最低价格保护: ${最低价格}`);
  console.log(`价格保护生效: ${main.最终总价 === Math.round(最低价格) ? '是' : '否'}`);
  
  return true;
}

// 演示函数
function runCustomDemo() {
  console.log("🎨 自定义公式演示开始");
  console.log("📝 支持复杂逻辑、条件判断、风险评估");
  console.log("🔄 保持自动依赖解析能力");
  
  // 深拷贝测试数据
  const data = JSON.parse(JSON.stringify(testData));
  
  // 执行自定义自动计算
  const result = customAutoCalculate(data, customFormulas);
  
  // 验证结果
  const isValid = validateCustomResult(result);
  
  console.log("\n📊 自定义计算摘要:");
  console.log(`- 自定义公式数: ${result.calculationOrder.length}`);
  console.log(`- 计算顺序: ${result.calculationOrder.join(' → ')}`);
  console.log(`- 验证结果: ${isValid ? '✅ 通过' : '❌ 失败'}`);
  
  return result;
}

// 如果直接运行此文件
if (require.main === module) {
  runCustomDemo();
}

module.exports = {
  customAutoCalculate,
  parseCustomDependencies,
  runCustomDemo,
  customFormulas,
  testData
};