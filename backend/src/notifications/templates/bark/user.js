/**
 * 用户相关通知模板
 * 包含用户注册、留言等用户行为相关通知
 */

/**
 * 获取新用户注册通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.username - 用户名
 * @param {string} options.ip - 注册IP
 * @param {string} options.timestamp - 注册时间
 * @returns {Object} 通知对象
 */
function getNewUserRegistrationNotification({ username, ip, timestamp }) {
  return {
    title: '👤 新用户注册',
    body: `用户: ${username}\nIP: ${ip}\n时间: ${timestamp}`,
    subtitle: '用户通知',
    group: '用户通知',
    level: 'passive',
    sound: 'minuet'
  };
}

/**
 * 获取新留言通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.username - 用户名
 * @param {string} options.content - 留言内容（截取前50字符）
 * @param {string} options.ip - 留言IP
 * @param {string} options.timestamp - 留言时间
 * @returns {Object} 通知对象
 */
function getNewMessageNotification({ username, content, ip, timestamp }) {
  const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
  
  return {
    title: '💬 新留言',
    body: `用户: ${username}\n内容: ${preview}\nIP: ${ip}\n时间: ${timestamp}`,
    subtitle: '用户通知',
    group: '用户通知',
    level: 'passive',
    sound: 'minuet'
  };
}

/**
 * 获取密码修改通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.username - 用户名
 * @param {string} options.ip - 操作IP
 * @param {string} options.timestamp - 操作时间
 * @returns {Object} 通知对象
 */
function getPasswordChangeNotification({ username, ip, timestamp }) {
  return {
    title: '🔑 密码修改',
    body: `用户: ${username}\nIP: ${ip}\n时间: ${timestamp}`,
    subtitle: '用户通知',
    group: '用户通知',
    level: 'active',
    sound: 'minuet'
  };
}

module.exports = {
  getNewUserRegistrationNotification,
  getNewMessageNotification,
  getPasswordChangeNotification
};
