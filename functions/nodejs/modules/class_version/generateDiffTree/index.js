/**
 * 差异树生成云函数
 * 提供统一的API接口，负责参数验证、配置管理和错误处理
 */

const diffEngine = require('./core/diffEngine');
const configManager = require('./config/configManager');
const statisticsCollector = require('./stats/statisticsCollector');

/**
 * 云函数入口 - 生成差异树
 * @param {Object} params - 输入参数对象
 * @param {Object|Array|any} params.oldData - 变更前的原始数据
 * @param {Object|Array|any} params.newData - 变更后的新数据
 * @param {Array<string>} [params.ignoreFields] - 需要忽略的字段路径数组，如 ["lastUpdateTime", "metadata.timestamp"]
 * @param {Object} [params.options] - 配置选项对象
 * @param {number} [params.options.maxStringLength=100] - 复杂对象值截断长度
 * @param {string} [params.options.arrayOptimization="shallow"] - 数组优化策略
 * @param {string} [params.options.stringComparison="normalized"] - 字符串比较模式
 * @param {Object} context - 云函数上下文对象
 * @param {Object} logger - 日志记录器对象
 * @returns {Object} 完整的差异树对象（包含根节点和元数据）
 */
module.exports = async function (params, context, logger) {
  try {
    logger.info('差异树生成函数开始执行，参数：', JSON.stringify(params));
    
    // 从params中解构获取参数
    const { 
      oldData, 
      newData, 
      ignoreFields = [], 
      options = {} 
    } = params;
    
    // 1. 参数验证
    validateInputs(oldData, newData, ignoreFields, options, logger);
    
    // 2. 配置合并
    const config = configManager.mergeConfig(
      configManager.getDefaultConfig(),
      options
    );
    
    logger.info('使用配置：', JSON.stringify(config));
    
    // 3. 创建统计收集器
    const statsCollector = statisticsCollector.createStatisticsCollector();
    
    // 4. 创建差异引擎（传入统计收集器）
    const engine = diffEngine.createDiffEngine(config, ignoreFields, statsCollector);
    
    // 5. 生成差异树
    logger.info('开始生成差异树...');
    const result = engine.generateDiffTree(oldData, newData);
    
    logger.info('差异树生成完成，统计信息：', JSON.stringify(result.statistics));
    
    // 6. 返回结果
    return {
      success: true,
      ...result
    };
    
  } catch (error) {
    logger.error('差异树生成失败：', error.message);
    
    // 错误处理和异常捕获
    return {
      success: false,
      tree: null,
      metadata: {
        version: require('./config/versionManager').getLatestVersion(),
        timestamp: new Date().toISOString(),
        processingTime: 0
      },
      statistics: {
        total: 0,
        unchanged: 0,
        modified: 0,
        added: 0,
        deleted: 0,
        ignored: 0
      },
      diagnostics: {
        warnings: [],
        errors: [{
          type: "PROCESSING_ERROR",
          message: error.message,
          path: 'root',
          timestamp: new Date().toISOString()
        }],
        hasErrors: true,
        hasWarnings: false
      }
    };
  }
};

/**
 * 验证输入参数
 * @param {any} oldData - 旧数据
 * @param {any} newData - 新数据
 * @param {Array} ignoreFields - 忽略字段数组
 * @param {Object} options - 配置选项
 * @param {Object} logger - 日志记录器
 */
function validateInputs(oldData, newData, ignoreFields, options, logger) {
  logger.info('开始参数验证...');
  
  // 验证oldData和newData是否存在
  if (oldData === undefined) {
    throw new Error('oldData parameter is required');
  }
  
  if (newData === undefined) {
    throw new Error('newData parameter is required');
  }
  
  // 验证ignoreFields是数组
  if (!Array.isArray(ignoreFields)) {
    throw new Error('ignoreFields must be an array');
  }
  
  // 验证ignoreFields中的每个元素都是字符串
  for (const field of ignoreFields) {
    if (typeof field !== 'string') {
      throw new Error('All elements in ignoreFields must be strings');
    }
  }
  
  // 验证options是对象
  if (typeof options !== 'object' || options === null) {
    throw new Error('options must be an object');
  }
  
  // 验证maxStringLength
  if (options.maxStringLength !== undefined && 
      (!Number.isInteger(options.maxStringLength) || options.maxStringLength < 1)) {
    throw new Error('maxStringLength must be a positive integer');
  }
  
  // 验证arrayOptimization
  if (options.arrayOptimization !== undefined && 
      !['shallow', 'deep'].includes(options.arrayOptimization)) {
    throw new Error('arrayOptimization must be "shallow" or "deep"');
  }
  
  // 验证stringComparison
  if (options.stringComparison !== undefined && 
      !['normalized', 'strict'].includes(options.stringComparison)) {
    throw new Error('stringComparison must be "normalized" or "strict"');
  }
  
  logger.info('参数验证通过');
}