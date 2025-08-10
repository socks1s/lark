/**
 * 数组比较器模块
 * 负责比较数组类型的数据结构
 */

const typeUtils = require('../utils/typeUtils');
const pathUtils = require('../utils/pathUtils');
const nodeFactory = require('../nodes/nodeFactory');
const comparisonUtils = require('../utils/comparisonUtils');

/**
 * 比较两个数组
 * @param {Array} oldArray - 旧数组
 * @param {Array} newArray - 新数组
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function compareArrays(oldArray, newArray, path, context) {
  const { config } = context;
  
  // 处理null/undefined情况
  if (typeUtils.isEmpty(oldArray) && typeUtils.isEmpty(newArray)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldArray, newArray, 'unchanged');
    return nodeFactory.createDiffNode(path, 'unchanged', normalizedValues.oldValue, normalizedValues.newValue, 'array', pathUtils.getLastKey(path), context);
  }
  
  if (typeUtils.isEmpty(oldArray)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldArray, newArray, 'added');
    return nodeFactory.createDiffNode(path, 'added', normalizedValues.oldValue, normalizedValues.newValue, 'array', pathUtils.getLastKey(path), context);
  }
  
  if (typeUtils.isEmpty(newArray)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldArray, newArray, 'deleted');
    return nodeFactory.createDiffNode(path, 'deleted', normalizedValues.oldValue, normalizedValues.newValue, 'array', pathUtils.getLastKey(path), context);
  }
  
  // 确保都是数组类型
  if (!typeUtils.isArray(oldArray) || !typeUtils.isArray(newArray)) {
    const normalizedValues = comparisonUtils.createNormalizedValues(oldArray, newArray, 'modified');
    return nodeFactory.createDiffNode(path, 'modified', normalizedValues.oldValue, normalizedValues.newValue, 'mixed', pathUtils.getLastKey(path), context);
  }
  
  // 根据配置选择比较策略
  if (config.arrayOptimization === 'simple') {
    return compareArraysSimple(oldArray, newArray, path, context);
  } else {
    return compareArraysDetailed(oldArray, newArray, path, context);
  }
}

/**
 * 简单数组比较（基于索引）
 * @param {Array} oldArray - 旧数组
 * @param {Array} newArray - 新数组
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function compareArraysSimple(oldArray, newArray, path, context) {
  const maxLength = Math.max(oldArray.length, newArray.length);
  const children = {};
  let hasChanges = false;
  
  for (let i = 0; i < maxLength; i++) {
    const childPath = pathUtils.buildPath(path, `[${i}]`);
    const oldValue = i < oldArray.length ? oldArray[i] : undefined;
    const newValue = i < newArray.length ? newArray[i] : undefined;
    
    let childResult;
    
    if (oldValue === undefined) {
      // 新增的元素
      childResult = nodeFactory.createDiffNode(childPath, 'added', undefined, newValue, typeUtils.getValueType(newValue), `[${i}]`, context);
      hasChanges = true;
    } else if (newValue === undefined) {
      // 删除的元素
      childResult = nodeFactory.createDiffNode(childPath, 'deleted', oldValue, undefined, typeUtils.getValueType(oldValue), `[${i}]`, context);
      hasChanges = true;
    } else {
      // 比较现有元素
      childResult = compareArrayElements(oldValue, newValue, childPath, context);
      if (childResult.status !== 'unchanged') {
        hasChanges = true;
      }
    }
    
    children[`[${i}]`] = childResult;
  }
  
  const status = hasChanges ? 'modified' : 'unchanged';
  const result = nodeFactory.createDiffNode(path, status, oldArray, newArray, 'array', pathUtils.getLastKey(path), context);
  result.children = children;
  
  return result;
}

/**
 * 详细数组比较（尝试匹配相似元素）
 * @param {Array} oldArray - 旧数组
 * @param {Array} newArray - 新数组
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function compareArraysDetailed(oldArray, newArray, path, context) {
  // 对于复杂的数组比较，这里可以实现更智能的匹配算法
  // 目前先使用简单比较，后续可以扩展
  return compareArraysSimple(oldArray, newArray, path, context);
}

/**
 * 比较数组元素
 * @param {any} oldElement - 旧元素
 * @param {any} newElement - 新元素
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function compareArrayElements(oldElement, newElement, path, context) {
  // 引入对象比较器以避免循环依赖
  const objectComparator = require('./objectComparator');
  
  return objectComparator.compareValues(oldElement, newElement, path, context);
}

/**
 * 检查数组是否相等（浅比较）
 * @param {Array} arr1 - 数组1
 * @param {Array} arr2 - 数组2
 * @returns {boolean} 是否相等
 */
function areArraysShallowEqual(arr1, arr2) {
  if (!typeUtils.isArray(arr1) || !typeUtils.isArray(arr2)) {
    return false;
  }
  
  if (arr1.length !== arr2.length) {
    return false;
  }
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * 获取数组差异摘要
 * @param {Array} oldArray - 旧数组
 * @param {Array} newArray - 新数组
 * @returns {Object} 差异摘要
 */
function getArrayDiffSummary(oldArray, newArray) {
  const oldLength = typeUtils.isArray(oldArray) ? oldArray.length : 0;
  const newLength = typeUtils.isArray(newArray) ? newArray.length : 0;
  
  return {
    oldLength,
    newLength,
    lengthDiff: newLength - oldLength,
    isEmpty: {
      old: oldLength === 0,
      new: newLength === 0
    }
  };
}

/**
 * 优化大数组的比较
 * @param {Array} oldArray - 旧数组
 * @param {Array} newArray - 新数组
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function compareArraysOptimized(oldArray, newArray, path, context) {
  const { config } = context;
  const maxArraySize = config.maxArraySize || 1000;
  
  // 如果数组太大，使用优化策略
  if (oldArray.length > maxArraySize || newArray.length > maxArraySize) {
    return compareArraysLarge(oldArray, newArray, path, context);
  }
  
  return compareArraysSimple(oldArray, newArray, path, context);
}

/**
 * 大数组比较策略
 * @param {Array} oldArray - 旧数组
 * @param {Array} newArray - 新数组
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function compareArraysLarge(oldArray, newArray, path, context) {
  // 对于大数组，只比较长度和前几个元素
  const sampleSize = 10;
  const children = {};
  let hasChanges = oldArray.length !== newArray.length;
  
  // 比较前几个元素作为样本
  const compareLength = Math.min(sampleSize, Math.max(oldArray.length, newArray.length));
  
  for (let i = 0; i < compareLength; i++) {
    const childPath = pathUtils.buildPath(path, `[${i}]`);
    const oldValue = i < oldArray.length ? oldArray[i] : undefined;
    const newValue = i < newArray.length ? newArray[i] : undefined;
    
    const childResult = compareArrayElements(oldValue, newValue, childPath, context);
    children[`[${i}]`] = childResult;
    
    if (childResult.status !== 'unchanged') {
      hasChanges = true;
    }
  }
  
  // 如果数组很长，添加省略标记
  if (Math.max(oldArray.length, newArray.length) > sampleSize) {
    const ellipsisPath = pathUtils.buildPath(path, '[...]');
    children['[...]'] = nodeFactory.createDiffNode(
      ellipsisPath,
      'unchanged',
      `... ${oldArray.length - sampleSize} more items`,
      `... ${newArray.length - sampleSize} more items`,
      'ellipsis',
      '[...]',
      context
    );
  }
  
  const status = hasChanges ? 'modified' : 'unchanged';
  const result = nodeFactory.createDiffNode(path, status, oldArray, newArray, 'array', pathUtils.getLastKey(path), context);
  result.children = children;
  
  return result;
}

module.exports = {
  compareArrays,
  compareArraysSimple,
  compareArraysDetailed,
  compareArrayElements,
  areArraysShallowEqual,
  getArrayDiffSummary,
  compareArraysOptimized,
  compareArraysLarge
};