/**
 * 操作日志记录模块
 * 用于记录用户的各种操作，直接写入日志文件
 */
const logger = require('./logger');

/**
 * 记录登录日志
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 * @param {string} result - 操作结果
 */
function logLogin(userId, username, ipAddress, userAgent, result = 'success') {
  logger.info(`用户登录 - 用户ID: ${userId}, 用户名: ${username}, IP地址: ${ipAddress}, 用户代理: ${userAgent}, 结果: ${result}`);
}

/**
 * 记录数据操作日志
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} operationType - 操作类型
 * @param {string} table - 操作的数据表
 * @param {Object} operationData - 操作的数据
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 * @param {string} result - 操作结果
 */
function logOperation(userId, username, operationType, table, operationData, ipAddress, userAgent, result = 'success') {
  logger.info(`数据操作 - 用户ID: ${userId}, 用户名: ${username}, 操作类型: ${operationType}, 操作表: ${table}, 操作数据: ${JSON.stringify(operationData)}, IP地址: ${ipAddress}, 用户代理: ${userAgent}, 结果: ${result}`);
}

/**
 * 记录密码更改日志
 * @param {string} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} ipAddress - IP地址
 * @param {string} userAgent - 用户代理
 * @param {string} result - 操作结果
 */
function logPasswordChange(userId, username, ipAddress, userAgent, result = 'success') {
  logger.info(`密码更改 - 用户ID: ${userId}, 用户名: ${username}, IP地址: ${ipAddress}, 用户代理: ${userAgent}, 结果: ${result}`);
}

module.exports = {
  logLogin,
  logOperation,
  logPasswordChange
};