/**
 * 路径处理工具模块
 * 提供路径构建、解析和验证功能
 */

/**
 * 构建路径
 * @param {string} parentPath - 父级路径
 * @param {string|number} key - 当前键名或数组索引
 * @param {boolean} isArrayIndex - 是否为数组索引
 * @returns {string} 完整路径
 */
function buildPath(parentPath, key, isArrayIndex = false) {
  if (!parentPath || parentPath === 'root') {
    return isArrayIndex ? `[${key}]` : String(key);
  }
  
  if (isArrayIndex) {
    return `${parentPath}[${key}]`;
  }
  
  return `${parentPath}.${key}`;
}

/**
 * 解析路径
 * @param {string} path - 要解析的路径
 * @returns {Array} 路径段数组
 */
function parsePath(path) {
  if (!path || path === 'root') {
    return [];
  }
  
  const segments = [];
  let current = '';
  let inBrackets = false;
  
  for (let i = 0; i < path.length; i++) {
    const char = path[i];
    
    if (char === '[') {
      if (current) {
        segments.push(current);
        current = '';
      }
      inBrackets = true;
    } else if (char === ']') {
      if (inBrackets && current) {
        segments.push(parseInt(current, 10));
        current = '';
      }
      inBrackets = false;
    } else if (char === '.' && !inBrackets) {
      if (current) {
        segments.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    segments.push(current);
  }
  
  return segments;
}

/**
 * 验证路径有效性
 * @param {string} path - 要验证的路径
 * @returns {boolean} 路径是否有效
 */
function isValidPath(path) {
  if (typeof path !== 'string') {
    return false;
  }
  
  if (path === 'root' || path === '') {
    return true;
  }
  
  // 简单的路径格式验证
  const pathRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\d+\])*$/;
  return pathRegex.test(path);
}

/**
 * 获取路径的父路径
 * @param {string} path - 完整路径
 * @returns {string} 父路径
 */
function getParentPath(path) {
  if (!path || path === 'root') {
    return '';
  }
  
  const lastDotIndex = path.lastIndexOf('.');
  const lastBracketIndex = path.lastIndexOf('[');
  
  if (lastDotIndex === -1 && lastBracketIndex === -1) {
    return 'root';
  }
  
  const splitIndex = Math.max(lastDotIndex, lastBracketIndex);
  
  if (splitIndex === lastBracketIndex) {
    // 处理数组索引情况
    const beforeBracket = path.substring(0, lastBracketIndex);
    return beforeBracket || 'root';
  }
  
  return path.substring(0, lastDotIndex);
}

/**
 * 获取路径的最后一个键
 * @param {string} path - 完整路径
 * @returns {string|number} 最后一个键
 */
function getLastKey(path) {
  if (!path || path === 'root') {
    return 'root';
  }
  
  const segments = parsePath(path);
  return segments[segments.length - 1];
}

/**
 * 判断路径是否为数组索引路径
 * @param {string} path - 路径
 * @returns {boolean} 是否为数组索引路径
 */
function isArrayIndexPath(path) {
  return path && path.includes('[') && path.includes(']');
}

/**
 * 规范化路径格式
 * @param {string} path - 原始路径
 * @returns {string} 规范化后的路径
 */
function normalizePath(path) {
  if (!path) return 'root';
  if (path === 'root') return 'root';
  
  // 移除开头的点号
  let normalized = path.replace(/^\.+/, '');
  
  // 确保路径格式正确
  return normalized || 'root';
}

module.exports = {
  buildPath,
  parsePath,
  isValidPath,
  getParentPath,
  getLastKey,
  isArrayIndexPath,
  normalizePath
};