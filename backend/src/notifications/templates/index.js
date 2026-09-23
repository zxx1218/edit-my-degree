/**
 * 通知模板统一导出
 * 集中管理所有Bark通知模板
 */

// 系统级通知
const systemNotifications = require('./system-notifications');

// 充值相关通知
const rechargeNotifications = require('./recharge-notifications');

// 安全告警通知
const securityNotifications = require('./security-notifications');

// 用户相关通知
const userNotifications = require('./user-notifications');

module.exports = {
  // 系统通知
  ...systemNotifications,
  
  // 充值通知
  ...rechargeNotifications,
  
  // 安全告警
  ...securityNotifications,
  
  // 用户通知
  ...userNotifications
};
