/**
 * 用户相关通知模板
 * 包含留言等用户行为相关通知
 */

/**
 * 获取新留言通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.username - 用户名
 * @param {string} options.content - 留言内容（截取前60字符）
 * @param {string} options.ip - 留言IP
 * @param {string} options.timestamp - 留言时间
 * @returns {Object} 通知对象
 */
function getNewMessageNotification({ username, content, ip, timestamp }) {
  const preview = content.length > 60 ? content.substring(0, 60) + '...' : content;
  return {
    title: `💬 新留言`,
    body: `用户: ${username} | IP: ${ip}\n内容: ${preview}`,
    group: '用户通知',
    level: 'passive',
    sound: 'paymentsuccess'
  };
}

module.exports = {
  getNewMessageNotification
};
