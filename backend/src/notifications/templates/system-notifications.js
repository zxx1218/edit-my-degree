/**
 * 系统级通知模板
 * 包含服务启动、关闭等系统生命周期相关的通知
 */

/**
 * 获取服务启动通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.hostname - 主机名
 * @param {number} options.port - 端口号
 * @param {string} options.env - 运行环境
 * @param {string} options.startTime - 启动时间
 * @returns {Object} 通知对象
 */
function getStartupNotification({ hostname, port, env, startTime }) {
  return {
    title: '🚀 后端服务启动成功',
    body: `主机: ${hostname}\n端口: ${port}\n环境: ${env}\n启动时间: ${startTime}`,
    subtitle: '系统消息',
    group: '系统消息',
    level: 'active',
    sound: 'minuet'
  };
}

/**
 * 获取服务关闭通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.hostname - 主机名
 * @param {string} options.shutdownTime - 关闭时间
 * @param {string} options.reason - 关闭原因（可选）
 * @returns {Object} 通知对象
 */
function getShutdownNotification({ hostname, shutdownTime, reason }) {
  const body = `主机: ${hostname}\n关闭时间: ${shutdownTime}${reason ? `\n原因: ${reason}` : ''}`;
  
  return {
    title: '⛔ 后端服务已关闭',
    body,
    subtitle: '系统消息',
    group: '系统消息',
    level: 'passive',
    sound: 'minuet'
  };
}

/**
 * 获取数据库连接异常通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.hostname - 主机名
 * @param {string} options.error - 错误信息
 * @param {string} options.timestamp - 发生时间
 * @returns {Object} 通知对象
 */
function getDatabaseErrorNotification({ hostname, error, timestamp }) {
  return {
    title: '❌ 数据库连接异常',
    body: `主机: ${hostname}\n时间: ${timestamp}\n错误: ${error}`,
    subtitle: '系统告警',
    group: '系统消息',
    level: 'critical',
    sound: 'alarm'
  };
}

module.exports = {
  getStartupNotification,
  getShutdownNotification,
  getDatabaseErrorNotification
};
