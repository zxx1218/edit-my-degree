/**
 * 充值相关通知模板
 * 包含登录次数充值、PDF积分充值等通知
 */

/**
 * 获取登录次数充值成功通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.username - 用户名
 * @param {number} options.cardValues - 充值数量
 * @param {number} options.remainingLogins - 剩余登录次数
 * @param {string} options.timestamp - 充值时间
 * @returns {Object} 通知对象
 */
function getLoginRechargeNotification({ username, cardValues, remainingLogins, timestamp }) {
  return {
    title: '💳 登录次数充值成功',
    body: `用户 ${username} 成功充值 ${cardValues} 次登录次数\n当前剩余: ${remainingLogins} 次`,
    subtitle: `充值时间: ${timestamp}`,
    group: '学位管理系统充值通知',
    level: 'active',
    sound: 'minuet'
  };
}

/**
 * 获取PDF积分充值成功通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.username - 用户名
 * @param {number} options.cardValues - 充值数量
 * @param {number} options.remainingPdfLimit - 剩余PDF积分
 * @param {string} options.timestamp - 充值时间
 * @returns {Object} 通知对象
 */
function getPdfRechargeNotification({ username, cardValues, remainingPdfLimit, timestamp }) {
  return {
    title: '📑 PDF积分充值成功',
    body: `用户 ${username} 成功充值 ${cardValues} PDF积分\n当前剩余: ${remainingPdfLimit} 分`,
    subtitle: `充值时间: ${timestamp}`,
    group: '学位管理系统充值通知',
    level: 'active',
    sound: 'minuet'
  };
}

/**
 * 根据充值类型获取通用充值通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.username - 用户名
 * @param {string} options.cardType - 充值类型 (login/pdf)
 * @param {number} options.cardValues - 充值数量
 * @param {number} options.remainingLogins - 剩余登录次数
 * @param {number} options.remainingPdfLimit - 剩余PDF积分
 * @param {string} [options.timestamp] - 充值时间（可选，默认当前时间）
 * @returns {Object} 通知对象
 */
function getRechargeNotification({ 
  username, 
  cardType, 
  cardValues, 
  remainingLogins, 
  remainingPdfLimit,
  timestamp = new Date().toLocaleString('zh-CN')
}) {
  if (cardType === 'login') {
    return getLoginRechargeNotification({
      username,
      cardValues,
      remainingLogins,
      timestamp
    });
  } else if (cardType === 'pdf') {
    return getPdfRechargeNotification({
      username,
      cardValues,
      remainingPdfLimit,
      timestamp
    });
  } else {
    // 未知类型的通用通知
    return {
      title: '💰 充值成功',
      body: `用户 ${username} 成功充值 ${cardValues} ${cardType}`,
      subtitle: `充值时间: ${timestamp}`,
      group: '学位管理系统充值通知',
      level: 'active',
      sound: 'minuet'
    };
  }
}

module.exports = {
  getLoginRechargeNotification,
  getPdfRechargeNotification,
  getRechargeNotification
};
