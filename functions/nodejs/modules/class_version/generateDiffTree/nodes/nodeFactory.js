/**
 * 差异节点创建工厂模块
 * 负责创建统一格式的差异节点
 */

const typeUtils = require('../utils/typeUtils');
const textUtils = require('../utils/textUtils');

/**
 * 创建差异节点
 * @param {string} path - 节点路径
 * @param {string} status - 节点状态 (unchanged|modified|added|deleted|ignored)
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} fieldType - 字段类型
 * @param {string} key - 字段键名
 * @param {Object} context - 上下文对象
 * @returns {Object} 差异节点对象
 */
function createDiffNode(path, status, oldValue, newValue, fieldType, key, context) {
  const config = context.config || {};
  
  const node = {
    path: path || 'root',
    status,
    fieldType: fieldType || typeUtils.getValueType(newValue !== undefined ? newValue : oldValue),
    key: key || 'root'
  };
  
  // 处理值的显示
  if (status !== 'unchanged' || config.includeUnchanged) {
    node.oldValue = processNodeValue(oldValue, config);
    node.newValue = processNodeValue(newValue, config);
  }
  
  // 为复杂类型预留children字段
  if (typeUtils.isComplexType(oldValue) || typeUtils.isComplexType(newValue)) {
    node.children = {};
  }
  
  return node;
}

/**
 * 创建根节点
 * @param {string} status - 根节点状态
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {Object} children - 子节点对象
 * @returns {Object} 根节点对象
 */
function createRootNode(status, oldValue, newValue, children = {}) {
  const rootNode = {
    path: 'root',
    status,
    fieldType: typeUtils.getValueType(newValue !== undefined ? newValue : oldValue),
    key: 'root',
    children
  };
  
  // 根节点通常不需要显示完整的oldValue和newValue
  // 但可以提供简化的摘要信息
  if (typeUtils.isComplexType(oldValue) || typeUtils.isComplexType(newValue)) {
    rootNode.oldValue = createValueSummary(oldValue);
    rootNode.newValue = createValueSummary(newValue);
  } else {
    rootNode.oldValue = oldValue;
    rootNode.newValue = newValue;
  }
  
  return rootNode;
}

/**
 * 创建叶子节点
 * @param {string} path - 节点路径
 * @param {string} status - 节点状态
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} fieldType - 字段类型
 * @param {string} key - 字段键名
 * @returns {Object} 叶子节点对象
 */
function createLeafNode(path, status, oldValue, newValue, fieldType, key) {
  return {
    path,
    status,
    fieldType: fieldType || typeUtils.getValueType(newValue !== undefined ? newValue : oldValue),
    key,
    oldValue,
    newValue
  };
}

/**
 * 处理节点值
 * @param {any} value - 要处理的值
 * @param {Object} config - 配置选项
 * @returns {any} 处理后的值
 */
function processNodeValue(value, config) {
  if (typeUtils.isBasicType(value)) {
    return value;
  }
  
  // 对于复杂类型，根据配置决定如何处理
  if (typeUtils.isComplexType(value)) {
    return textUtils.formatComplexValue(value, config.maxStringLength);
  }
  
  return value;
}

/**
 * 创建值摘要
 * @param {any} value - 要创建摘要的值
 * @returns {string} 值摘要
 */
function createValueSummary(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  if (typeUtils.isArray(value)) {
    return `[Array(${value.length})]`;
  }
  
  if (typeUtils.isObject(value)) {
    const keys = Object.keys(value);
    return `{Object(${keys.length} keys)}`;
  }
  
  return String(value);
}

/**
 * 克隆节点（深拷贝）
 * @param {Object} node - 要克隆的节点
 * @returns {Object} 克隆后的节点
 */
function cloneNode(node) {
  return JSON.parse(JSON.stringify(node));
}

/**
 * 合并节点属性
 * @param {Object} targetNode - 目标节点
 * @param {Object} sourceNode - 源节点
 * @returns {Object} 合并后的节点
 */
function mergeNodeProperties(targetNode, sourceNode) {
  return {
    ...targetNode,
    ...sourceNode,
    children: {
      ...(targetNode.children || {}),
      ...(sourceNode.children || {})
    }
  };
}

module.exports = {
  createDiffNode,
  createRootNode,
  createLeafNode,
  processNodeValue,
  createValueSummary,
  cloneNode,
  mergeNodeProperties
};