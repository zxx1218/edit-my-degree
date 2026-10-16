/**
 * 通知模板统一导出
 * 集中管理所有通知模板（Bark推送 + 邮件）
 */

// Bark 推送通知模板
const barkTemplates = require('./bark');

// 邮件通知模板
const emailTemplates = require('./email');

module.exports = {
  // Bark 推送通知
  ...barkTemplates,

  // 邮件通知
  ...emailTemplates
};
