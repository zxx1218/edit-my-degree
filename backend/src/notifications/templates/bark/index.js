/**
 * Bark 通知模板统一导出
 */

const securityNotifications = require('./security');
const systemNotifications = require('./system');
const rechargeNotifications = require('./recharge');
const userNotifications = require('./user');

module.exports = {
  ...securityNotifications,
  ...systemNotifications,
  ...rechargeNotifications,
  ...userNotifications
};
