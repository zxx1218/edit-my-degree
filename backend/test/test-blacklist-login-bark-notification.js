/**
 * 测试黑名单登录Bark通知功能
 * 
 * 用途：验证黑名单用户/IP登录时正确发送Bark通知
 * 
 * 运行方式：node backend/test/test-blacklist-login-bark-notification.js
 */

require('dotenv').config({ path: '../.env' }); // 加载根目录的.env文件
const barkNotifier = require('../src/bark-notifier');
const { 
  getIpBlacklistBlockNotification, 
  getUserBlacklistBlockNotification 
} = require('../src/notifications/templates');

// 兼容性处理
if (!console.safe) {
  console.safe = console.log;
}

console.log('\n=== 黑名单登录Bark通知功能测试 ===\n');

async function runTests() {
  console.log('📱 测试场景1：IP黑名单拦截Bark通知\n');
  
  const timestamp = new Date().toLocaleString('zh-CN');
  const ipNotification = getIpBlacklistBlockNotification({
    ip: '192.168.1.100',
    username: null,
    action: '登录',
    timestamp
  });
  
  console.log('准备发送IP黑名单拦截通知...');
  console.log('通知内容:', JSON.stringify(ipNotification, null, 2));
  
  const result1 = await barkNotifier.sendNotification(ipNotification);
  console.log(`结果: ${result1.success ? '✅ Bark通知已发送' : '❌ Bark通知发送失败'}\n`);
  
  if (result1.success) {
    console.log('✅ 测试场景1通过！\n');
  } else {
    console.log('❌ 测试场景1未通过\n');
    console.log('错误信息:', result1.error);
  }
  
  console.log('---\n');
  
  console.log('📱 测试场景2：用户黑名单拦截Bark通知\n');
  
  const userNotification = getUserBlacklistBlockNotification({
    username: 'testuser',
    reason: '违反使用协议，多次尝试破解系统',
    blockedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
    timestamp
  });
  
  console.log('准备发送用户黑名单拦截通知...');
  console.log('通知内容:', JSON.stringify(userNotification, null, 2));
  
  const result2 = await barkNotifier.sendNotification(userNotification);
  console.log(`结果: ${result2.success ? '✅ Bark通知已发送' : '❌ Bark通知发送失败'}\n`);
  
  if (result2.success) {
    console.log('✅ 测试场景2通过！\n');
  } else {
    console.log('❌ 测试场景2未通过\n');
    console.log('错误信息:', result2.error);
  }
  
  console.log('=== 测试结果汇总 ===');
  const allPassed = result1.success && result2.success;
  
  if (allPassed) {
    console.log('✅ 所有测试通过！Bark通知功能工作正常。\n');
    console.log('💡 说明：');
    console.log('- IP黑名单和用户黑名单拦截都会发送Bark通知');
    console.log('- 通知分组为"安全告警"，级别为critical');
    console.log('- 可以查看Bark应用确认是否收到通知\n');
  } else {
    console.log('❌ 部分测试未通过，请检查配置和实现。\n');
    console.log('💡 提示：');
    console.log('- 确保 .env 文件中 ENABLE_BARK_NOTIFICATION=true');
    console.log('- 确保 BARK_DEVICE_KEYS 已正确配置');
    console.log('- 检查网络连接是否正常\n');
  }
}

runTests().catch(err => {
  console.error('测试执行出错:', err.message);
  console.error(err.stack);
  process.exit(1);
});
