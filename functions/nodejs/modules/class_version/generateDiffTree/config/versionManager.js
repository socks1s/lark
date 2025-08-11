/**
 * 版本管理模块
 * 负责差异树版本信息的管理和生成
 */

const CURRENT_VERSION = "1.0.0";

/**
 * 获取最新版本
 * @returns {string} 最新版本号
 */
function getLatestVersion() {
  return CURRENT_VERSION;
}

/**
 * 获取指定版本的差异树
 * @param {string} versionId - 版本标识
 * @returns {Object} 版本信息对象
 */
function getDiffTreeVersion(versionId) {
  // 当前实现只支持单一版本，后续可扩展
  if (versionId === CURRENT_VERSION || versionId === "latest") {
    return {
      version: CURRENT_VERSION,
      releaseDate: "2024-01-01",
      features: [
        "基础差异树生成",
        "状态传导机制",
        "忽略字段支持",
        "性能优化"
      ],
      compatibility: "1.x"
    };
  }
  
  throw new Error(`Unsupported version: ${versionId}`);
}

/**
 * 生成版本信息
 * @returns {Object} 版本信息对象
 */
function generateVersionInfo() {
  return {
    version: CURRENT_VERSION,
    timestamp: new Date().toISOString(),
    build: process.env.BUILD_NUMBER || "dev",
    commit: process.env.GIT_COMMIT || "unknown"
  };
}

module.exports = {
  getLatestVersion,
  getDiffTreeVersion,
  generateVersionInfo
};