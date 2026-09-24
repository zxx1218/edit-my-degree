const dbManager = require('./db-utils');

/**
 * 记录通知历史到数据库
 * @param {Object} params - 通知参数
 * @param {string} params.channel - 通知渠道 ('bark' | 'email')
 * @param {string} params.title - 通知标题
 * @param {string} params.body - 通知正文
 * @param {string} [params.recipient] - 接收者
 * @param {string} [params.group] - 消息分组
 * @param {string} [params.level] - 推送级别
 * @param {string} [params.sound] - 铃声
 * @param {string} params.status - 发送状态 ('success' | 'failed')
 * @param {string} [params.errorMessage] - 错误信息
 * @param {Object} [params.metadata] - 额外元数据
 */
async function recordNotificationHistory(params) {
  try {
    const {
      channel,
      title,
      body,
      recipient,
      group,
      level,
      sound,
      status,
      errorMessage,
      metadata
    } = params;
    
    // 验证必要参数
    if (!channel || !title || !body || !status) {
      console.warn('[通知历史] 缺少必要参数，跳过记录');
      return;
    }
    
    const db = await dbManager.getConnection();
    
    const query = `
      INSERT INTO notification_history 
      (channel, title, body, recipient, \`group\`, level, sound, status, error_message, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      channel,
      title,
      body,
      recipient || null,
      group || null,
      level || null,
      sound || null,
      status,
      errorMessage || null,
      metadata ? JSON.stringify(metadata) : null
    ];
    
    await db.execute(query, values);
    
    console.info(`[通知历史] ✅ 已记录${channel === 'bark' ? 'Bark' : '邮件'}通知: ${title}`);
    
  } catch (error) {
    console.error('[通知历史] ❌ 记录失败:', error.message);
    // 不抛出错误，避免影响主流程
  }
}

module.exports = {
  recordNotificationHistory
};
