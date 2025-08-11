/**
 * 文本处理工具模块
 * 提供文本处理、格式化和标准化功能
 */

/**
 * 处理文本
 * @param {string} text - 要处理的文本
 * @param {Object} options - 处理选项
 * @param {boolean} [options.trim=true] - 是否去除首尾空格
 * @param {boolean} [options.normalize=true] - 是否标准化处理
 * @returns {string} 处理后的文本
 */
function processText(text, options = {}) {
  if (typeof text !== 'string') {
    return String(text);
  }
  
  let processed = text;
  
  // 去除首尾空格
  if (options.trim !== false) {
    processed = processed.trim();
  }
  
  // 标准化处理
  if (options.normalize !== false) {
    processed = normalizeString(processed);
  }
  
  return processed;
}

/**
 * 标准化字符串
 * @param {string} str - 要标准化的字符串
 * @returns {string} 标准化后的字符串
 */
function normalizeString(str) {
  if (typeof str !== 'string') {
    return String(str);
  }
  
  return str
    .replace(/\s+/g, ' ')  // 将多个空白字符替换为单个空格
    .replace(/\r\n/g, '\n')  // 统一换行符
    .replace(/\r/g, '\n')    // 统一换行符
    .trim();
}

/**
 * 截断字符串
 * @param {string} str - 要截断的字符串
 * @param {number} maxLength - 最大长度
 * @param {string} [suffix='...'] - 截断后缀
 * @returns {string} 截断后的字符串
 */
function truncateString(str, maxLength, suffix = '...') {
  if (typeof str !== 'string') {
    str = String(str);
  }
  
  if (str.length <= maxLength) {
    return str;
  }
  
  const truncateLength = maxLength - suffix.length;
  return str.substring(0, truncateLength) + suffix;
}

/**
 * 转义特殊字符
 * @param {string} str - 要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeSpecialChars(str) {
  if (typeof str !== 'string') {
    return String(str);
  }
  
  return str
    .replace(/\\/g, '\\\\')  // 转义反斜杠
    .replace(/"/g, '\\"')    // 转义双引号
    .replace(/'/g, "\\'")    // 转义单引号
    .replace(/\n/g, '\\n')   // 转义换行符
    .replace(/\r/g, '\\r')   // 转义回车符
    .replace(/\t/g, '\\t');  // 转义制表符
}

/**
 * 格式化复杂值为字符串
 * @param {any} value - 要格式化的值
 * @param {number} maxLength - 最大长度
 * @returns {string} 格式化后的字符串
 */
function formatComplexValue(value, maxLength = 100) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  let formatted;
  
  try {
    if (typeof value === 'object') {
      formatted = JSON.stringify(value);
    } else {
      formatted = String(value);
    }
  } catch (error) {
    formatted = '[Object]';
  }
  
  return truncateString(formatted, maxLength);
}

/**
 * 检查字符串是否为空或只包含空白字符
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否为空白字符串
 */
function isBlankString(str) {
  return typeof str === 'string' && str.trim().length === 0;
}

/**
 * 比较两个字符串（支持标准化比较）
 * @param {string} str1 - 第一个字符串
 * @param {string} str2 - 第二个字符串
 * @param {boolean} normalized - 是否进行标准化比较
 * @returns {boolean} 是否相等
 */
function compareStrings(str1, str2, normalized = true) {
  if (str1 === str2) return true;
  
  if (normalized) {
    return normalizeString(str1) === normalizeString(str2);
  }
  
  return false;
}

/**
 * 将值转换为显示字符串
 * @param {any} value - 要转换的值
 * @param {string} fieldType - 字段类型
 * @returns {string} 显示字符串
 */
function toDisplayString(value, fieldType) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (value === '') return '""';
  
  switch (fieldType) {
    case 'string':
      return `"${value}"`;
    case 'number':
    case 'boolean':
      return String(value);
    case 'array':
      return `[Array(${value.length})]`;
    case 'object':
      const keys = Object.keys(value);
      return `{Object(${keys.length} keys)}`;
    default:
      return String(value);
  }
}

module.exports = {
  processText,
  normalizeString,
  truncateString,
  escapeSpecialChars,
  formatComplexValue,
  isBlankString,
  compareStrings,
  toDisplayString
};