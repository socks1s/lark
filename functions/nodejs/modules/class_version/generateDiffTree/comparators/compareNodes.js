/**
 * 节点比较统一入口模块
 * 负责协调各种类型的比较器，提供统一的比较接口
 */

const typeUtils = require('../utils/typeUtils');
const pathUtils = require('../utils/pathUtils');
const nodeFactory = require('../nodes/nodeFactory');
const objectComparator = require('./objectComparator');
const arrayComparator = require('./arrayComparator');
const primitiveComparator = require('./primitiveComparator');
const comparisonUtils = require('../utils/comparisonUtils');

/**
 * 比较两个节点（主入口函数）
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function compareNodes(oldValue, newValue, path = 'root', context = {}) {
  // 确保上下文包含必要的配置
  const fullContext = {
    config: {},
    ignoreFields: [],
    statistics: { comparisons: 0, nodes: 0 },
    ...context
  };
  
  // 增加比较计数
  fullContext.statistics.comparisons++;
  
  // 记录比较操作到统计收集器
  if (fullContext.statisticsCollector && fullContext.statisticsCollector.recordComparison) {
    fullContext.statisticsCollector.recordComparison();
  }
  
  try {
    // 预处理：检查是否应该忽略此路径
    if (shouldIgnorePath(path, fullContext.ignoreFields)) {
      const node = createIgnoredNode(oldValue, newValue, path, fullContext);
      recordNodeToStats(node, fullContext);
      return node;
    }
    
    // 类型检查和路由
    const result = routeComparison(oldValue, newValue, path, fullContext);
    
    // 增加节点计数
    fullContext.statistics.nodes++;
    
    // 记录节点到统计收集器
    recordNodeToStats(result, fullContext);
    
    return result;
    
  } catch (error) {
    // 错误处理：创建错误节点
    const errorNode = createErrorNode(oldValue, newValue, path, error, fullContext);
    recordNodeToStats(errorNode, fullContext);
    return errorNode;
  }
}

/**
 * 记录节点到统计收集器
 * @param {Object} node - 节点对象
 * @param {Object} context - 上下文
 */
function recordNodeToStats(node, context) {
  if (context.statisticsCollector && context.statisticsCollector.recordNode) {
    const depth = (node.path || '').split('.').length - 1;
    context.statisticsCollector.recordNode(node, depth);
  }
}

/**
 * 路由比较到相应的比较器
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} path - 当前路径
 * @param {Object} context - 比较上下文
 * @returns {Object} 比较结果节点
 */
function routeComparison(oldValue, newValue, path, context) {
  // 快速相等检查
  if (oldValue === newValue) {
    return createUnchangedNode(oldValue, newValue, path, context);
  }
  
  // 获取值类型
  const oldType = typeUtils.getValueType(oldValue);
  const newType = typeUtils.getValueType(newValue);
  
  // 类型不同的情况
  if (oldType !== newType) {
    return createTypeChangedNode(oldValue, newValue, path, context);
  }
  
  // 根据类型路由到相应的比较器
  switch (oldType) {
    case 'object':
      return objectComparator.compareObjects(oldValue, newValue, path, context);
    
    case 'array':
      return arrayComparator.compareArrays(oldValue, newValue, path, context);
    
    case 'string':
    case 'number':
    case 'boolean':
    case 'date':
    case 'regexp':
    case 'null':
    case 'undefined':
      return primitiveComparator.comparePrimitives(oldValue, newValue, path, context);
    
    default:
      // 未知类型，使用严格比较
      return createUnknownTypeNode(oldValue, newValue, path, context);
  }
}

/**
 * 检查是否应该忽略路径
 * @param {string} path - 路径
 * @param {Array|Object} ignoreFields - 忽略字段配置
 * @returns {boolean} 是否应该忽略
 */
function shouldIgnorePath(path, ignoreFields) {
  return objectComparator.shouldIgnoreField(path, ignoreFields);
}

/**
 * 创建未修改节点
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} path - 路径
 * @param {Object} context - 上下文
 * @returns {Object} 未修改节点
 */
function createUnchangedNode(oldValue, newValue, path, context) {
  const fieldType = typeUtils.getValueType(oldValue);
  const key = pathUtils.getLastKey(path);
  const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, 'unchanged');
  
  return nodeFactory.createDiffNode(path, 'unchanged', normalizedValues.oldValue, normalizedValues.newValue, fieldType, key, context);
}

/**
 * 创建类型变更节点
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} path - 路径
 * @param {Object} context - 上下文
 * @returns {Object} 类型变更节点
 */
function createTypeChangedNode(oldValue, newValue, path, context) {
  const key = pathUtils.getLastKey(path);
  const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, 'modified');
  
  return nodeFactory.createDiffNode(path, 'modified', normalizedValues.oldValue, normalizedValues.newValue, 'mixed', key, context);
}

/**
 * 创建忽略节点
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} path - 路径
 * @param {Object} context - 上下文
 * @returns {Object} 忽略节点
 */
function createIgnoredNode(oldValue, newValue, path, context) {
  const fieldType = typeUtils.getValueType(newValue !== undefined ? newValue : oldValue);
  const key = pathUtils.getLastKey(path);
  const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, 'ignored');
  
  return nodeFactory.createDiffNode(path, 'ignored', normalizedValues.oldValue, normalizedValues.newValue, fieldType, key, context);
}

/**
 * 创建未知类型节点
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} path - 路径
 * @param {Object} context - 上下文
 * @returns {Object} 未知类型节点
 */
function createUnknownTypeNode(oldValue, newValue, path, context) {
  const key = pathUtils.getLastKey(path);
  const status = oldValue === newValue ? 'unchanged' : 'modified';
  const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, status);
  
  return nodeFactory.createDiffNode(path, status, normalizedValues.oldValue, normalizedValues.newValue, 'unknown', key, context);
}

/**
 * 创建错误节点
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {string} path - 路径
 * @param {Error} error - 错误对象
 * @param {Object} context - 上下文
 * @returns {Object} 错误节点
 */
function createErrorNode(oldValue, newValue, path, error, context) {
  const key = pathUtils.getLastKey(path);
  const normalizedValues = comparisonUtils.createNormalizedValues(oldValue, newValue, 'modified');
  
  const errorNode = nodeFactory.createDiffNode(path, 'modified', normalizedValues.oldValue, normalizedValues.newValue, 'error', key, context);
  errorNode.error = {
    message: error.message,
    stack: error.stack,
    type: error.constructor.name
  };
  
  // 记录错误到上下文
  if (!context.errors) {
    context.errors = [];
  }
  context.errors.push({
    path,
    error: error.message,
    timestamp: new Date().toISOString()
  });
  
  return errorNode;
}

/**
 * 批量比较节点
 * @param {Array} comparisons - 比较任务数组 [{oldValue, newValue, path}]
 * @param {Object} context - 比较上下文
 * @returns {Array} 比较结果数组
 */
function compareNodesBatch(comparisons, context = {}) {
  const results = [];
  
  for (const { oldValue, newValue, path } of comparisons) {
    try {
      const result = compareNodes(oldValue, newValue, path, context);
      results.push(result);
    } catch (error) {
      results.push(createErrorNode(oldValue, newValue, path, error, context));
    }
  }
  
  return results;
}

/**
 * 获取比较统计信息
 * @param {Object} context - 比较上下文
 * @returns {Object} 统计信息
 */
function getComparisonStatistics(context) {
  return {
    totalComparisons: context.statistics?.comparisons || 0,
    totalNodes: context.statistics?.nodes || 0,
    errors: context.errors?.length || 0,
    warnings: context.warnings?.length || 0
  };
}

/**
 * 重置比较统计
 * @param {Object} context - 比较上下文
 */
function resetComparisonStatistics(context) {
  context.statistics = { comparisons: 0, nodes: 0 };
  context.errors = [];
  context.warnings = [];
}

module.exports = {
  compareNodes,
  routeComparison,
  shouldIgnorePath,
  createUnchangedNode,
  createTypeChangedNode,
  createIgnoredNode,
  createUnknownTypeNode,
  createErrorNode,
  compareNodesBatch,
  getComparisonStatistics,
  resetComparisonStatistics
};