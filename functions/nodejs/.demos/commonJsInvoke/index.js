// ======================
// 主入口文件 (main.js)
// ======================
const math = require('./mathOperations');

// 飞书云函数标准入口
module.exports = async function(params, context) {
  const { operation, a, b } = params;
  
  try {
    let result;
    switch(operation) {
      case 'add':
        result = math.add(a, b);
        break;
      case 'subtract':
        result = math.subtract(a, b);
        break;
      case 'multiply':
        result = math.multiply(a, b);
        break;
      case 'divide':
        result = math.divide(a, b);
        break;
      default:
        return { code: 400, error: '无效操作类型' };
    }
    
    return {
      code: 200,
      data: { result },
      operation: `${a} ${operation} ${b} = ${result}`
    };
  } catch (error) {
    return {
      code: 500,
      error: error.message
    };
  }
};