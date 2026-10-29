/**
 * 安全告警通知模块
 * 原邮件通知已迁移至 Bark 推送
 */

const barkNotifier = require('./bark-notifier');
const notificationCooldown = require('./notification-cooldown');
const {
  getIllegalApiCallAlert,
  getIpRegistrationFrequencyAlert,
  getFrequentPasswordResetAlert,
  getPasswordResetVerificationFailedAlert
} = require('./notifications/templates');

/**
 * 发送安全告警通知（通过 Bark，带冷却机制）
 * @param {Object} params - 通知参数
 * @param {string} params.subject - 告警主题
 * @param {string} params.message - 告警内容
 * @param {Object} params.details - 详细信息对象
 * @param {string} params.type - 告警类型（用于选择模板）
 */
async function sendSecurityAlert(params) {
  const { subject, message, details, type } = params;
  
  const identifier = `${subject}:${details?.ip || details?.ipAddress || 'unknown'}`;
  const cooldownType = `security_alert_${type || 'general'}`;
  
  const { shouldSend, remainingSeconds } = notificationCooldown.shouldSend(cooldownType, identifier);
  
  if (!shouldSend) {
    const minutes = Math.ceil(remainingSeconds / 60);
    console.info(`[安全告警] ⏳ 跳过发送（冷却中，剩余 ${minutes} 分钟）: ${subject}`);
    return false;
  }
  
  if (!barkNotifier.isEnabled()) {
    console.info('[安全告警] Bark通知未启用，跳过发送');
    const { recordNotificationHistory } = require("./notification-history");
    await recordNotificationHistory({
      channel: 'bark',
      title: subject,
      body: message,
      group: '安全告警',
      level: 'critical',
      status: 'failed',
      errorMessage: 'Bark通知功能未启用'
    });
    return false;
  }
  
  try {
    let notification;
    
    switch (type) {
      case 'illegal_api_call':
        notification = getIllegalApiCallAlert(details);
        break;
      case 'ip_registration_frequency':
        notification = getIpRegistrationFrequencyAlert(details);
        break;
      case 'frequent_password_reset':
        notification = getFrequentPasswordResetAlert(details);
        break;
      case 'password_reset_verification_failed':
        notification = getPasswordResetVerificationFailedAlert(details);
        break;
      default:
        notification = {
          title: `⚠️ ${subject}`,
          body: message.length > 100 ? message.substring(0, 100) + '...' : message,
          group: '安全告警',
          level: 'critical',
          sound: 'bell'
        };
    }
    
    const result = await barkNotifier.sendNotification(notification);
    
    notificationCooldown.recordSent(cooldownType, identifier);
    
    const { recordNotificationHistory } = require("./notification-history");
    await recordNotificationHistory({
      channel: 'bark',
      title: notification.title,
      body: notification.body,
      group: '安全告警',
      level: 'critical',
      status: result.success ? 'success' : 'failed',
      errorMessage: result.error || undefined
    });
    
    if (result.success) {
      console.info(`[安全告警] ✅ Bark通知发送成功: ${subject}`);
    } else {
      console.warn(`[安全告警] ⚠️ Bark通知发送失败: ${result.error}`);
    }
    
    return result.success;
    
  } catch (error) {
    console.error(`[安全告警] ❌ 通知发送异常: ${error.message}`);
    
    const { recordNotificationHistory } = require("./notification-history");
    await recordNotificationHistory({
      channel: 'bark',
      title: subject,
      body: message,
      group: '安全告警',
      level: 'critical',
      status: 'failed',
      errorMessage: error.message
    });
    
    return false;
  }
}

/**
 * 发送非法API调用告警
 * @param {Object} requestData - 请求数据
 * @param {Object} requestData.req - 请求对象
 * @param {string} requestData.reason - 告警原因
 * @param {Object} requestData.details - 详细信息
 */
async function sendIllegalApiCallAlert(requestData) {
  const { req, reason, details } = requestData;
  
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress
    || (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null)
    || req.headers['x-real-ip'] || '未知IP';
  
  return await sendSecurityAlert({
    subject: '检测到充值接口非法调用',
    message: '系统检测到对充值卡管理接口的非法调用，可能存在安全风险。',
    type: 'illegal_api_call',
    details: {
      ip,
      path: req.path,
      method: req.method,
      reason,
      ...details
    }
  });
}

module.exports = {
  sendSecurityAlert,
  sendIllegalApiCallAlert
};
