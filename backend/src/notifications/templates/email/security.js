/**
 * 安全告警邮件模板
 */

/**
 * 获取安全告警邮件HTML内容
 * @param {Object} options - 配置选项
 * @param {string} options.subject - 邮件主题
 * @param {string} options.message - 邮件正文
 * @param {Object} [options.details] - 详细信息
 * @param {string} [options.appName] - 应用名称
 * @returns {string} HTML邮件内容
 */
function getSecurityAlertHtml({ subject, message, details, appName }) {
  const displayName = appName || process.env.APP_NAME || '学位管理系统';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ 安全告警</h1>
      </div>

      <div style="padding: 20px; background: #f9f9f9;">
        <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h2 style="color: #333; margin-top: 0; font-size: 18px;">${subject}</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
        </div>

        ${details ? `
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px;">
          <h3 style="color: #856404; margin-top: 0; font-size: 16px;">📋 详细信息</h3>
          <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; font-size: 12px; color: #333;">${JSON.stringify(details, null, 2)}</pre>
        </div>
        ` : ''}

        <div style="margin-top: 15px; padding: 10px; background: #e9ecef; border-radius: 5px; font-size: 12px; color: #6c757d;">
          <p style="margin: 0;">🕐 时间: ${new Date().toLocaleString('zh-CN')}</p>
          <p style="margin: 5px 0 0 0;">🖥️ 服务器: ${displayName}</p>
        </div>
      </div>

      <div style="background: #343a40; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">此邮件由系统自动发送，请勿回复</p>
      </div>
    </div>
  `;
}

/**
 * 获取非法API调用告警邮件内容
 * @param {Object} options - 配置选项
 * @param {string} options.ip - IP地址
 * @param {string} options.userAgent - User-Agent
 * @param {string} options.path - 请求路径
 * @param {string} options.method - 请求方法
 * @param {string} options.reason - 告警原因
 * @param {Object} [options.details] - 额外详情
 * @returns {Object} { subject, message, details }
 */
function getIllegalApiCallAlertData({ ip, userAgent, path, method, reason, details }) {
  return {
    subject: '检测到充值接口非法调用',
    message: '系统检测到对充值卡管理接口的非法调用，可能存在安全风险。',
    details: {
      reason,
      ip,
      userAgent,
      path,
      method,
      timestamp: new Date().toISOString(),
      ...details
    }
  };
}

/**
 * 获取IP注册频率超限告警邮件内容
 * @param {Object} options - 配置选项
 * @returns {Object} { subject, message, details }
 */
function getIpRegistrationFrequencyAlertData({ ipAddress, userAgent, attemptedUsername, existingRegistrations, registrationCount }) {
  return {
    subject: 'IP注册频率超限被拦截',
    message: `系统检测到IP地址 ${ipAddress} 在24小时内尝试注册多个账户（已注册${registrationCount}个），触发安全防护机制并被拦截。`,
    details: {
      ipAddress,
      userAgent,
      attemptedUsername,
      existingRegistrations,
      registrationCount,
      timestamp: new Date().toISOString(),
      action: 'registration_blocked'
    }
  };
}

/**
 * 获取频繁密码重置告警邮件内容
 * @param {Object} options - 配置选项
 * @returns {Object} { subject, message, details }
 */
function getFrequentPasswordResetAlertData({ username, ipAddress, userAgent, attempts }) {
  return {
    subject: '频繁重置密码尝试警告',
    message: `检测到针对用户 ${username} 的频繁密码重置尝试，可能正在遭受恶意攻击。`,
    details: {
      ipAddress,
      userAgent,
      attempts,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * 获取密码重置验证失败告警邮件内容
 * @param {Object} options - 配置选项
 * @returns {Object} { subject, message, details }
 */
function getPasswordResetVerificationFailedAlertData({ username, ipAddress, userAgent, attempts }) {
  return {
    subject: '密码重置验证失败次数过多',
    message: `用户 ${username} 在短时间内多次输入错误的卡密进行密码重置。`,
    details: {
      ipAddress,
      userAgent,
      attempts,
      timestamp: new Date().toISOString()
    }
  };
}

module.exports = {
  getSecurityAlertHtml,
  getIllegalApiCallAlertData,
  getIpRegistrationFrequencyAlertData,
  getFrequentPasswordResetAlertData,
  getPasswordResetVerificationFailedAlertData
};
