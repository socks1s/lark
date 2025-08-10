/**
 * 比较工具函数模块
 * 提供统一的字段类型判断和状态确定功能
 */

const typeUtils = require('./typeUtils');

/**
 * 确定字段类型和变更状态
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @returns {Object} 包含status和fieldType的对象
 */
function determineFieldTypeAndStatus(oldValue, newValue) {
  // 处理undefined情况 - 字段添加
  if (oldValue === undefined && newValue !== undefined) {
    return {
      status: 'added',
      fieldType: typeUtils.getValueType(newValue)
    };
  }
  
  // 处理undefined情况 - 字段删除
  if (oldValue !== undefined && newValue === undefined) {
    return {
      status: 'deleted', 
      fieldType: typeUtils.getValueType(oldValue)
    };
  }
  
  // 处理null情况
  if (typeUtils.isEmpty(oldValue) && typeUtils.isEmpty(newValue)) {
    return {
      status: 'unchanged',
      fieldType: typeUtils.getValueType(newValue !== undefined ? newValue : oldValue)
    };
  }
  
  if (typeUtils.isEmpty(oldValue)) {
    return {
      status: 'added',
      fieldType: typeUtils.getValueType(newValue)
    };
  }
  
  if (typeUtils.isEmpty(newValue)) {
    return {
      status: 'deleted',
      fieldType: typeUtils.getValueType(oldValue)
    };
  }
  
  // 类型比较
  const oldType = typeUtils.getValueType(oldValue);
  const newType = typeUtils.getValueType(newValue);
  
  if (oldType !== newType) {
    return {
      status: 'modified',
      fieldType: 'mixed'
    };
  }
  
  return {
    status: null, // 需要进一步比较值内容
    fieldType: oldType
  };
}

/**
 * 标准化节点值，处理undefined情况
 * @param {any} value - 原始值
 * @param {string} status - 节点状态
 * @returns {any} 标准化后的值
 */
function normalizeNodeValue(value, status) {
  if (value === undefined) {
    // 对于添加的字段，旧值设为null
    if (status === 'added') {
      return null;
    }
    // 对于删除的字段，新值设为null
    if (status === 'deleted') {
      return null;
    }
    // 其他情况保持undefined（但这种情况应该很少见）
    return null;
  }
  return value;
}

/**
 * 创建标准化的节点值对象
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} status - 节点状态
 * @returns {Object} 包含标准化oldValue和newValue的对象
 */
function createNormalizedValues(oldValue, newValue, status) {
  return {
    oldValue: normalizeNodeValue(oldValue, status),
    newValue: normalizeNodeValue(newValue, status)
  };
}

/**
 * 检查是否为类型变更的情况
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @returns {boolean} 是否为类型变更
 */
function isTypeChange(oldValue, newValue) {
  // 如果有一个是undefined，不算类型变更，而是添加/删除
  if (oldValue === undefined || newValue === undefined) {
    return false;
  }
  
  // 如果都是empty值，不算类型变更
  if (typeUtils.isEmpty(oldValue) && typeUtils.isEmpty(newValue)) {
    return false;
  }
  
  const oldType = typeUtils.getValueType(oldValue);
  const newType = typeUtils.getValueType(newValue);
  
  return oldType !== newType;
}

/**
 * 获取比较结果的描述信息
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} status - 状态
 * @returns {string} 描述信息
 */
function getComparisonDescription(oldValue, newValue, status) {
  switch (status) {
    case 'added':
      return `字段添加: ${typeUtils.getValueType(newValue)}类型`;
    case 'deleted':
      return `字段删除: ${typeUtils.getValueType(oldValue)}类型`;
    case 'modified':
      if (isTypeChange(oldValue, newValue)) {
        return `类型变更: ${typeUtils.getValueType(oldValue)} → ${typeUtils.getValueType(newValue)}`;
      }
      return `值变更: ${typeUtils.getValueType(oldValue)}类型`;
    case 'unchanged':
      return `无变更: ${typeUtils.getValueType(oldValue)}类型`;
    default:
      return '未知状态';
  }
}

module.exports = {
  determineFieldTypeAndStatus,
  normalizeNodeValue,
  createNormalizedValues,
  isTypeChange,
  getComparisonDescription
};