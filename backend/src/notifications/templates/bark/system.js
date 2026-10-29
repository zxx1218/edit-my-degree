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
 * @param {boolean} options.clusterMode - 是否为集群模式
 * @param {string} options.instances - 集群节点数量
 * @returns {Object} 通知对象
 */
function getStartupNotification({ hostname, port, env, startTime, clusterMode, instances }) {
  const mode = clusterMode ? `PM2集群(${instances}节点)` : '单进程';
  return {
    title: clusterMode ? `🚀 服务已重启 (${instances}节点全部就绪)` : '🚀 后端服务启动成功',
    body: `主机: ${hostname}:${port} | 环境: ${env} | 模式: ${mode}\n启动时间: ${startTime}${clusterMode ? '\n注: 仅主节点发送通知，避免重复推送' : ''}`,
    group: '系统消息',
    level: 'active',
    sound: 'paymentsuccess'
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
  const body = reason ? `主机: ${hostname}\n原因: ${reason} | 时间: ${shutdownTime}` : `主机: ${hostname}\n时间: ${shutdownTime}`;
  return {
    title: '⛔ 后端服务已关闭',
    body,
    group: '系统消息',
    level: 'passive',
    sound: 'paymentsuccess'
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
    body: `主机: ${hostname}\n错误: ${error}\n时间: ${timestamp}`,
    group: '系统消息',
    level: 'critical',
    sound: 'bell'
  };
}

/**
 * 获取每日收入日报通知模板
 * @param {Object} options - 配置选项
 * @param {string} options.date - 统计日期
 * @param {number} options.totalCards - 总卡密数
 * @param {number} options.totalIncome - 总收入（元）
 * @param {Array} options.breakdown - 分类明细
 * @returns {Object} 通知对象
 */
function getDailyIncomeReport({ date, totalCards, totalIncome, breakdown }) {
  const details = breakdown.map(b => `${b.label}:${b.count}张/¥${b.subtotal}`).join(' | ');
  return {
    title: `📊 收入日报 ${date}`,
    body: `${details}\n总计: ${totalCards}张 ¥${totalIncome}`,
    group: '系统消息',
    level: 'active',
    sound: 'paymentsuccess'
  };
}

module.exports = {
  getStartupNotification,
  getShutdownNotification,
  getDatabaseErrorNotification,
  getDailyIncomeReport
};
