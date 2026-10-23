/**
 * 通知模板统一导出
 * 集中管理所有通知模板（Bark推送）
 */

const barkTemplates = require('./bark');

module.exports = {
  ...barkTemplates
};
