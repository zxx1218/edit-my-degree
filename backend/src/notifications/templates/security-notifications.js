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
  const user = username ? `, 用户: ${username}` : '';
  
  return {
    title: '🛡️ IP黑名单拦截',
    body: `IP: ${ip}${user}\n操作: ${action}\n时间: ${timestamp}`,
    subtitle: '安全告警',
    group: '安全告警',
    level: 'critical',
    sound: 'alarm'
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
    body: `用户: ${username}\n原因: ${reason}\n封禁至: ${blockedUntil}\n时间: ${timestamp}`,
    subtitle: '安全告警',
    group: '安全告警',
    level: 'critical',
    sound: 'alarm'
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
    title: '⚠️ 异常登录行为检测',
    body: `IP: ${ip}\n用户: ${username}\n尝试次数: ${attempts}\n时间: ${timestamp}`,
    subtitle: '安全告警',
    group: '安全告警',
    level: 'active',
    sound: 'alarm'
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
    body: `IP: ${ip}\n用户: ${username}\n失败次数: ${failedAttempts}\n时间: ${timestamp}`,
    subtitle: '安全告警',
    group: '安全告警',
    level: 'active',
    sound: 'alarm'
  };
}

module.exports = {
  getIpBlacklistBlockNotification,
  getUserBlacklistBlockNotification,
  getSuspiciousLoginNotification,
  getFailedLoginNotification
};
