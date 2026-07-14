/**
 * 测试错误日志邮件通知功能
 * 
 * 使用方法：
 * node test/test-error-email-notification.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' }); // 加载根目录的.env文件
const logger = require('../src/logger');

console.log('\n=== 开始测试错误日志邮件通知功能 ===\n');

// 检查配置
console.log('当前配置：');
console.log('- ENABLE_ERROR_EMAIL_NOTIFICATION:', process.env.ENABLE_ERROR_EMAIL_NOTIFICATION);
console.log('- SMTP_HOST:', process.env.SMTP_HOST || '未设置');
console.log('- SMTP_PORT:', process.env.SMTP_PORT || '未设置');
console.log('- SMTP_USER:', process.env.SMTP_USER ? '已设置' : '未设置');
console.log('- ERROR_NOTIFICATION_EMAIL:', process.env.ERROR_NOTIFICATION_EMAIL || 'zxx12182022@163.com');
console.log('');

if (process.env.ENABLE_ERROR_EMAIL_NOTIFICATION !== 'true') {
  console.warn('⚠️  警告：邮件通知未启用，请在 .env 文件中设置 ENABLE_ERROR_EMAIL_NOTIFICATION=true');
}

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ 错误：SMTP配置不完整，请设置 SMTP_HOST, SMTP_USER, SMTP_PASS');
  process.exit(1);
}

// 等待2秒让SMTP连接验证完成
setTimeout(() => {
  console.log('\n--- 发送测试错误日志 ---\n');
  
  // 发送一条测试错误日志
  console.error('🧪 这是一条测试错误消息 - 用于验证邮件通知功能');
  
  console.log('\n✅ 测试错误日志已发送');
  console.log('📧 请检查邮箱是否收到告警邮件');
  console.log('⏱️  如果配置正确，邮件将在几秒内发送');
  console.log('\n注意：');
  console.log('- 邮件发送是异步的，不会阻塞程序');
  console.log('- 有频率限制：最小间隔1分钟，每小时最多30封');
  console.log('- 查看后端日志中的 [邮件通知] 相关信息');
  
  // 保持进程运行5秒，让邮件有时间发送
  setTimeout(() => {
    console.log('\n=== 测试完成 ===\n');
    process.exit(0);
  }, 5000);
}, 2000);
