/**
 * 基本类型比较器模块
 * 负责比较基本数据类型（string, number, boolean, null, undefined等）
 */

const typeUtils = require('../utils/typeUtils');
const textUtils = require('../utils/textUtils');
const pathUtils = require('../utils/pathUtils');
const nodeFactory = require('../nodes/nodeFactory');
const comparisonUtils = require('../utils/comparisonUtils');

/**
 * 比较基本类型值
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function comparePrimitives(oldValue, newValue, path, context) {
  const { config } = context;
  const fieldType = typeUtils.getValueType(newValue !== undefined ? newValue : oldValue);
  const key = pathUtils.getLastKey(path);
  
  // 处理null和undefined
  if (typeUtils.isEmpty(oldValue) && typeUtils.isEmpty(newValue)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, 'unchanged');
    return nodeFactory.createLeafNode(path, 'unchanged', normalizedValues.oldValue, normalizedValues.newValue, fieldType, key);
  }
  
  if (typeUtils.isEmpty(oldValue)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, 'added');
    return nodeFactory.createLeafNode(path, 'added', normalizedValues.oldValue, normalizedValues.newValue, fieldType, key);
  }
  
  if (typeUtils.isEmpty(newValue)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, 'deleted');
    return nodeFactory.createLeafNode(path, 'deleted', normalizedValues.oldValue, normalizedValues.newValue, fieldType, key);
  }
  
  // 类型检查
  if (!typeUtils.isSameType(oldValue, newValue)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, 'modified');
    return nodeFactory.createLeafNode(path, 'modified', normalizedValues.oldValue, normalizedValues.newValue, 'mixed', key);
  }
  
  // 根据类型进行比较
  const isEqual = compareByType(oldValue, newValue, fieldType, config);
  const status = isEqual ? 'unchanged' : 'modified';
  const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, status);
  
  return nodeFactory.createLeafNode(path, status, normalizedValues.oldValue, normalizedValues.newValue, fieldType, key);
}

/**
 * 根据类型比较值
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} fieldType - 字段类型
 * @param {Object} config - 配置选项
 * @returns {boolean} 是否相等
 */
function compareByType(oldValue, newValue, fieldType, config) {
  switch (fieldType) {
    case 'string':
      return compareStrings(oldValue, newValue, config);
    case 'number':
      return compareNumbers(oldValue, newValue, config);
    case 'boolean':
      return compareBooleans(oldValue, newValue);
    case 'date':
      return compareDates(oldValue, newValue);
    case 'regexp':
      return compareRegExps(oldValue, newValue);
    default:
      return oldValue === newValue;
  }
}

/**
 * 比较字符串
 * @param {string} oldStr - 旧字符串
 * @param {string} newStr - 新字符串
 * @param {Object} config - 配置选项
 * @returns {boolean} 是否相等
 */
function compareStrings(oldStr, newStr, config) {
  if (config.stringComparison === 'normalized') {
    return textUtils.compareStrings(oldStr, newStr, true);
  }
  
  if (config.stringComparison === 'case-insensitive') {
    return oldStr.toLowerCase() === newStr.toLowerCase();
  }
  
  // 默认严格比较
  return oldStr === newStr;
}

/**
 * 比较数字
 * @param {number} oldNum - 旧数字
 * @param {number} newNum - 新数字
 * @param {Object} config - 配置选项
 * @returns {boolean} 是否相等
 */
function compareNumbers(oldNum, newNum, config) {
  // 处理NaN
  if (Number.isNaN(oldNum) && Number.isNaN(newNum)) {
    return true;
  }
  
  if (Number.isNaN(oldNum) || Number.isNaN(newNum)) {
    return false;
  }
  
  // 处理Infinity
  if (!Number.isFinite(oldNum) || !Number.isFinite(newNum)) {
    return oldNum === newNum;
  }
  
  // 如果配置了数字精度
  if (config.numberPrecision !== undefined) {
    const precision = config.numberPrecision;
    return Math.abs(oldNum - newNum) < Math.pow(10, -precision);
  }
  
  return oldNum === newNum;
}

/**
 * 比较布尔值
 * @param {boolean} oldBool - 旧布尔值
 * @param {boolean} newBool - 新布尔值
 * @returns {boolean} 是否相等
 */
function compareBooleans(oldBool, newBool) {
  return oldBool === newBool;
}

/**
 * 比较日期
 * @param {Date} oldDate - 旧日期
 * @param {Date} newDate - 新日期
 * @returns {boolean} 是否相等
 */
function compareDates(oldDate, newDate) {
  if (!(oldDate instanceof Date) || !(newDate instanceof Date)) {
    return false;
  }
  
  // 比较时间戳
  return oldDate.getTime() === newDate.getTime();
}

/**
 * 比较正则表达式
 * @param {RegExp} oldRegex - 旧正则表达式
 * @param {RegExp} newRegex - 新正则表达式
 * @returns {boolean} 是否相等
 */
function compareRegExps(oldRegex, newRegex) {
  if (!(oldRegex instanceof RegExp) || !(newRegex instanceof RegExp)) {
    return false;
  }
  
  return oldRegex.source === newRegex.source && 
         oldRegex.flags === newRegex.flags;
}

/**
 * 深度比较基本值（处理嵌套的基本类型）
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {Object} config - 配置选项
 * @returns {boolean} 是否相等
 */
function deepComparePrimitives(oldValue, newValue, config = {}) {
  // 严格相等检查
  if (oldValue === newValue) {
    return true;
  }
  
  // 类型检查
  if (!typeUtils.isSameType(oldValue, newValue)) {
    return false;
  }
  
  const valueType = typeUtils.getValueType(oldValue);
  return compareByType(oldValue, newValue, valueType, config);
}

/**
 * 获取基本类型差异描述
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @returns {string} 差异描述
 */
function getPrimitiveDiffDescription(oldValue, newValue) {
  if (typeUtils.isEmpty(oldValue)) {
    return `Added: ${textUtils.toDisplayString(newValue)}`;
  }
  
  if (typeUtils.isEmpty(newValue)) {
    return `Deleted: ${textUtils.toDisplayString(oldValue)}`;
  }
  
  if (!typeUtils.isSameType(oldValue, newValue)) {
    return `Type changed: ${typeUtils.getValueType(oldValue)} → ${typeUtils.getValueType(newValue)}`;
  }
  
  return `Changed: ${textUtils.toDisplayString(oldValue)} → ${textUtils.toDisplayString(newValue)}`;
}

/**
 * 检查值是否为"空"（根据业务逻辑）
 * @param {any} value - 要检查的值
 * @param {Object} config - 配置选项
 * @returns {boolean} 是否为空
 */
function isEmptyValue(value, config = {}) {
  // 基本的空值检查
  if (typeUtils.isEmpty(value)) {
    return true;
  }
  
  // 字符串空值检查
  if (typeof value === 'string') {
    if (config.treatEmptyStringAsNull && value.trim() === '') {
      return true;
    }
  }
  
  // 数字空值检查
  if (typeof value === 'number') {
    if (config.treatZeroAsNull && value === 0) {
      return true;
    }
    if (config.treatNaNAsNull && Number.isNaN(value)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 标准化基本类型值
 * @param {any} value - 要标准化的值
 * @param {Object} config - 配置选项
 * @returns {any} 标准化后的值
 */
function normalizePrimitiveValue(value, config = {}) {
  if (typeof value === 'string' && config.stringComparison === 'normalized') {
    return textUtils.normalizeString(value);
  }
  
  if (typeof value === 'string' && config.stringComparison === 'case-insensitive') {
    return value.toLowerCase();
  }
  
  return value;
}

module.exports = {
  comparePrimitives,
  compareByType,
  compareStrings,
  compareNumbers,
  compareBooleans,
  compareDates,
  compareRegExps,
  deepComparePrimitives,
  getPrimitiveDiffDescription,
  isEmptyValue,
  normalizePrimitiveValue
};