/**
 * 对象比较器模块
 * 负责比较对象类型的数据结构
 */

const typeUtils = require('../utils/typeUtils');
const pathUtils = require('../utils/pathUtils');
const nodeFactory = require('../nodes/nodeFactory');

/**
 * 比较两个对象
 * @param {Object} oldObj - 旧对象
 * @param {Object} newObj - 新对象
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function compareObjects(oldObj, newObj, path, context) {
  const { config, ignoreFields } = context;
  const comparisonUtils = require('../utils/comparisonUtils');
  
  // 处理null/undefined情况
  if (typeUtils.isEmpty(oldObj) && typeUtils.isEmpty(newObj)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldObj, newObj, 'unchanged');
    return nodeFactory.createDiffNode(path, 'unchanged', normalizedValues.oldValue, normalizedValues.newValue, 'object', pathUtils.getLastKey(path), context);
  }
  
  if (typeUtils.isEmpty(oldObj)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldObj, newObj, 'added');
    return nodeFactory.createDiffNode(path, 'added', normalizedValues.oldValue, normalizedValues.newValue, 'object', pathUtils.getLastKey(path), context);
  }
  
  if (typeUtils.isEmpty(newObj)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldObj, newObj, 'deleted');
    return nodeFactory.createDiffNode(path, 'deleted', normalizedValues.oldValue, normalizedValues.newValue, 'object', pathUtils.getLastKey(path), context);
  }
  
  // 确保都是对象类型
  if (!typeUtils.isObject(oldObj) || !typeUtils.isObject(newObj)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldObj, newObj, 'modified');
    return nodeFactory.createDiffNode(path, 'modified', normalizedValues.oldValue, normalizedValues.newValue, 'mixed', pathUtils.getLastKey(path), context);
  }
  
  // 获取所有键
  const oldKeys = Object.keys(oldObj);
  const newKeys = Object.keys(newObj);
  const allKeys = new Set([...oldKeys, ...newKeys]);
  
  const children = {};
  let hasChanges = false;
  
  // 比较每个键
  for (const key of allKeys) {
    const childPath = pathUtils.buildPath(path, key);
    
    // 检查是否应该忽略此字段
    if (shouldIgnoreField(childPath, ignoreFields)) {
      const fieldType = typeUtils.getValueType(newObj[key] || oldObj[key]);
      const normalizedValues = comparisonUtils.createNormalizedValues(oldObj[key], newObj[key], 'ignored');
      children[key] = nodeFactory.createDiffNode(
        childPath, 
        'ignored', 
        normalizedValues.oldValue, 
        normalizedValues.newValue, 
        fieldType,
        key,
        context
      );
      continue;
    }
    
    const oldValue = oldObj[key];
    const newValue = newObj[key];
    
    // 递归比较子值
    const childResult = compareValues(oldValue, newValue, childPath, context);
    children[key] = childResult;
    
    if (childResult.status !== 'unchanged' && childResult.status !== 'ignored') {
      hasChanges = true;
    }
  }
  
  // 确定对象的整体状态
  const status = hasChanges ? 'modified' : 'unchanged';
  
  const normalizedValues = comparisonUtils.createNormalizedValues(oldObj, newObj, status);
  const result = nodeFactory.createDiffNode(path, status, normalizedValues.oldValue, normalizedValues.newValue, 'object', pathUtils.getLastKey(path), context);
  result.children = children;
  
  return result;
}

/**
 * 比较值（递归入口）
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function compareValues(oldValue, newValue, path, context) {
  // 引入其他比较器以避免循环依赖
  const arrayComparator = require('./arrayComparator');
  const primitiveComparator = require('./primitiveComparator');
  const comparisonUtils = require('../utils/comparisonUtils');
  
  // 使用工具函数确定字段类型和状态
  const comparison = comparisonUtils.determineFieldTypeAndStatus(oldValue, newValue);
  
  // 如果已经确定了状态（添加、删除、类型变更），直接返回结果
  if (comparison.status !== null) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, comparison.status);
    return nodeFactory.createDiffNode(
      path, 
      comparison.status, 
      normalizedValues.oldValue, 
      normalizedValues.newValue, 
      comparison.fieldType, 
      pathUtils.getLastKey(path), 
      context
    );
  }
  
  // 根据类型选择比较器进行深度比较
  if (typeUtils.isObject(oldValue)) {
    return compareObjects(oldValue, newValue, path, context);
  }
  
  if (typeUtils.isArray(oldValue)) {
    return arrayComparator.compareArrays(oldValue, newValue, path, context);
  }
  
  // 基本类型比较
  return primitiveComparator.comparePrimitives(oldValue, newValue, path, context);
}

/**
 * 检查是否应该忽略字段
 * @param {string} fieldPath - 字段路径
 * @param {Array|Object} ignoreFields - 忽略字段配置
 * @returns {boolean} 是否应该忽略
 */
function shouldIgnoreField(fieldPath, ignoreFields) {
  if (!ignoreFields) return false;
  
  if (Array.isArray(ignoreFields)) {
    return ignoreFields.some(pattern => matchesPattern(fieldPath, pattern));
  }
  
  if (typeof ignoreFields === 'object') {
    return checkIgnoreRules(fieldPath, ignoreFields);
  }
  
  return false;
}

/**
 * 检查路径是否匹配模式
 * @param {string} path - 路径
 * @param {string} pattern - 模式
 * @returns {boolean} 是否匹配
 */
function matchesPattern(path, pattern) {
  // 支持简单的通配符匹配
  if (pattern.includes('*')) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(path);
  }
  
  // 精确匹配
  return path === pattern;
}

/**
 * 检查忽略规则
 * @param {string} fieldPath - 字段路径
 * @param {Object} ignoreRules - 忽略规则对象
 * @returns {boolean} 是否应该忽略
 */
function checkIgnoreRules(fieldPath, ignoreRules) {
  // 检查精确路径匹配
  if (ignoreRules.exact && ignoreRules.exact.includes(fieldPath)) {
    return true;
  }
  
  // 检查模式匹配
  if (ignoreRules.patterns) {
    return ignoreRules.patterns.some(pattern => matchesPattern(fieldPath, pattern));
  }
  
  // 检查键名匹配
  if (ignoreRules.keys) {
    const key = pathUtils.getLastKey(fieldPath);
    return ignoreRules.keys.includes(key);
  }
  
  return false;
}

/**
 * 获取对象差异摘要
 * @param {Object} oldObj - 旧对象
 * @param {Object} newObj - 新对象
 * @returns {Object} 差异摘要
 */
function getObjectDiffSummary(oldObj, newObj) {
  const oldKeys = typeUtils.isObject(oldObj) ? Object.keys(oldObj) : [];
  const newKeys = typeUtils.isObject(newObj) ? Object.keys(newObj) : [];
  
  const addedKeys = newKeys.filter(key => !oldKeys.includes(key));
  const deletedKeys = oldKeys.filter(key => !newKeys.includes(key));
  const commonKeys = oldKeys.filter(key => newKeys.includes(key));
  
  return {
    addedKeys,
    deletedKeys,
    commonKeys,
    totalKeys: new Set([...oldKeys, ...newKeys]).size
  };
}

module.exports = {
  compareObjects,
  compareValues,
  shouldIgnoreField,
  matchesPattern,
  checkIgnoreRules,
  getObjectDiffSummary
};