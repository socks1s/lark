// ======================
// 数学运算模块 (mathOperations.js)
// ======================

// 1. 加法函数
const add = (a, b) => a + b;

// 2. 减法函数
const subtract = (a, b) => a - b;

// 3. 乘法函数
const multiply = (a, b) => a * b;

// 4. 除法函数（新增安全校验）
const divide = (a, b) => {
  if (b === 0) throw new Error('除数不能为零');
  return a / b;
};

// 5. 批量导出所有函数
module.exports = {
  add,
  subtract,
  multiply,
  divide
};