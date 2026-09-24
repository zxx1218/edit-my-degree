/**
 * 邮件通知模块
 * 仅用于充值接口的恶意调用告警（高优先级安全事件）
 */

const nodemailer = require('nodemailer');
const { recordNotificationHistory } = require('./notification-history');
require('dotenv').config({ path: '../.env' }); // 加载根目录的.env文件

// 邮件传输器配置
let transporter = null;

/**
 * 初始化邮件传输器
 */
function initTransporter() {
  if (transporter) return transporter;
  
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.163.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // SSL连接
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };
  
  transporter = nodemailer.createTransport(smtpConfig);
  return transporter;
}

/**
 * 发送安全告警邮件
 * @param {Object} params - 邮件参数
 * @param {string} params.subject - 邮件主题
 * @param {string} params.message - 邮件内容
 * @param {Object} params.details - 详细信息对象
 */
async function sendSecurityAlert(params) {
  const { subject, message, details } = params;
  
  // 检查是否启用邮件通知
  if (process.env.ENABLE_ERROR_EMAIL_NOTIFICATION !== 'true') {
    console.info('[邮件通知] ℹ️ 邮件通知已禁用（ENABLE_ERROR_EMAIL_NOTIFICATION != true）');
    return false;
  }
  
  // 检查SMTP配置
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[邮件通知] ⚠️ SMTP配置不完整，无法发送邮件');
    console.warn(`[邮件通知] 🔍 当前配置 - SMTP_USER: ${process.env.SMTP_USER ? '已设置' : '未设置'}, SMTP_PASS: ${process.env.SMTP_PASS ? '已设置' : '未设置'}`);
    return false;
  }
  
  try {
    const mailTransporter = initTransporter();
    
    console.info(`[邮件通知] 📤 正在连接SMTP服务器: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    console.info(`[邮件通知] 👤 发件人: ${process.env.EMAIL_FROM || process.env.SMTP_USER}`);
    console.info(`[邮件通知] 📬 收件人: ${process.env.ERROR_NOTIFICATION_EMAIL}`);
    
    // 构建HTML邮件内容
    const htmlContent = `
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
            <p style="margin: 5px 0 0 0;">🖥️ 服务器: ${process.env.APP_NAME || '学位管理系统'}</p>
          </div>
        </div>
        
        <div style="background: #343a40; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">此邮件由系统自动发送，请勿回复</p>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.ERROR_NOTIFICATION_EMAIL,
      subject: `[${process.env.APP_NAME || '系统'}] ${subject}`,
      html: htmlContent
    };
    
    console.info(`[邮件通知] 📨 正在发送邮件...`);
    const info = await mailTransporter.sendMail(mailOptions);
    console.info(`[邮件通知] ✅ 安全告警邮件发送成功`);
    console.info(`[邮件通知] 🆔 Message ID: ${info.messageId}`);
    console.info(`[邮件通知] 📊 SMTP响应: ${info.response || 'N/A'}`);
    
    // 记录通知历史
    await recordNotificationHistory({
      channel: 'email',
      title: subject,
      body: message,
      recipient: process.env.ERROR_NOTIFICATION_EMAIL,
      group: '安全告警',
      level: 'critical',
      status: 'success',
      metadata: { messageId: info.messageId }
    });
    
    return true;
    
  } catch (error) {
    console.error(`[邮件通知] ❌ 邮件发送失败`);
    console.error(`[邮件通知] 🔴 错误类型: ${error.constructor.name}`);
    console.error(`[邮件通知] 🔴 错误消息: ${error.message}`);
    console.error(`[邮件通知] 🔴 错误代码: ${error.code || 'N/A'}`);
    console.error(`[邮件通知] 🔴 错误命令: ${error.command || 'N/A'}`);
    if (error.stack) {
      console.error(`[邮件通知] 📚 堆栈跟踪:\n${error.stack}`);
    }
    
    // 记录失败的通知历史
    await recordNotificationHistory({
      channel: 'email',
      title: params.subject,
      body: params.message,
      recipient: process.env.ERROR_NOTIFICATION_EMAIL,
      group: '安全告警',
      level: 'critical',
      status: 'failed',
      errorMessage: error.message
    });
    
    return false;
  }
}

/**
 * 发送非法API调用告警（充值接口恶意调用）
 * @param {Object} requestData - 请求数据
 * @param {Object} requestData.req - 请求对象
 * @param {string} requestData.reason - 告警原因
 * @param {Object} requestData.details - 详细信息
 */
async function sendIllegalApiCallAlert(requestData) {
  const { req, reason, details } = requestData;
  
  const subject = '检测到充值接口非法调用';
  const message = `系统检测到对充值卡管理接口的非法调用，可能存在安全风险。`;
  
  const alertDetails = {
    reason: reason,
    ip: req.ip || req.connection.remoteAddress || '未知IP',
    userAgent: req.get('User-Agent') || 'Unknown',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestBody: req.body,
    ...details
  };
  
  return await sendSecurityAlert({
    subject,
    message,
    details: alertDetails
  });
}


module.exports = {
  sendSecurityAlert,
  sendIllegalApiCallAlert
};
