/**
 * 差异树生成函数测试示例
 */

const { generateDiffTree } = require('./index');

// 测试数据
const oldData = {
  name: "John Doe",
  age: 30,
  address: {
    street: "123 Main St",
    city: "New York",
    zipCode: "10001"
  },
  hobbies: ["reading", "swimming"],
  active: true
};

const newData = {
  name: "John Doe",
  age: 31,
  address: {
    street: "456 Oak Ave",
    city: "New York",
    zipCode: "10001",
    country: "USA"
  },
  hobbies: ["reading", "cycling", "photography"],
  active: true,
  email: "john@example.com"
};

// 测试配置
const ignoreFields = ["email"];
const options = {
  maxStringLength: 100,
  arrayOptimization: 'shallow',
  stringComparison: 'strict'
};

console.log('开始测试差异树生成函数...\n');

try {
  const result = generateDiffTree(oldData, newData, ignoreFields, options);
  
  if (result.success) {
    console.log('✅ 差异树生成成功!');
    console.log('\n📊 统计信息:');
   console.log(JSON.stringify(result.statistics, null, 2));  
    console.log(`- 总节点数: ${result.statistics.total}`);
    console.log(`- 未变更: ${result.statistics.unchanged}`);
    console.log(`- 已修改: ${result.statistics.modified}`);
    console.log(`- 新增: ${result.statistics.added}`);
    console.log(`- 删除: ${result.statistics.deleted}`);
    console.log(`- 忽略: ${result.statistics.ignored}`);
    
    console.log('\n🌳 差异树结构:');
    console.log(JSON.stringify(result.tree, null, 2));

    
    if (result.diagnostics.hasWarnings) {
      console.log('\n⚠️ 警告信息:');
      result.diagnostics.warnings.forEach(warning => {
        console.log(`- ${warning.message} (路径: ${warning.path})`);
      });
    }
  } else {
    console.log('❌ 差异树生成失败:');
    if (result.diagnostics && result.diagnostics.errors && result.diagnostics.errors.length > 0) {
      result.diagnostics.errors.forEach(error => {
        console.log(`- ${error.message} (路径: ${error.path})`);
      });
    } else {
      console.log('- 未知错误');
    }
  }
  
} catch (error) {
  console.log('❌ 测试过程中发生错误:');
  console.log(error.message);
  console.log(error.stack);
}

console.log('\n测试完成。');