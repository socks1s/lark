/**
 * 配置管理模块
 * 负责配置的合并、验证和默认值管理
 */

/**
 * 获取默认配置
 * @returns {Object} 默认配置对象
 */
function getDefaultConfig() {
  return {
    maxStringLength: 100,
    arrayOptimization: "shallow",
    stringComparison: "normalized",
    includeUnchanged: true,
    enableDiagnostics: true,
    performanceTracking: true
  };
}

/**
 * 合并配置
 * @param {Object} defaultConfig - 默认配置
 * @param {Object} userConfig - 用户配置
 * @returns {Object} 合并后的配置
 */
function mergeConfig(defaultConfig, userConfig) {
  const merged = { ...defaultConfig };
  
  // 合并用户配置，只覆盖有效的配置项
  for (const [key, value] of Object.entries(userConfig)) {
    if (key in defaultConfig && value !== undefined) {
      merged[key] = value;
    }
  }
  
  return merged;
}

/**
 * 验证配置
 * @param {Object} config - 要验证的配置
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array }
 */
function validateConfig(config) {
  const errors = [];
  
  // 验证maxStringLength
  if (typeof config.maxStringLength !== 'number' || 
      config.maxStringLength < 1 || 
      !Number.isInteger(config.maxStringLength)) {
    errors.push('maxStringLength must be a positive integer');
  }
  
  // 验证arrayOptimization
  if (!['shallow', 'deep'].includes(config.arrayOptimization)) {
    errors.push('arrayOptimization must be "shallow" or "deep"');
  }
  
  // 验证stringComparison
  if (!['normalized', 'strict'].includes(config.stringComparison)) {
    errors.push('stringComparison must be "normalized" or "strict"');
  }
  
  // 验证布尔值配置
  const booleanConfigs = ['includeUnchanged', 'enableDiagnostics', 'performanceTracking'];
  for (const key of booleanConfigs) {
    if (typeof config[key] !== 'boolean') {
      errors.push(`${key} must be a boolean`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  getDefaultConfig,
  mergeConfig,
  validateConfig
};