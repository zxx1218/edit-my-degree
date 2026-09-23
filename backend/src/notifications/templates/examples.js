/**
 * Bark 通知模板使用示例
 * 
 * 本文件展示如何使用各种通知模板
 * 实际使用时请根据需要导入相应的模板函数
 */

const barkNotifier = require('../bark-notifier');
const {
  // 系统通知
  getStartupNotification,
  getShutdownNotification,
  getDatabaseErrorNotification,
  
  // 充值通知
  getRechargeNotification,
  getLoginRechargeNotification,
  getPdfRechargeNotification,
  
  // 安全告警
  getIpBlacklistBlockNotification,
  getUserBlacklistBlockNotification,
  getSuspiciousLoginNotification,
  getFailedLoginNotification,
  
  // 用户通知
  getNewUserRegistrationNotification,
  getNewMessageNotification,
  getPasswordChangeNotification
} = require('./index');

// ==================== 系统通知示例 ====================

/**
 * 示例1: 服务启动通知
 */
async function exampleStartupNotification() {
  const notification = getStartupNotification({
    hostname: require('os').hostname(),
    port: 3001,
    env: process.env.NODE_ENV || 'development',
    startTime: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('启动通知结果:', result);
}

/**
 * 示例2: 服务关闭通知
 */
async function exampleShutdownNotification() {
  const notification = getShutdownNotification({
    hostname: require('os').hostname(),
    shutdownTime: new Date().toLocaleString('zh-CN'),
    reason: '正常关闭'
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('关闭通知结果:', result);
}

/**
 * 示例3: 数据库错误通知
 */
async function exampleDatabaseErrorNotification() {
  const notification = getDatabaseErrorNotification({
    hostname: require('os').hostname(),
    error: '连接超时',
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('数据库错误通知结果:', result);
}

// ==================== 充值通知示例 ====================

/**
 * 示例4: 登录次数充值通知
 */
async function exampleLoginRechargeNotification() {
  const notification = getLoginRechargeNotification({
    username: '张三',
    cardValues: 10,
    remainingLogins: 50,
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('登录充值通知结果:', result);
}

/**
 * 示例5: PDF积分充值通知
 */
async function examplePdfRechargeNotification() {
  const notification = getPdfRechargeNotification({
    username: '李四',
    cardValues: 30,
    remainingPdfLimit: 100,
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('PDF充值通知结果:', result);
}

/**
 * 示例6: 通用充值通知（自动根据类型选择）
 */
async function exampleGenericRechargeNotification() {
  // 登录次数充值
  const loginNotification = getRechargeNotification({
    username: '王五',
    cardType: 'login',
    cardValues: 5,
    remainingLogins: 25,
    remainingPdfLimit: 50,
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  await barkNotifier.sendNotification(loginNotification);
  
  // PDF积分充值
  const pdfNotification = getRechargeNotification({
    username: '赵六',
    cardType: 'pdf',
    cardValues: 20,
    remainingLogins: 25,
    remainingPdfLimit: 70,
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  await barkNotifier.sendNotification(pdfNotification);
}

// ==================== 安全告警示例 ====================

/**
 * 示例7: IP黑名单拦截通知
 */
async function exampleIpBlacklistNotification() {
  const notification = getIpBlacklistBlockNotification({
    ip: '192.168.1.100',
    username: 'test_user',
    action: '登录',
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('IP黑名单通知结果:', result);
}

/**
 * 示例8: 用户黑名单拦截通知
 */
async function exampleUserBlacklistNotification() {
  const notification = getUserBlacklistBlockNotification({
    username: 'bad_user',
    reason: '多次违规操作',
    blockedUntil: '2026-10-01 00:00:00',
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('用户黑名单通知结果:', result);
}

/**
 * 示例9: 异常登录行为通知
 */
async function exampleSuspiciousLoginNotification() {
  const notification = getSuspiciousLoginNotification({
    ip: '10.0.0.1',
    username: 'suspicious_user',
    attempts: 50,
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('异常登录通知结果:', result);
}

/**
 * 示例10: 多次登录失败通知
 */
async function exampleFailedLoginNotification() {
  const notification = getFailedLoginNotification({
    ip: '172.16.0.1',
    username: 'failed_user',
    failedAttempts: 10,
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('登录失败通知结果:', result);
}

// ==================== 用户通知示例 ====================

/**
 * 示例11: 新用户注册通知
 */
async function exampleNewUserNotification() {
  const notification = getNewUserRegistrationNotification({
    username: 'new_user',
    ip: '192.168.1.200',
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('新用户注册通知结果:', result);
}

/**
 * 示例12: 新留言通知
 */
async function exampleNewMessageNotification() {
  const notification = getNewMessageNotification({
    username: 'commenter',
    content: '这是一条测试留言内容，用于演示新留言通知功能',
    ip: '192.168.1.150',
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('新留言通知结果:', result);
}

/**
 * 示例13: 密码修改通知
 */
async function examplePasswordChangeNotification() {
  const notification = getPasswordChangeNotification({
    username: 'user123',
    ip: '192.168.1.180',
    timestamp: new Date().toLocaleString('zh-CN')
  });
  
  const result = await barkNotifier.sendNotification(notification);
  console.log('密码修改通知结果:', result);
}

// ==================== 导出所有示例函数 ====================
module.exports = {
  exampleStartupNotification,
  exampleShutdownNotification,
  exampleDatabaseErrorNotification,
  exampleLoginRechargeNotification,
  examplePdfRechargeNotification,
  exampleGenericRechargeNotification,
  exampleIpBlacklistNotification,
  exampleUserBlacklistNotification,
  exampleSuspiciousLoginNotification,
  exampleFailedLoginNotification,
  exampleNewUserNotification,
  exampleNewMessageNotification,
  examplePasswordChangeNotification
};

// 如果直接运行此文件，执行所有示例
if (require.main === module) {
  console.log('\n========== Bark 通知模板使用示例 ==========');
  console.log('注意：这些示例仅用于演示，不会实际发送通知\n');
  console.log('要实际测试，请运行: node test/test-bark-notification.js\n');
}
