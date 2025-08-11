/**
 * 节点处理器模块
 * 负责节点的后处理逻辑，包括值处理和格式化
 */

const typeUtils = require('../utils/typeUtils');
const textUtils = require('../utils/textUtils');

/**
 * 处理节点值
 * @param {any} value - 要处理的值
 * @param {Object} options - 处理选项
 * @returns {any} 处理后的值
 */
function processNodeValue(value, options = {}) {
  if (typeUtils.isEmpty(value)) {
    return value;
  }
  
  if (typeUtils.isBasicType(value)) {
    return processBasicValue(value, options);
  }
  
  if (typeUtils.isComplexType(value)) {
    return processComplexValue(value, options);
  }
  
  return value;
}

/**
 * 简化复杂值
 * @param {any} value - 要简化的复杂值
 * @param {number} maxLength - 最大长度
 * @returns {string} 简化后的字符串表示
 */
function simplifyComplexValue(value, maxLength = 100) {
  if (typeUtils.isEmpty(value)) {
    return value;
  }
  
  if (typeUtils.isArray(value)) {
    return `[Array(${value.length})]`;
  }
  
  if (typeUtils.isObject(value)) {
    const keys = Object.keys(value);
    const preview = keys.slice(0, 3).join(', ');
    const suffix = keys.length > 3 ? '...' : '';
    return `{${preview}${suffix}}`;
  }
  
  return textUtils.formatComplexValue(value, maxLength);
}

/**
 * 格式化显示值
 * @param {any} value - 要格式化的值
 * @param {string} fieldType - 字段类型
 * @returns {string} 格式化后的显示值
 */
function formatDisplayValue(value, fieldType) {
  return textUtils.toDisplayString(value, fieldType);
}

/**
 * 处理基本类型值
 * @param {any} value - 基本类型值
 * @param {Object} options - 处理选项
 * @returns {any} 处理后的值
 */
function processBasicValue(value, options) {
  if (typeof value === 'string') {
    return textUtils.processText(value, {
      trim: options.trimStrings !== false,
      normalize: options.stringComparison === 'normalized'
    });
  }
  
  return value;
}

/**
 * 处理复杂类型值
 * @param {any} value - 复杂类型值
 * @param {Object} options - 处理选项
 * @returns {string} 处理后的字符串表示
 */
function processComplexValue(value, options) {
  const maxLength = options.maxStringLength || 100;
  
  if (options.simplifyComplexValues !== false) {
    return simplifyComplexValue(value, maxLength);
  }
  
  return textUtils.formatComplexValue(value, maxLength);
}

/**
 * 标准化节点值
 * @param {Object} node - 差异节点
 * @param {Object} options - 处理选项
 * @returns {Object} 标准化后的节点
 */
function normalizeNodeValues(node, options = {}) {
  const normalizedNode = { ...node };
  
  if (normalizedNode.oldValue !== undefined) {
    normalizedNode.oldValue = processNodeValue(normalizedNode.oldValue, options);
  }
  
  if (normalizedNode.newValue !== undefined) {
    normalizedNode.newValue = processNodeValue(normalizedNode.newValue, options);
  }
  
  // 递归处理子节点
  if (normalizedNode.children) {
    const normalizedChildren = {};
    for (const [key, childNode] of Object.entries(normalizedNode.children)) {
      normalizedChildren[key] = normalizeNodeValues(childNode, options);
    }
    normalizedNode.children = normalizedChildren;
  }
  
  return normalizedNode;
}

/**
 * 验证节点结构
 * @param {Object} node - 要验证的节点
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array }
 */
function validateNodeStructure(node) {
  const errors = [];
  
  // 检查必需字段
  const requiredFields = ['path', 'status', 'fieldType', 'key'];
  for (const field of requiredFields) {
    if (!(field in node)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // 检查状态值
  const validStatuses = ['unchanged', 'modified', 'added', 'deleted', 'ignored'];
  if (node.status && !validStatuses.includes(node.status)) {
    errors.push(`Invalid status: ${node.status}`);
  }
  
  // 检查路径格式
  if (node.path && typeof node.path !== 'string') {
    errors.push('Path must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 清理节点数据
 * @param {Object} node - 要清理的节点
 * @param {Object} options - 清理选项
 * @returns {Object} 清理后的节点
 */
function cleanupNode(node, options = {}) {
  const cleaned = { ...node };
  
  // 移除undefined值
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  
  // 如果不包含未修改的节点，移除相关字段
  if (!options.includeUnchanged && cleaned.status === 'unchanged') {
    delete cleaned.oldValue;
    delete cleaned.newValue;
  }
  
  return cleaned;
}

module.exports = {
  processNodeValue,
  simplifyComplexValue,
  formatDisplayValue,
  normalizeNodeValues,
  validateNodeStructure,
  cleanupNode
};