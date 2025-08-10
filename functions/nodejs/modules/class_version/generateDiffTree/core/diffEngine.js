/**
 * 差异引擎核心模块
 * 负责协调整个差异树生成过程
 */

const compareNodes = require('../comparators/compareNodes');
const statusPropagation = require('../nodes/statusPropagation');
const nodeFactory = require('../nodes/nodeFactory');
const nodeProcessor = require('../nodes/nodeProcessor');
const typeUtils = require('../utils/typeUtils');

/**
 * 创建差异引擎实例
 * @param {Object} config - 配置选项
 * @param {Array|Object} ignoreFields - 忽略字段配置
 * @param {Object} statsCollector - 统计收集器实例
 * @returns {Object} 差异引擎实例
 */
function createDiffEngine(config = {}, ignoreFields = [], statsCollector = null) {
  const context = {
    config,
    ignoreFields,
    statisticsCollector: statsCollector,
    statistics: {
      comparisons: 0,
      nodes: 0,
      startTime: null,
      endTime: null
    },
    errors: [],
    warnings: []
  };
  
  return {
    generateDiffTree: (oldData, newData) => generateDiffTree(oldData, newData, context),
    getStatistics: () => getEngineStatistics(context),
    getErrors: () => context.errors,
    getWarnings: () => context.warnings,
    reset: () => resetEngine(context)
  };
}

/**
 * 生成差异树
 * @param {any} oldData - 旧数据
 * @param {any} newData - 新数据
 * @param {Object} context - 引擎上下文
 * @returns {Object} 差异树结果
 */
function generateDiffTree(oldData, newData, context) {
  // 记录开始时间
  context.statistics.startTime = Date.now();
  
  try {
    // 重置统计信息
    resetEngineStatistics(context);
    
    // 执行根级比较
    const rootNode = compareNodes.compareNodes(oldData, newData, 'root', context);
    
    // 执行状态传播
    const propagatedTree = statusPropagation.propagateStatusRecursively(rootNode, context);
    
    // 后处理节点
    const processedTree = postProcessTree(propagatedTree, context);
    
    // 记录结束时间
    context.statistics.endTime = Date.now();
    
    // 生成最终结果
    return createDiffResult(processedTree, context);
    
  } catch (error) {
    context.statistics.endTime = Date.now();
    
    // 创建错误结果
    return createErrorResult(error, context);
  }
}

/**
 * 后处理差异树
 * @param {Object} tree - 差异树
 * @param {Object} context - 上下文
 * @returns {Object} 处理后的差异树
 */
function postProcessTree(tree, context) {
  const { config } = context;
  
  // 标准化节点值
  let processedTree = nodeProcessor.normalizeNodeValues(tree, {
    maxStringLength: config.maxStringLength,
    simplifyComplexValues: config.simplifyComplexValues !== false,
    stringComparison: config.stringComparison,
    includeUnchanged: config.includeUnchanged
  });
  
  // 清理节点数据
  processedTree = nodeProcessor.cleanupNode(processedTree, {
    includeUnchanged: config.includeUnchanged
  });
  
  // 验证节点结构
  const validation = nodeProcessor.validateNodeStructure(processedTree);
  if (!validation.isValid) {
    context.warnings.push({
      type: 'validation',
      message: 'Tree structure validation failed',
      errors: validation.errors,
      path: 'root'
    });
  }
  
  return processedTree;
}

/**
 * 创建差异结果对象
 * @param {Object} tree - 差异树
 * @param {Object} context - 上下文
 * @returns {Object} 差异结果
 */
function createDiffResult(tree, context) {
  const statistics = getEngineStatistics(context);
  
  return {
    success: true,
    tree,
    statistics,
    metadata: {
      version: require('../config/versionManager').getLatestVersion(),
      timestamp: new Date().toISOString(),
      processingTime: statistics.processingTime
    },
    diagnostics: {
      errors: context.errors,
      warnings: context.warnings,
      hasErrors: context.errors.length > 0,
      hasWarnings: context.warnings.length > 0
    }
  };
}

/**
 * 创建错误结果对象
 * @param {Error} error - 错误对象
 * @param {Object} context - 上下文
 * @returns {Object} 错误结果
 */
function createErrorResult(error, context) {
  const statistics = getEngineStatistics(context);
  
  return {
    success: false,
    error: {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    },
    tree: null,
    statistics,
    metadata: {
      version: require('../config/versionManager').getLatestVersion(),
      timestamp: new Date().toISOString(),
      processingTime: statistics.processingTime
    },
    diagnostics: {
      errors: [...context.errors, {
        type: 'fatal',
        message: error.message,
        path: 'root',
        timestamp: new Date().toISOString()
      }],
      warnings: context.warnings,
      hasErrors: true,
      hasWarnings: context.warnings.length > 0
    }
  };
}

/**
 * 获取引擎统计信息
 * @param {Object} context - 上下文
 * @returns {Object} 统计信息
 */
function getEngineStatistics(context) {
  const { statisticsCollector } = context;
  
  // 使用符合需求规范的统计格式
  if (statisticsCollector && typeof statisticsCollector.getRequiredStatistics === 'function') {
    return statisticsCollector.getRequiredStatistics();
  }
  
  // 兼容旧版本格式
  const { statistics } = context;
  const processingTime = statistics.endTime && statistics.startTime 
    ? statistics.endTime - statistics.startTime 
    : 0;
  
  return {
    total: statistics.nodes || 0,
    unchanged: 0,
    modified: 0,
    added: 0,
    deleted: 0,
    ignored: 0
  };
}

/**
 * 重置引擎状态
 * @param {Object} context - 上下文
 */
function resetEngine(context) {
  resetEngineStatistics(context);
  context.errors = [];
  context.warnings = [];
}

/**
 * 重置引擎统计信息
 * @param {Object} context - 上下文
 */
function resetEngineStatistics(context) {
  context.statistics = {
    comparisons: 0,
    nodes: 0,
    startTime: null,
    endTime: null
  };
}

/**
 * 创建差异上下文
 * @param {Object} config - 配置选项
 * @param {Array|Object} ignoreFields - 忽略字段配置
 * @param {Object} additionalContext - 额外上下文
 * @returns {Object} 差异上下文
 */
function createDiffContext(config = {}, ignoreFields = [], additionalContext = {}) {
  return {
    config,
    ignoreFields,
    statistics: {
      comparisons: 0,
      nodes: 0,
      startTime: null,
      endTime: null
    },
    errors: [],
    warnings: [],
    ...additionalContext
  };
}

/**
 * 验证输入数据
 * @param {any} oldData - 旧数据
 * @param {any} newData - 新数据
 * @param {Object} context - 上下文
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array }
 */
function validateInputData(oldData, newData, context) {
  const errors = [];
  
  // 检查循环引用
  try {
    JSON.stringify(oldData);
  } catch (error) {
    if (error.message.includes('circular')) {
      errors.push('Old data contains circular references');
    }
  }
  
  try {
    JSON.stringify(newData);
  } catch (error) {
    if (error.message.includes('circular')) {
      errors.push('New data contains circular references');
    }
  }
  
  // 检查数据大小（如果配置了限制）
  if (context.config.maxDataSize) {
    const oldSize = getDataSize(oldData);
    const newSize = getDataSize(newData);
    
    if (oldSize > context.config.maxDataSize) {
      errors.push(`Old data size (${oldSize}) exceeds limit (${context.config.maxDataSize})`);
    }
    
    if (newSize > context.config.maxDataSize) {
      errors.push(`New data size (${newSize}) exceeds limit (${context.config.maxDataSize})`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 获取数据大小估算
 * @param {any} data - 数据
 * @returns {number} 大小估算（字节）
 */
function getDataSize(data) {
  try {
    return JSON.stringify(data).length;
  } catch (error) {
    return 0;
  }
}

module.exports = {
  createDiffEngine,
  generateDiffTree,
  postProcessTree,
  createDiffResult,
  createErrorResult,
  getEngineStatistics,
  resetEngine,
  createDiffContext,
  validateInputData,
  getDataSize
};