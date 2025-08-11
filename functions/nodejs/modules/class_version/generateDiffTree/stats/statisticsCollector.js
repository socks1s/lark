/**
 * 统计信息收集器模块
 * 负责收集和分析差异树生成过程中的各种统计信息
 */

/**
 * 创建统计收集器实例
 * @param {Object} options - 收集器选项
 * @returns {Object} 统计收集器实例
 */
function createStatisticsCollector(options = {}) {
  const stats = {
    // 基础统计
    totalNodes: 0,
    totalComparisons: 0,
    
    // 状态统计
    statusCounts: {
      unchanged: 0,
      modified: 0,
      added: 0,
      deleted: 0,
      ignored: 0
    },
    
    // 类型统计
    typeCounts: {
      object: 0,
      array: 0,
      string: 0,
      number: 0,
      boolean: 0,
      null: 0,
      undefined: 0,
      date: 0,
      regexp: 0,
      mixed: 0,
      unknown: 0
    },
    
    // 性能统计
    performance: {
      startTime: null,
      endTime: null,
      processingTime: 0,
      memoryUsage: null
    },
    
    // 深度统计
    depth: {
      maxDepth: 0,
      averageDepth: 0,
      depthDistribution: {}
    },
    
    // 错误和警告
    diagnostics: {
      errors: [],
      warnings: [],
      errorCount: 0,
      warningCount: 0
    },
    
    // 自定义统计
    custom: {}
  };
  
  return {
    // 基础操作
    recordNode: (node, depth = 0) => recordNode(stats, node, depth),
    recordComparison: () => recordComparison(stats),
    recordError: (error, path) => recordError(stats, error, path),
    recordWarning: (warning, path) => recordWarning(stats, warning, path),
    
    // 性能记录
    startTiming: () => startTiming(stats),
    endTiming: () => endTiming(stats),
    recordMemoryUsage: () => recordMemoryUsage(stats),
    
    // 自定义统计
    recordCustom: (key, value) => recordCustom(stats, key, value),
    incrementCustom: (key, amount = 1) => incrementCustom(stats, key, amount),
    
    // 获取统计
    getStatistics: () => getStatistics(stats),
    getSummary: () => getSummary(stats),
    getDetailedReport: () => getDetailedReport(stats),
    getRequiredStatistics: () => getRequiredStatistics(stats),
    
    // 重置
    reset: () => resetStatistics(stats)
  };
}

/**
 * 记录节点信息
 * @param {Object} stats - 统计对象
 * @param {Object} node - 节点对象
 * @param {number} depth - 节点深度
 */
function recordNode(stats, node, depth = 0) {
  stats.totalNodes++;
  
  // 记录状态
  if (node.status && stats.statusCounts.hasOwnProperty(node.status)) {
    stats.statusCounts[node.status]++;
  }
  
  // 记录类型
  if (node.fieldType && stats.typeCounts.hasOwnProperty(node.fieldType)) {
    stats.typeCounts[node.fieldType]++;
  }
  
  // 记录深度
  stats.depth.maxDepth = Math.max(stats.depth.maxDepth, depth);
  
  if (!stats.depth.depthDistribution[depth]) {
    stats.depth.depthDistribution[depth] = 0;
  }
  stats.depth.depthDistribution[depth]++;
  
  // 递归记录子节点
  if (node.children) {
    for (const childNode of Object.values(node.children)) {
      recordNode(stats, childNode, depth + 1);
    }
  }
}

/**
 * 记录比较操作
 * @param {Object} stats - 统计对象
 */
function recordComparison(stats) {
  stats.totalComparisons++;
}

/**
 * 记录错误
 * @param {Object} stats - 统计对象
 * @param {Error|string} error - 错误对象或消息
 * @param {string} path - 错误路径
 */
function recordError(stats, error, path = '') {
  const errorRecord = {
    message: typeof error === 'string' ? error : error.message,
    path,
    timestamp: new Date().toISOString(),
    type: typeof error === 'object' ? error.constructor.name : 'Error'
  };
  
  stats.diagnostics.errors.push(errorRecord);
  stats.diagnostics.errorCount++;
}

/**
 * 记录警告
 * @param {Object} stats - 统计对象
 * @param {string} warning - 警告消息
 * @param {string} path - 警告路径
 */
function recordWarning(stats, warning, path = '') {
  const warningRecord = {
    message: warning,
    path,
    timestamp: new Date().toISOString()
  };
  
  stats.diagnostics.warnings.push(warningRecord);
  stats.diagnostics.warningCount++;
}

/**
 * 开始计时
 * @param {Object} stats - 统计对象
 */
function startTiming(stats) {
  stats.performance.startTime = Date.now();
}

/**
 * 结束计时
 * @param {Object} stats - 统计对象
 */
function endTiming(stats) {
  stats.performance.endTime = Date.now();
  if (stats.performance.startTime) {
    stats.performance.processingTime = stats.performance.endTime - stats.performance.startTime;
  }
}

/**
 * 记录内存使用情况
 * @param {Object} stats - 统计对象
 */
function recordMemoryUsage(stats) {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    stats.performance.memoryUsage = process.memoryUsage();
  }
}

/**
 * 记录自定义统计
 * @param {Object} stats - 统计对象
 * @param {string} key - 统计键
 * @param {any} value - 统计值
 */
function recordCustom(stats, key, value) {
  stats.custom[key] = value;
}

/**
 * 增加自定义计数
 * @param {Object} stats - 统计对象
 * @param {string} key - 统计键
 * @param {number} amount - 增加数量
 */
function incrementCustom(stats, key, amount = 1) {
  if (!stats.custom[key]) {
    stats.custom[key] = 0;
  }
  stats.custom[key] += amount;
}

/**
 * 获取完整统计信息
 * @param {Object} stats - 统计对象
 * @returns {Object} 统计信息
 */
function getStatistics(stats) {
  // 计算平均深度
  const totalDepthSum = Object.entries(stats.depth.depthDistribution)
    .reduce((sum, [depth, count]) => sum + (parseInt(depth) * count), 0);
  stats.depth.averageDepth = stats.totalNodes > 0 ? totalDepthSum / stats.totalNodes : 0;
  
  return JSON.parse(JSON.stringify(stats));
}

/**
 * 获取统计摘要
 * @param {Object} stats - 统计对象
 * @returns {Object} 统计摘要
 */
function getSummary(stats) {
  const totalChanges = stats.statusCounts.modified + stats.statusCounts.added + stats.statusCounts.deleted;
  const changePercentage = stats.totalNodes > 0 ? (totalChanges / stats.totalNodes * 100).toFixed(2) : 0;
  
  return {
    totalNodes: stats.totalNodes,
    totalComparisons: stats.totalComparisons,
    totalChanges,
    changePercentage: parseFloat(changePercentage),
    processingTime: stats.performance.processingTime,
    maxDepth: stats.depth.maxDepth,
    averageDepth: parseFloat(stats.depth.averageDepth.toFixed(2)),
    hasErrors: stats.diagnostics.errorCount > 0,
    hasWarnings: stats.diagnostics.warningCount > 0,
    errorCount: stats.diagnostics.errorCount,
    warningCount: stats.diagnostics.warningCount
  };
}

/**
 * 获取详细报告
 * @param {Object} stats - 统计对象
 * @returns {Object} 详细报告
 */
function getDetailedReport(stats) {
  const summary = getSummary(stats);
  const fullStats = getStatistics(stats);
  
  return {
    summary,
    details: {
      statusBreakdown: fullStats.statusCounts,
      typeBreakdown: fullStats.typeCounts,
      depthAnalysis: {
        maxDepth: fullStats.depth.maxDepth,
        averageDepth: fullStats.depth.averageDepth,
        distribution: fullStats.depth.depthDistribution
      },
      performance: {
        processingTime: fullStats.performance.processingTime,
        startTime: fullStats.performance.startTime,
        endTime: fullStats.performance.endTime,
        memoryUsage: fullStats.performance.memoryUsage,
        throughput: {
          nodesPerSecond: fullStats.performance.processingTime > 0 
            ? Math.round((fullStats.totalNodes / fullStats.performance.processingTime) * 1000) 
            : 0,
          comparisonsPerSecond: fullStats.performance.processingTime > 0 
            ? Math.round((fullStats.totalComparisons / fullStats.performance.processingTime) * 1000) 
            : 0
        }
      },
      diagnostics: fullStats.diagnostics,
      custom: fullStats.custom
    },
    recommendations: generateRecommendations(fullStats)
  };
}

/**
 * 生成性能建议
 * @param {Object} stats - 统计对象
 * @returns {Array} 建议列表
 */
function generateRecommendations(stats) {
  const recommendations = [];
  
  // 性能建议
  if (stats.performance.processingTime > 5000) {
    recommendations.push({
      type: 'performance',
      message: 'Processing time is high. Consider using array optimization or reducing data size.',
      severity: 'warning'
    });
  }
  
  // 深度建议
  if (stats.depth.maxDepth > 10) {
    recommendations.push({
      type: 'structure',
      message: 'Data structure is deeply nested. This may impact performance.',
      severity: 'info'
    });
  }
  
  // 错误建议
  if (stats.diagnostics.errorCount > 0) {
    recommendations.push({
      type: 'reliability',
      message: 'Errors were encountered during processing. Check diagnostics for details.',
      severity: 'error'
    });
  }
  
  // 变更建议
  const changePercentage = (stats.statusCounts.modified + stats.statusCounts.added + stats.statusCounts.deleted) / stats.totalNodes * 100;
  if (changePercentage > 80) {
    recommendations.push({
      type: 'analysis',
      message: 'High percentage of changes detected. Consider if this is expected.',
      severity: 'info'
    });
  }
  
  return recommendations;
}

/**
 * 重置统计信息
 * @param {Object} stats - 统计对象
 */
function resetStatistics(stats) {
  stats.totalNodes = 0;
  stats.totalComparisons = 0;
  
  Object.keys(stats.statusCounts).forEach(key => {
    stats.statusCounts[key] = 0;
  });
  
  Object.keys(stats.typeCounts).forEach(key => {
    stats.typeCounts[key] = 0;
  });
  
  stats.performance = {
    startTime: null,
    endTime: null,
    processingTime: 0,
    memoryUsage: null
  };
  
  stats.depth = {
    maxDepth: 0,
    averageDepth: 0,
    depthDistribution: {}
  };
  
  stats.diagnostics = {
    errors: [],
    warnings: [],
    errorCount: 0,
    warningCount: 0
  };
  
  stats.custom = {};
}

/**
 * 获取符合需求规范的统计信息格式
 * @param {Object} stats - 统计对象
 * @returns {Object} 符合需求规范的统计信息
 */
function getRequiredStatistics(stats) {
  return {
    total: stats.totalNodes,
    unchanged: stats.statusCounts.unchanged,
    modified: stats.statusCounts.modified,
    added: stats.statusCounts.added,
    deleted: stats.statusCounts.deleted,
    ignored: stats.statusCounts.ignored
  };
}

module.exports = {
  createStatisticsCollector,
  recordNode,
  recordComparison,
  recordError,
  recordWarning,
  startTiming,
  endTiming,
  recordMemoryUsage,
  recordCustom,
  incrementCustom,
  getStatistics,
  getSummary,
  getDetailedReport,
  getRequiredStatistics,
  generateRecommendations,
  resetStatistics
};