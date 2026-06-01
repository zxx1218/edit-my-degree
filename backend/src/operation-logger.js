/**
 * 操作日志记录模块
 * 用于记录用户的各种操作，提供详细的操作追踪
 */
const logger = require('./logger');

/**
 * 格式化请求信息
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 * @returns {string} 格式化的请求信息
 */
function formatRequestInfo(ipAddress, userAgent) {
  return `IP: ${ipAddress}, UA: ${userAgent}`;
}

/**
 * 记录登录日志
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 * @param {string} result - 操作结果
 * @param {Object} extra - 额外信息
 */
function logLogin(userId, username, ipAddress, userAgent, result = 'success', extra = {}) {
  const requestInfo = formatRequestInfo(ipAddress, userAgent);
  const extraInfo = Object.keys(extra).length > 0 ? `, 额外信息: ${JSON.stringify(extra)}` : '';
  
  if (result === 'success') {
    logger.info(`[认证] 用户登录成功 - 用户ID: ${userId}, 用户名: ${username}, ${requestInfo}${extraInfo}`);
  } else {
    logger.warn(`[认证] 用户登录失败 - 用户ID: ${userId || 'N/A'}, 用户名: ${username}, ${requestInfo}, 原因: ${extra.reason || '未知'}${extraInfo}`);
  }
}

/**
 * 记录注册日志
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 * @param {string} result - 操作结果
 * @param {Object} extra - 额外信息
 */
function logRegister(userId, username, ipAddress, userAgent, result = 'success', extra = {}) {
  const requestInfo = formatRequestInfo(ipAddress, userAgent);
  const extraInfo = Object.keys(extra).length > 0 ? `, 额外信息: ${JSON.stringify(extra)}` : '';
  
  if (result === 'success') {
    logger.info(`[认证] 用户注册成功 - 用户ID: ${userId}, 用户名: ${username}, ${requestInfo}${extraInfo}`);
  } else {
    logger.warn(`[认证] 用户注册失败 - 用户名: ${username}, ${requestInfo}, 原因: ${extra.reason || '未知'}${extraInfo}`);
  }
}

/**
 * 记录数据操作日志
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} operationType - 操作类型 (insert/update/delete)
 * @param {string} table - 操作的数据表
 * @param {Object} operationData - 操作的数据
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 * @param {string} result - 操作结果
 * @param {Object} extra - 额外信息
 */
function logOperation(userId, username, operationType, table, operationData, ipAddress, userAgent, result = 'success', extra = {}) {
  const requestInfo = formatRequestInfo(ipAddress, userAgent);
  const recordId = operationData?.id || 'N/A';
  const dataSummary = JSON.stringify(operationData).substring(0, 200); // 限制长度避免日志过大
  const extraInfo = Object.keys(extra).length > 0 ? `, 额外信息: ${JSON.stringify(extra)}` : '';
  
  const actionMap = {
    'insert': '新增',
    'update': '更新',
    'delete': '删除'
  };
  const actionName = actionMap[operationType] || operationType;
  
  if (result === 'success') {
    logger.info(`[数据操作] ${actionName}记录 - 用户ID: ${userId}, 用户名: ${username}, 表名: ${table}, 记录ID: ${recordId}, ${requestInfo}, 数据摘要: ${dataSummary}${extraInfo}`);
  } else {
    logger.error(`[数据操作] ${actionName}记录失败 - 用户ID: ${userId}, 用户名: ${username}, 表名: ${table}, 记录ID: ${recordId}, ${requestInfo}, 错误: ${extra.error || '未知'}${extraInfo}`);
  }
}

/**
 * 记录密码更改日志
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} ipAddress - IP 地址
 * @param {string} userAgent - 用户代理
 * @param {string} result - 操作结果
 * @param {Object} extra - 额外信息
 */
function logPasswordChange(userId, username, ipAddress, userAgent, result = 'success', extra = {}) {
  const requestInfo = formatRequestInfo(ipAddress, userAgent);
  const extraInfo = Object.keys(extra).length > 0 ? `, 额外信息: ${JSON.stringify(extra)}` : '';
  
  if (result === 'success') {
    logger.info(`[安全] 密码修改成功 - 用户ID: ${userId}, 用户名: ${username}, ${requestInfo}${extraInfo}`);
  } else {
    logger.warn(`[安全] 密码修改失败 - 用户ID: ${userId}, 用户名: ${username}, ${requestInfo}, 原因: ${extra.reason || '未知'}${extraInfo}`);
  }
}

/**
 * 记录查询登录次数和 PDF 积分日志
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} ipAddress - IP 地址
 * @param {string} userAgent - 用户代理
 * @param {string} result - 操作结果
 * @param {Object} queryData - 查询的数据（包含剩余登录次数和 PDF 积分）
 */
function logQueryUserLogins(userId, username, ipAddress, userAgent, result = 'success', queryData = null) {
  const requestInfo = formatRequestInfo(ipAddress, userAgent);
  
  let logMessage = `[查询] 查询账户信息 - 用户ID: ${userId}, 用户名: ${username}, ${requestInfo}, 结果: ${result}`;
  if (queryData) {
    logMessage += `, 剩余登录次数: ${queryData.remaining_logins}, PDF 积分: ${queryData.pdf_limit}`;
  }
  
  if (result === 'success') {
    logger.info(logMessage);
  } else {
    logger.warn(logMessage);
  }
}

/**
 * 记录PDF生成日志
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} pdfType - PDF类型
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 * @param {string} result - 操作结果
 * @param {Object} extra - 额外信息
 */
function logPdfGeneration(userId, username, pdfType, ipAddress, userAgent, result = 'success', extra = {}) {
  const requestInfo = formatRequestInfo(ipAddress, userAgent);
  const extraInfo = Object.keys(extra).length > 0 ? `, 额外信息: ${JSON.stringify(extra)}` : '';
  
  if (result === 'success') {
    logger.info(`[PDF生成] 生成${pdfType}PDF成功 - 用户ID: ${userId}, 用户名: ${username}, ${requestInfo}${extraInfo}`);
  } else {
    logger.error(`[PDF生成] 生成${pdfType}PDF失败 - 用户ID: ${userId}, 用户名: ${username}, ${requestInfo}, 原因: ${extra.reason || '未知'}${extraInfo}`);
  }
}

/**
 * 记录管理员操作日志
 * @param {string} adminId - 管理员ID
 * @param {string} adminUsername - 管理员用户名
 * @param {string} operation - 操作描述
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 * @param {string} result - 操作结果
 * @param {Object} extra - 额外信息
 */
function logAdminOperation(adminId, adminUsername, operation, ipAddress, userAgent, result = 'success', extra = {}) {
  const requestInfo = formatRequestInfo(ipAddress, userAgent);
  const extraInfo = Object.keys(extra).length > 0 ? `, 额外信息: ${JSON.stringify(extra)}` : '';
  
  if (result === 'success') {
    logger.info(`[管理员] 管理操作成功 - 管理员ID: ${adminId}, 用户名: ${adminUsername}, 操作: ${operation}, ${requestInfo}${extraInfo}`);
  } else {
    logger.error(`[管理员] 管理操作失败 - 管理员ID: ${adminId}, 用户名: ${adminUsername}, 操作: ${operation}, ${requestInfo}, 原因: ${extra.error || '未知'}${extraInfo}`);
  }
}

/**
 * 记录IP黑名单操作日志
 * @param {string} ipAddress - IP地址
 * @param {string} operation - 操作类型 (blocked/unblocked/checked)
 * @param {string} reason - 原因
 * @param {Object} extra - 额外信息
 */
function logIpBlacklist(ipAddress, operation, reason, extra = {}) {
  const extraInfo = Object.keys(extra).length > 0 ? `, 额外信息: ${JSON.stringify(extra)}` : '';
  const operationMap = {
    'blocked': '加入黑名单',
    'unblocked': '移出黑名单',
    'checked': '检查黑名单状态'
  };
  const operationName = operationMap[operation] || operation;
  
  logger.safe(`[安全防护] IP黑名单 - IP: ${ipAddress}, 操作: ${operationName}, 原因: ${reason}${extraInfo}`);
}

module.exports = {
  logLogin,
  logRegister,
  logOperation,
  logPasswordChange,
  logQueryUserLogins,
  logPdfGeneration,
  logAdminOperation,
  logIpBlacklist
};