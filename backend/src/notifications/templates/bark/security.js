/**
 * 安全告警通知模板
 * 包含IP黑名单、异常登录等安全相关通知
 */

/**
 * 获取IP黑名单拦截通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.ip - IP地址
 * @param {string} options.username - 用户名（可选）
 * @param {string} options.action - 尝试的操作（注册/登录/留言）
 * @param {string} options.timestamp - 发生时间
 * @returns {Object} 通知对象
 */
function getIpBlacklistBlockNotification({ ip, username, action, timestamp }) {
  const user = username ? `用户: ${username}` : '未登录';
  return {
    title: '🛡️ IP黑名单拦截',
    body: `IP: ${ip} | ${user}\n操作: ${action} | 时间: ${timestamp}`,
    group: '安全告警',
    level: 'critical',
    sound: 'bell'
  };
}

/**
 * 获取用户黑名单拦截通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.username - 用户名
 * @param {string} options.reason - 封禁原因
 * @param {string} options.blockedUntil - 封禁截止时间
 * @param {string} options.timestamp - 发生时间
 * @returns {Object} 通知对象
 */
function getUserBlacklistBlockNotification({ username, reason, blockedUntil, timestamp }) {
  return {
    title: '🚫 用户黑名单拦截',
    body: `用户: ${username} | 原因: ${reason}\n封禁至: ${blockedUntil} | 时间: ${timestamp}`,
    group: '安全告警',
    level: 'critical',
    sound: 'bell'
  };
}

/**
 * 获取异常登录行为通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.ip - IP地址
 * @param {string} options.username - 用户名
 * @param {number} options.attempts - 尝试次数
 * @param {string} options.timestamp - 发生时间
 * @returns {Object} 通知对象
 */
function getSuspiciousLoginNotification({ ip, username, attempts, timestamp }) {
  return {
    title: '⚠️ 异常登录行为',
    body: `用户: ${username} | IP: ${ip}\n尝试次数: ${attempts}次 | 时间: ${timestamp}`,
    group: '安全告警',
    level: 'active',
    sound: 'bell'
  };
}

/**
 * 获取多次失败登录通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.ip - IP地址
 * @param {string} options.username - 用户名
 * @param {number} options.failedAttempts - 失败次数
 * @param {string} options.timestamp - 发生时间
 * @returns {Object} 通知对象
 */
function getFailedLoginNotification({ ip, username, failedAttempts, timestamp }) {
  return {
    title: '🔐 多次登录失败',
    body: `用户: ${username} | IP: ${ip}\n失败次数: ${failedAttempts}次 | 时间: ${timestamp}`,
    group: '安全告警',
    level: 'active',
    sound: 'bell'
  };
}

/**
 * 获取IP频率限制封禁通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.ip - IP地址
 * @param {number} options.requestCount - 请求次数
 * @param {number} options.timeWindow - 时间窗口（秒）
 * @param {number} options.maxRequests - 最大允许请求数
 * @param {string} options.blockDuration - 封禁时长（分钟）
 * @param {string} options.timestamp - 发生时间
 * @returns {Object} 通知对象
 */
function getIpRateLimitBlockNotification({ 
  ip, 
  requestCount, 
  timeWindow, 
  maxRequests, 
  blockDuration,
  timestamp 
}) {
  return {
    title: '🚫 IP频率限制封禁',
    body: `IP: ${ip} | 请求: ${requestCount}/${maxRequests}\n窗口: ${timeWindow}秒 | 封禁: ${blockDuration}分钟 | 时间: ${timestamp}`,
    group: '安全告警',
    level: 'critical',
    sound: 'bell'
  };
}

/**
 * 获取频繁密码修改尝试通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.username - 用户名
 * @param {string} options.ip - IP地址
 * @param {number} options.attempts - 尝试次数
 * @param {string} options.timestamp - 发生时间
 * @returns {Object} 通知对象
 */
function getFrequentPasswordChangeNotification({ username, ip, attempts, timestamp }) {
  return {
    title: '⚠️ 频繁密码修改尝试',
    body: `用户: ${username} | IP: ${ip}\n尝试次数: ${attempts}次 | 时间: ${timestamp}`,
    group: '安全告警',
    level: 'critical',
    sound: 'bell'
  };
}

/**
 * 获取IP自动封禁通知模板（因触发错误/警告而自动加入黑名单）
 * @param {Object} options - 配置选项
 * @param {string} options.ip - IP地址
 * @param {string} options.reason - 触发原因（错误/警告描述）
 * @param {string} options.source - 触发来源模块
 * @param {number} options.blockDuration - 封禁时长（分钟）
 * @param {string} options.blockedUntil - 封禁截止时间
 * @param {string} options.timestamp - 发生时间
 * @returns {Object} 通知对象
 */
function getIpAutoBlockNotification({ ip, reason, source, blockDuration, blockedUntil, timestamp }) {
  return {
    title: '🚨 IP自动封禁',
    body: `IP: ${ip} | 来源: ${source}\n原因: ${reason}\n封禁: ${blockDuration}分钟 | 至: ${blockedUntil}`,
    group: '安全告警',
    level: 'critical',
    sound: 'bell'
  };
}

module.exports = {
  getIpBlacklistBlockNotification,
  getUserBlacklistBlockNotification,
  getSuspiciousLoginNotification,
  getFailedLoginNotification,
  getIpRateLimitBlockNotification,
  getFrequentPasswordChangeNotification,
  getIpAutoBlockNotification
};
