/**
 * 自定义公式函数模板
 * 提供标准的函数编写格式和最佳实践
 */

// 🎯 自定义公式函数标准格式
const customFormulaTemplate = {
  
  // ===== 子表字段公式模板 =====
  "child.字段名": {
    // 📋 必填：声明依赖字段（用于自动排序）
    dependencies: ["child.依赖字段1", "child.依赖字段2", "main.主表依赖字段"],
    
    // 🔧 必填：计算函数
    calculate: (data, child) => {
      // 获取当前子记录的字段值
      const 字段1 = child.依赖字段1;
      const 字段2 = child.依赖字段2;
      
      // 获取主表字段值
      const 主表字段 = data.mainRecord.主表依赖字段;
      
      // 复杂业务逻辑示例
      let result = 0;
      
      // 条件判断
      if (字段1 > 100) {
        result = 字段1 * 字段2 * 1.1; // 加价10%
      } else {
        result = 字段1 * 字段2;
      }
      
      // 基于主表字段的调整
      if (主表字段 === "VIP") {
        result *= 0.9; // VIP折扣
      }
      
      // 多重条件判断
      switch (child.类别) {
        case "A类":
          result *= 1.2;
          break;
        case "B类":
          result *= 1.1;
          break;
        default:
          result *= 1.0;
      }
      
      // 数值处理
      return Math.round(result * 100) / 100; // 保留2位小数
    }
  },

  // ===== 主表字段公式模板 =====
  "main.字段名": {
    // 📋 声明依赖（可以依赖子表字段）
    dependencies: ["child.子表字段", "main.其他主表字段"],
    
    // 🔧 计算函数（只接收data参数）
    calculate: (data) => {
      // 获取主表字段
      const 主表字段 = data.mainRecord.其他主表字段;
      
      // 聚合子表数据
      const 子表总和 = data.childRecords.reduce((sum, child) => {
        return sum + (child.子表字段 || 0);
      }, 0);
      
      // 复杂聚合逻辑
      const 加权平均 = data.childRecords.reduce((total, child, index, array) => {
        const 权重 = child.数量 / array.reduce((sum, c) => sum + c.数量, 0);
        return total + (child.子表字段 * 权重);
      }, 0);
      
      // 条件聚合
      const A类商品总价 = data.childRecords
        .filter(child => child.类别 === "A类")
        .reduce((sum, child) => sum + child.子表字段, 0);
      
      // 复杂业务规则
      let result = 子表总和;
      
      if (A类商品总价 > 1000) {
        result *= 0.95; // 大额A类商品折扣
      }
      
      if (data.childRecords.length > 5) {
        result *= 0.98; // 多品种折扣
      }
      
      // 最值限制
      const 最小值 = 子表总和 * 0.8;
      const 最大值 = 子表总和 * 1.2;
      result = Math.max(最小值, Math.min(result, 最大值));
      
      return Math.round(result);
    }
  }
};

// 🔧 高级公式函数示例
const advancedFormulaExamples = {
  
  // 动态折扣率计算
  "main.动态折扣率": {
    dependencies: ["main.基础总价", "main.客户等级", "main.历史采购额"],
    calculate: (data) => {
      const { 基础总价, 客户等级, 历史采购额 } = data.mainRecord;
      
      // 基础折扣
      const 等级折扣 = {
        "钻石": 0.15,
        "金牌": 0.10,
        "银牌": 0.05,
        "普通": 0.00
      }[客户等级] || 0;
      
      // 金额阶梯折扣
      let 金额折扣 = 0;
      if (基础总价 > 5000) 金额折扣 = 0.08;
      else if (基础总价 > 2000) 金额折扣 = 0.05;
      else if (基础总价 > 1000) 金额折扣 = 0.02;
      
      // 历史采购奖励
      const 历史奖励 = 历史采购额 > 50000 ? 0.03 : 
                     历史采购额 > 20000 ? 0.02 : 
                     历史采购额 > 10000 ? 0.01 : 0;
      
      // 组合折扣（有上限）
      return Math.min(等级折扣 + 金额折扣 + 历史奖励, 0.25);
    }
  },

  // 库存预警系数
  "child.库存预警系数": {
    dependencies: ["child.库存", "child.数量", "child.安全库存"],
    calculate: (data, child) => {
      const { 库存, 数量, 安全库存 } = child;
      const 剩余库存 = 库存 - 数量;
      
      if (剩余库存 < 0) {
        return 3.0; // 缺货风险
      } else if (剩余库存 < 安全库存) {
        return 2.0; // 低库存风险
      } else if (剩余库存 < 安全库存 * 2) {
        return 1.5; // 中等风险
      } else {
        return 1.0; // 安全库存
      }
    }
  },

  // 季节性价格调整
  "child.季节调整价格": {
    dependencies: ["child.基础价格", "child.商品类别"],
    calculate: (data, child) => {
      const { 基础价格, 商品类别 } = child;
      const 当前月份 = new Date().getMonth() + 1;
      
      // 季节性系数配置
      const 季节系数表 = {
        "服装": {
          春季: [3, 4, 5],
          夏季: [6, 7, 8], 
          秋季: [9, 10, 11],
          冬季: [12, 1, 2]
        },
        "电子产品": {
          促销季: [6, 11, 12], // 618、双11、双12
          平季: [1, 2, 3, 4, 5, 7, 8, 9, 10]
        }
      };
      
      let 调整系数 = 1.0;
      
      if (商品类别 === "服装") {
        if ([6, 7, 8].includes(当前月份)) {
          调整系数 = 0.8; // 夏季服装打折
        } else if ([12, 1, 2].includes(当前月份)) {
          调整系数 = 1.2; // 冬季服装涨价
        }
      } else if (商品类别 === "电子产品") {
        if ([6, 11, 12].includes(当前月份)) {
          调整系数 = 0.9; // 促销季折扣
        }
      }
      
      return Math.round(基础价格 * 调整系数 * 100) / 100;
    }
  }
};

// 📚 编写自定义公式的最佳实践
const bestPractices = {
  "依赖声明": {
    "原则": "准确声明所有依赖字段，确保计算顺序正确",
    "示例": `dependencies: ["child.单价", "child.数量", "main.折扣率"]`,
    "注意": "不要遗漏依赖，否则可能导致计算错误"
  },
  
  "错误处理": {
    "原则": "对可能的空值、undefined进行防护",
    "示例": `const 数量 = child.数量 || 0; // 默认值处理`,
    "建议": "使用 || 0 或 ?? 0 提供默认值"
  },
  
  "数值精度": {
    "原则": "金额计算要注意精度问题",
    "示例": `return Math.round(result * 100) / 100; // 保留2位小数`,
    "建议": "统一使用相同的精度处理方式"
  },
  
  "性能优化": {
    "原则": "避免在循环中进行重复计算",
    "示例": `const 总数量 = data.childRecords.reduce((sum, c) => sum + c.数量, 0); // 提前计算`,
    "建议": "将公共计算提取到循环外"
  },
  
  "可读性": {
    "原则": "使用有意义的变量名，添加必要注释",
    "示例": `const VIP折扣率 = 0.1; // 金牌客户10%折扣`,
    "建议": "复杂逻辑要有清晰的注释说明"
  }
};

// 🧪 测试自定义公式的工具函数
function testCustomFormula(fieldName, config, testData) {
  console.log(`\n🧪 测试公式: ${fieldName}`);
  console.log(`依赖: [${config.dependencies.join(', ')}]`);
  
  try {
    if (fieldName.startsWith('child.')) {
      testData.childRecords.forEach(child => {
        const result = config.calculate(testData, child);
        console.log(`  ${child.id}: ${result}`);
      });
    } else {
      const result = config.calculate(testData);
      console.log(`  结果: ${result}`);
    }
    console.log(`✅ 测试通过`);
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }
}

console.log("📖 自定义公式函数编写指南");
console.log("🎯 支持复杂逻辑、条件判断、聚合计算");
console.log("🔄 保持自动依赖解析和排序功能");
console.log("\n📚 最佳实践:");
console.log(JSON.stringify(bestPractices, null, 2));

module.exports = {
  customFormulaTemplate,
  advancedFormulaExamples,
  bestPractices,
  testCustomFormula
};