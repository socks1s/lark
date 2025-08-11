/**
 * 状态传播模块
 * 负责在差异树中传播和计算节点状态
 */

/**
 * 状态优先级映射
 * 数值越高，优先级越高
 */
const STATUS_PRIORITY = {
  'ignored': 0,
  'unchanged': 1,
  'deleted': 2,
  'added': 2,
  'modified': 3
};

/**
 * 传播子节点状态到父节点
 * @param {Object} parentNode - 父节点
 * @param {Object} childrenNodes - 子节点对象
 * @returns {string} 计算后的父节点状态
 */
function propagateChildrenStatus(parentNode, childrenNodes) {
  if (!childrenNodes || Object.keys(childrenNodes).length === 0) {
    return parentNode.status || 'unchanged';
  }
  
  const childStatuses = Object.values(childrenNodes).map(child => child.status);
  return calculateCombinedStatus(childStatuses);
}

/**
 * 计算组合状态
 * @param {Array<string>} statuses - 状态数组
 * @returns {string} 组合后的状态
 */
function calculateCombinedStatus(statuses) {
  if (!statuses || statuses.length === 0) {
    return 'unchanged';
  }
  
  // 找到优先级最高的状态
  let highestPriority = -1;
  let resultStatus = 'unchanged';
  
  for (const status of statuses) {
    const priority = STATUS_PRIORITY[status] || 0;
    if (priority > highestPriority) {
      highestPriority = priority;
      resultStatus = status;
    }
  }
  
  return resultStatus;
}

/**
 * 更新节点状态
 * @param {Object} node - 要更新的节点
 * @param {string} newStatus - 新状态
 * @param {Object} context - 上下文对象
 * @returns {Object} 更新后的节点
 */
function updateNodeStatus(node, newStatus, context = {}) {
  const updatedNode = { ...node };
  updatedNode.status = newStatus;
  
  // 记录状态变更历史（如果需要）
  if (context.trackStatusChanges) {
    if (!updatedNode.statusHistory) {
      updatedNode.statusHistory = [];
    }
    updatedNode.statusHistory.push({
      from: node.status,
      to: newStatus,
      timestamp: new Date().toISOString()
    });
  }
  
  return updatedNode;
}

/**
 * 递归传播状态
 * @param {Object} node - 根节点
 * @param {Object} context - 上下文对象
 * @returns {Object} 状态传播后的节点树
 */
function propagateStatusRecursively(node, context = {}) {
  if (!node.children || Object.keys(node.children).length === 0) {
    return node;
  }
  
  // 首先递归处理所有子节点
  const updatedChildren = {};
  for (const [key, childNode] of Object.entries(node.children)) {
    updatedChildren[key] = propagateStatusRecursively(childNode, context);
  }
  
  // 计算当前节点的状态
  const childStatuses = Object.values(updatedChildren).map(child => child.status);
  const propagatedStatus = calculateCombinedStatus(childStatuses);
  
  // 更新当前节点
  const updatedNode = {
    ...node,
    children: updatedChildren,
    status: propagatedStatus
  };
  
  return updatedNode;
}

/**
 * 检查状态是否需要传播
 * @param {string} currentStatus - 当前状态
 * @param {string} newStatus - 新状态
 * @returns {boolean} 是否需要传播
 */
function shouldPropagateStatus(currentStatus, newStatus) {
  const currentPriority = STATUS_PRIORITY[currentStatus] || 0;
  const newPriority = STATUS_PRIORITY[newStatus] || 0;
  
  return newPriority > currentPriority;
}

/**
 * 获取状态优先级
 * @param {string} status - 状态
 * @returns {number} 优先级数值
 */
function getStatusPriority(status) {
  return STATUS_PRIORITY[status] || 0;
}

/**
 * 比较两个状态的优先级
 * @param {string} status1 - 状态1
 * @param {string} status2 - 状态2
 * @returns {number} 比较结果 (-1, 0, 1)
 */
function compareStatusPriority(status1, status2) {
  const priority1 = getStatusPriority(status1);
  const priority2 = getStatusPriority(status2);
  
  if (priority1 < priority2) return -1;
  if (priority1 > priority2) return 1;
  return 0;
}

/**
 * 验证状态值
 * @param {string} status - 要验证的状态
 * @returns {boolean} 是否为有效状态
 */
function isValidStatus(status) {
  return status in STATUS_PRIORITY;
}

/**
 * 获取所有有效状态
 * @returns {Array<string>} 有效状态数组
 */
function getValidStatuses() {
  return Object.keys(STATUS_PRIORITY);
}

/**
 * 重置节点状态为默认值
 * @param {Object} node - 要重置的节点
 * @param {string} defaultStatus - 默认状态
 * @returns {Object} 重置后的节点
 */
function resetNodeStatus(node, defaultStatus = 'unchanged') {
  const resetNode = { ...node };
  resetNode.status = defaultStatus;
  
  // 递归重置子节点
  if (resetNode.children) {
    const resetChildren = {};
    for (const [key, childNode] of Object.entries(resetNode.children)) {
      resetChildren[key] = resetNodeStatus(childNode, defaultStatus);
    }
    resetNode.children = resetChildren;
  }
  
  return resetNode;
}

module.exports = {
  propagateChildrenStatus,
  calculateCombinedStatus,
  updateNodeStatus,
  propagateStatusRecursively,
  shouldPropagateStatus,
  getStatusPriority,
  compareStatusPriority,
  isValidStatus,
  getValidStatuses,
  resetNodeStatus,
  STATUS_PRIORITY
};