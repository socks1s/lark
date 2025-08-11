/**
 * 带缓存机制的虚拟字段演示程序
 * 解决虚拟字段计算时序问题
 */

// 测试数据
const testData = {
  mainRecord: { 
    id: "PO001", 
    折扣率: 0.1, 
    VIP等级: "金牌",
    采购金额阈值: 1000
  },
  childRecords: [
    { id: "item1", 单价: 100, 数量: 2, 类别: "电子产品", 库存: 50 },
    { id: "item2", 单价: 200, 数量: 1, 类别: "服装", 库存: 10 },
    { id: "item3", 单价: 150, 数量: 3, 类别: "电子产品", 库存: 5 }
  ]
};

// 带缓存的虚拟字段公式配置
const cachedVirtualFormulas = {
  
  // 示例1：使用缓存的虚拟字段
  "child.库存风险系数": {
    dependencies: ["child.库存", "child.数量"],
    calculate: (data, child) => {
      // 🔄 使用缓存机制获取虚拟字段
      const cache = getVirtualFieldCache(data);
      
      // 获取或计算数量总和
      const 数量总和 = getOrComputeVirtualField(cache, '数量总和', () => {
        return data.childRecords.reduce((sum, c) => sum + c.数量, 0);
      });
      
      // 获取或计算类别统计
      const 类别统计 = getOrComputeVirtualField(cache, '类别统计', () => {
        const stats = {};
        data.childRecords.forEach(c => {
          if (!stats[c.类别]) stats[c.类别] = 0;
          stats[c.类别] += c.数量;
        });
        return stats;
      });
      
      // 使用缓存的虚拟字段进行计算
      const 数量占比 = child.数量 / 数量总和;
      const 同类商品数量 = 类别统计[child.类别] || 0;
      const 同类商品占比 = 同类商品数量 / 数量总和;
      const 库存比率 = child.库存 / child.数量;
      
      console.log(`    ${child.id}: 数量占比=${(数量占比*100).toFixed(1)}%, 同类商品占比=${(同类商品占比*100).toFixed(1)}%`);
      
      // 基于库存比率和数量占比的风险评估
      let 风险系数 = 1.0;
      
      if (库存比率 < 2) {
        风险系数 = 1.5; // 高风险
      } else if (库存比率 < 5) {
        风险系数 = 1.2; // 中风险
      }
      
      // 如果该商品数量占比很大，增加风险系数
      if (数量占比 > 0.4) {
        风险系数 *= 1.1; // 大宗商品风险加成
      }
      
      // 如果该类别商品占比很大，调整风险系数
      if (同类商品占比 > 0.6) {
        风险系数 *= 1.05; // 类别集中风险
      }
      
      return Math.round(风险系数 * 100) / 100;
    }
  },

  // 示例2：多个公式共享相同的虚拟字段计算
  "child.价格偏差系数": {
    dependencies: ["child.单价"],
    calculate: (data, child) => {
      // 🔄 使用缓存机制获取虚拟字段
      const cache = getVirtualFieldCache(data);
      
      // 获取或计算价格统计信息
      const 价格统计 = getOrComputeVirtualField(cache, '价格统计', () => {
        const 单价列表 = data.childRecords.map(c => c.单价);
        const 平均单价 = 单价列表.reduce((sum, price) => sum + price, 0) / 单价列表.length;
        const 单价方差 = 单价列表.reduce((sum, price) => sum + Math.pow(price - 平均单价, 2), 0) / 单价列表.length;
        const 单价标准差 = Math.sqrt(单价方差);
        const 最高价 = Math.max(...单价列表);
        const 最低价 = Math.min(...单价列表);
        
        return { 平均单价, 单价标准差, 最高价, 最低价 };
      });
      
      // 使用缓存的虚拟字段
      const { 平均单价, 单价标准差, 最高价 } = 价格统计;
      
      console.log(`    ${child.id}: 单价=${child.单价}, 平均=${平均单价.toFixed(2)}, 标准差=${单价标准差.toFixed(2)}`);
      
      // 基于价格偏差的系数计算
      const 价格偏差 = Math.abs(child.单价 - 平均单价);
      const 偏差比例 = 单价标准差 > 0 ? 价格偏差 / 单价标准差 : 0;
      const 价格比例 = child.单价 / 最高价;
      
      if (偏差比例 > 1.5) {
        return 1.3; // 价格异常高的商品
      } else if (偏差比例 > 0.8) {
        return 1.1; // 价格偏高的商品
      } else {
        return 1.0; // 价格正常的商品
      }
    }
  },

  // 示例3：主表公式使用缓存的虚拟字段
  "main.智能折扣率": {
    dependencies: ["main.VIP等级"],
    calculate: (data) => {
      // 🔄 使用缓存机制获取虚拟字段
      const cache = getVirtualFieldCache(data);
      
      // 获取或计算多个虚拟字段
      const 商品统计 = getOrComputeVirtualField(cache, '商品统计', () => {
        const 商品总数 = data.childRecords.length;
        const 数量总和 = data.childRecords.reduce((sum, c) => sum + c.数量, 0);
        const 平均数量 = 数量总和 / 商品总数;
        
        // 类别统计
        const 类别计数 = {};
        const 类别数量 = {};
        data.childRecords.forEach(c => {
          if (!类别计数[c.类别]) 类别计数[c.类别] = 0;
          if (!类别数量[c.类别]) 类别数量[c.类别] = 0;
          类别计数[c.类别]++;
          类别数量[c.类别] += c.数量;
        });
        
        // 价格统计
        const 高价商品数 = data.childRecords.filter(c => c.单价 > 150).length;
        const 高价商品占比 = 高价商品数 / 商品总数;
        
        return { 
          商品总数, 
          数量总和, 
          平均数量, 
          类别计数, 
          类别数量,
          高价商品占比
        };
      });
      
      // 使用缓存的虚拟字段
      const { 商品总数, 数量总和, 平均数量, 类别计数, 类别数量, 高价商品占比 } = 商品统计;
      
      // 计算电子产品占比
      const 电子产品数量 = 类别数量["电子产品"] || 0;
      const 电子产品占比 = 电子产品数量 / 数量总和;
      
      console.log(`    虚拟字段统计:`);
      console.log(`      商品总数: ${商品总数}`);
      console.log(`      数量总和: ${数量总和}`);
      console.log(`      平均数量: ${平均数量.toFixed(2)}`);
      console.log(`      电子产品占比: ${(电子产品占比 * 100).toFixed(1)}%`);
      console.log(`      高价商品占比: ${(高价商品占比 * 100).toFixed(1)}%`);
      
      // 基于VIP等级的基础折扣
      const VIP等级 = data.mainRecord.VIP等级;
      let 基础折扣 = 0;
      switch (VIP等级) {
        case "钻石": 基础折扣 = 0.15; break;
        case "金牌": 基础折扣 = 0.10; break;
        case "银牌": 基础折扣 = 0.05; break;
        default: 基础折扣 = 0;
      }
      
      // 基于虚拟字段的动态调整
      let 动态调整 = 0;
      
      // 商品种类奖励
      if (商品总数 >= 3) {
        动态调整 += 0.02;
      }
      
      // 大批量奖励
      if (平均数量 > 2) {
        动态调整 += 0.01;
      }
      
      // 电子产品专项折扣
      if (电子产品占比 > 0.5) {
        动态调整 += 0.03;
      }
      
      // 高价商品折扣
      if (高价商品占比 > 0.3) {
        动态调整 += 0.02;
      }
      
      const 最终折扣率 = Math.min(基础折扣 + 动态调整, 0.25); // 最大25%
      
      console.log(`    折扣计算: 基础${(基础折扣*100).toFixed(1)}% + 动态${(动态调整*100).toFixed(1)}% = ${(最终折扣率*100).toFixed(1)}%`);
      
      return 最终折扣率;
    }
  },

  // 示例4：使用多个缓存的虚拟字段
  "child.综合评分": {
    dependencies: ["child.单价", "child.数量", "child.库存"],
    calculate: (data, child) => {
      // 🔄 使用缓存机制获取虚拟字段
      const cache = getVirtualFieldCache(data);
      
      // 复用已计算的价格统计
      const 价格统计 = getOrComputeVirtualField(cache, '价格统计', () => {
        const 单价列表 = data.childRecords.map(c => c.单价);
        const 平均单价 = 单价列表.reduce((sum, price) => sum + price, 0) / 单价列表.length;
        const 单价方差 = 单价列表.reduce((sum, price) => sum + Math.pow(price - 平均单价, 2), 0) / 单价列表.length;
        const 单价标准差 = Math.sqrt(单价方差);
        const 最高价 = Math.max(...单价列表);
        const 最低价 = Math.min(...单价列表);
        
        return { 平均单价, 单价标准差, 最高价, 最低价 };
      });
      
      // 复用已计算的商品统计
      const 商品统计 = getOrComputeVirtualField(cache, '商品统计', () => {
        const 商品总数 = data.childRecords.length;
        const 数量总和 = data.childRecords.reduce((sum, c) => sum + c.数量, 0);
        const 平均数量 = 数量总和 / 商品总数;
        
        // 类别统计
        const 类别计数 = {};
        const 类别数量 = {};
        data.childRecords.forEach(c => {
          if (!类别计数[c.类别]) 类别计数[c.类别] = 0;
          if (!类别数量[c.类别]) 类别数量[c.类别] = 0;
          类别计数[c.类别]++;
          类别数量[c.类别] += c.数量;
        });
        
        // 价格统计
        const 高价商品数 = data.childRecords.filter(c => c.单价 > 150).length;
        const 高价商品占比 = 高价商品数 / 商品总数;
        
        return { 
          商品总数, 
          数量总和, 
          平均数量, 
          类别计数, 
          类别数量,
          高价商品占比
        };
      });
      
      // 获取库存统计
      const 库存统计 = getOrComputeVirtualField(cache, '库存统计', () => {
        return {
          总库存: data.childRecords.reduce((sum, c) => sum + c.库存, 0),
          平均库存: data.childRecords.reduce((sum, c) => sum + c.库存, 0) / data.childRecords.length,
          低库存商品数: data.childRecords.filter(c => c.库存 < 20).length
        };
      });
      
      // 使用缓存的虚拟字段
      const { 最高价 } = 价格统计;
      const { 数量总和 } = 商品统计;
      const { 平均库存 } = 库存统计;
      
      console.log(`    ${child.id} 虚拟字段统计:`);
      console.log(`      价格排名: ${child.单价}/${最高价} (${((child.单价/最高价)*100).toFixed(1)}%)`);
      console.log(`      数量占比: ${child.数量}/${数量总和} (${((child.数量/数量总和)*100).toFixed(1)}%)`);
      console.log(`      库存状况: ${child.库存} (平均${平均库存.toFixed(1)})`);
      
      // 综合评分计算
      let 评分 = 0;
      
      // 价格评分 (0-30分)
      const 价格评分 = (child.单价 / 最高价) * 30;
      评分 += 价格评分;
      
      // 数量评分 (0-40分)
      const 数量评分 = (child.数量 / Math.max(...data.childRecords.map(c => c.数量))) * 40;
      评分 += 数量评分;
      
      // 库存评分 (0-30分)
      const 库存比率 = child.库存 / child.数量;
      let 库存评分 = 0;
      if (库存比率 >= 10) 库存评分 = 30;
      else if (库存比率 >= 5) 库存评分 = 25;
      else if (库存比率 >= 2) 库存评分 = 15;
      else 库存评分 = 5;
      评分 += 库存评分;
      
      console.log(`    评分明细: 价格${价格评分.toFixed(1)} + 数量${数量评分.toFixed(1)} + 库存${库存评分} = ${评分.toFixed(1)}`);
      
      return Math.round(评分);
    }
  }
};

// 虚拟字段缓存工具函数
function getVirtualFieldCache(data) {
  // 初始化缓存对象（如果不存在）
  if (!data._virtualCache) {
    data._virtualCache = {
      _computeCount: 0,
      _hitCount: 0
    };
  }
  return data._virtualCache;
}

function getOrComputeVirtualField(cache, fieldName, computeFunc) {
  // 如果缓存中已有该字段，直接返回
  if (cache[fieldName] !== undefined) {
    cache._hitCount++;
    return cache[fieldName];
  }
  
  // 否则计算并缓存结果
  console.log(`    💡 计算虚拟字段: ${fieldName}`);
  const result = computeFunc();
  cache[fieldName] = result;
  cache._computeCount++;
  
  return result;
}

// 虚拟字段计算引擎（复用原有逻辑）
function parseVirtualDependencies(virtualFormulas) {
  const dependencies = {};
  
  for (const [field, config] of Object.entries(virtualFormulas)) {
    dependencies[field] = config.dependencies || [];
  }
  
  return dependencies;
}

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

function executeVirtualFormula(field, config, data) {
  console.log(`\n计算 ${field}:`);
  console.log(`  声明依赖: [${config.dependencies.join(', ')}]`);
  
  if (field.startsWith('child.')) {
    const fieldName = field.split('.')[1];
    data.childRecords.forEach(child => {
      const result = config.calculate(data, child);
      child[fieldName] = result;
      console.log(`  ${child.id}.${fieldName} = ${result}`);
    });
  } else if (field.startsWith('main.')) {
    const fieldName = field.split('.')[1];
    const result = config.calculate(data);
    data.mainRecord[fieldName] = result;
    console.log(`  main.${fieldName} = ${result}`);
  }
}

// 带缓存的虚拟字段自动计算引擎
function cachedVirtualFieldAutoCalculate(data, virtualFormulas) {
  console.log("=== 带缓存的虚拟字段自动计算 ===");
  console.log("🎯 支持在公式中引用不存在的聚合字段");
  console.log("💡 无需定义额外列，动态计算虚拟值");
  console.log("🔄 使用缓存机制避免重复计算");
  
  // 1. 解析依赖关系
  const dependencies = parseVirtualDependencies(virtualFormulas);
  console.log("\n依赖关系:", JSON.stringify(dependencies, null, 2));
  
  // 2. 识别基础字段
  const baseFields = [
    'main.折扣率', 'main.VIP等级', 'main.采购金额阈值',
    'child.单价', 'child.数量', 'child.类别', 'child.库存'
  ];
  
  // 3. 拓扑排序确定计算顺序
  const calculationOrder = topologicalSort(dependencies, baseFields);
  console.log("\n计算顺序:", calculationOrder);
  
  // 4. 按顺序执行虚拟字段计算
  console.log("\n=== 开始虚拟字段计算 ===");
  calculationOrder.forEach((field, index) => {
    console.log(`\n--- 步骤${index + 1}: ${field} ---`);
    executeVirtualFormula(field, virtualFormulas[field], data);
  });
  
  // 5. 输出缓存统计
  const cache = getVirtualFieldCache(data);
  console.log("\n=== 虚拟字段缓存统计 ===");
  console.log(`  计算次数: ${cache._computeCount}`);
  console.log(`  命中次数: ${cache._hitCount}`);
  console.log(`  缓存字段: ${Object.keys(cache).filter(k => !k.startsWith('_')).join(', ')}`);
  
  console.log("\n=== 虚拟字段计算完成 ===");
  console.log("最终结果:", JSON.stringify(data, null, 2));
  
  return {
    finalData: data,
    calculationOrder,
    dependencies,
    cacheStats: {
      computeCount: cache._computeCount,
      hitCount: cache._hitCount,
      fields: Object.keys(cache).filter(k => !k.startsWith('_'))
    }
  };
}

// 验证带缓存的虚拟字段计算结果
function validateCachedVirtualResult(result) {
  const { finalData, cacheStats } = result;
  const main = finalData.mainRecord;
  const children = finalData.childRecords;
  
  console.log("\n=== 带缓存的虚拟字段计算结果验证 ===");
  
  // 验证缓存效果
  console.log(`缓存效率: 计算${cacheStats.computeCount}次，命中${cacheStats.hitCount}次`);
  console.log(`缓存字段: ${cacheStats.fields.join(', ')}`);
  
  // 验证计算结果
  console.log(`\n计算结果验证:`);
  children.forEach(child => {
    console.log(`${child.id}: 库存风险系数=${child.库存风险系数}, 价格偏差系数=${child.价格偏差系数}, 综合评分=${child.综合评分}`);
  });
  console.log(`智能折扣率: ${(main.智能折扣率 * 100).toFixed(1)}%`);
  
  return true;
}

// 演示函数
function runCachedVirtualFieldDemo() {
  console.log("🎨 带缓存的虚拟字段演示开始");
  console.log("📝 解决虚拟字段计算时序问题");
  console.log("🔄 避免重复计算相同的虚拟字段");
  console.log("💡 确保虚拟字段计算一致性");
  
  // 深拷贝测试数据
  const data = JSON.parse(JSON.stringify(testData));
  
  // 执行带缓存的虚拟字段自动计算
  const result = cachedVirtualFieldAutoCalculate(data, cachedVirtualFormulas);
  
  // 验证结果
  const isValid = validateCachedVirtualResult(result);
  
  console.log("\n📊 带缓存的虚拟字段计算摘要:");
  console.log(`- 虚拟字段公式数: ${result.calculationOrder.length}`);
  console.log(`- 计算顺序: ${result.calculationOrder.join(' → ')}`);
  console.log(`- 缓存效率: 计算${result.cacheStats.computeCount}次，命中${result.cacheStats.hitCount}次`);
  console.log(`- 验证结果: ${isValid ? '✅ 通过' : '❌ 失败'}`);
  console.log(`- 核心优势: 🎯 动态计算聚合值 + 🔄 缓存避免重复计算`);
  
  return result;
}

// 如果直接运行此文件
if (require.main === module) {
  runCachedVirtualFieldDemo();
}

module.exports = {
  cachedVirtualFieldAutoCalculate,
  getVirtualFieldCache,
  getOrComputeVirtualField,
  runCachedVirtualFieldDemo,
  cachedVirtualFormulas,
  testData
};