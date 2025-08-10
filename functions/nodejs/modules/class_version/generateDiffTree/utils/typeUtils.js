/**
 * 类型判断工具模块
 * 提供各种数据类型的判断和识别功能
 */

/**
 * 获取值的类型
 * @param {any} value - 要检测类型的值
 * @returns {string} 类型字符串
 */
function getValueType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  
  const type = typeof value;
  if (type === 'object') {
    // 进一步区分对象类型
    if (value instanceof Date) return 'date';
    if (value instanceof RegExp) return 'regexp';
    return 'object';
  }
  
  return type;
}

/**
 * 判断是否为对象
 * @param {any} value - 要检查的值
 * @returns {boolean} 是否为对象
 */
function isObject(value) {
  return value !== null && 
         typeof value === 'object' && 
         !Array.isArray(value) && 
         !(value instanceof Date) && 
         !(value instanceof RegExp);
}

/**
 * 判断是否为数组
 * @param {any} value - 要检查的值
 * @returns {boolean} 是否为数组
 */
function isArray(value) {
  return Array.isArray(value);
}

/**
 * 判断是否为空值
 * @param {any} value - 要检查的值
 * @returns {boolean} 是否为空值
 */
function isEmpty(value) {
  return value === null || 
         value === undefined || 
         value === '';
}

/**
 * 判断是否为基本类型
 * @param {any} value - 要检查的值
 * @returns {boolean} 是否为基本类型
 */
function isBasicType(value) {
  const type = typeof value;
  return type === 'string' || 
         type === 'number' || 
         type === 'boolean' || 
         value === null || 
         value === undefined;
}

/**
 * 判断两个值是否为相同类型
 * @param {any} value1 - 第一个值
 * @param {any} value2 - 第二个值
 * @returns {boolean} 是否为相同类型
 */
function isSameType(value1, value2) {
  return getValueType(value1) === getValueType(value2);
}

/**
 * 判断是否为复杂类型（对象或数组）
 * @param {any} value - 要检查的值
 * @returns {boolean} 是否为复杂类型
 */
function isComplexType(value) {
  return isObject(value) || isArray(value);
}

/**
 * 判断是否为原始类型
 * @param {any} value - 要检查的值
 * @returns {boolean} 是否为原始类型
 */
function isPrimitive(value) {
  return !isComplexType(value);
}

module.exports = {
  getValueType,
  isObject,
  isArray,
  isEmpty,
  isBasicType,
  isSameType,
  isComplexType,
  isPrimitive
};