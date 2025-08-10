/**
 * 差异树生成函数演示
 * 展示模块化差异树生成系统的完整功能
 */

const { generateDiffTree } = require('./index');

// 演示数据
const oldData = {
  user: {
    name: "张三",
    age: 25,
    skills: ["JavaScript", "Python"],
    active: true
  },
  settings: {
    theme: "dark",
    notifications: true
  }
};

const newData = {
  user: {
    name: "张三",
    age: 26,
    skills: ["JavaScript", "Python", "React"],
    active: true,
    email: "zhangsan@example.com"
  },
  settings: {
    theme: "light",
    notifications: true,
    language: "zh-CN"
  }
};

console.log('🚀 差异树生成演示\n');

// 基础演示
console.log('=== 基础差异检测 ===');
const result1 = generateDiffTree(oldData, newData);
if (result1.success) {
  console.log('✅ 生成成功');
  console.log('result1：');
  console.log(result1);
  console.log(`📊 统计: 总计${result1.statistics.total}个节点 (未变更:${result1.statistics.unchanged}, 修改:${result1.statistics.modified}, 新增:${result1.statistics.added}, 删除:${result1.statistics.deleted}, 忽略:${result1.statistics.ignored})`);
} else {
  console.log('❌ 生成失败');
}

// 带忽略字段的演示
console.log('\n=== 忽略字段演示 ===');
const result2 = generateDiffTree(oldData, newData, ['user.email', 'settings.language']);
if (result2.success) {
  console.log('✅ 生成成功（已忽略指定字段）');
  console.log('result2：');
  console.log(result2);
  console.log(`📊 统计: 总计${result2.statistics.total}个节点 (未变更:${result2.statistics.unchanged}, 修改:${result2.statistics.modified}, 新增:${result2.statistics.added}, 删除:${result2.statistics.deleted}, 忽略:${result2.statistics.ignored})`);
}

// 配置选项演示
console.log('\n=== 配置选项演示 ===');
const options = {
  maxStringLength: 50,
  arrayOptimization: 'deep',
  stringComparison: 'strict'
};
const result3 = generateDiffTree(oldData, newData, [], options);
if (result3.success) {
  console.log('✅ 生成成功（使用自定义配置）');
  console.log('result3：');
  console.log(result3);
  console.log(`📊 统计: 总计${result3.statistics.total}个节点 (未变更:${result3.statistics.unchanged}, 修改:${result3.statistics.modified}, 新增:${result3.statistics.added}, 删除:${result3.statistics.deleted}, 忽略:${result3.statistics.ignored})`);
  console.log(`🔧 配置: 字符串长度限制=${options.maxStringLength}, 数组优化=${options.arrayOptimization}`);
}

console.log('\n✨ 演示完成！');
console.log('\n💡 提示: 查看 test_example.js 获取详细的差异树结构输出');