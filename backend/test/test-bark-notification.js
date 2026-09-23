/**
 * Bark 通知功能测试脚本
 * 用于测试 Bark 推送是否正常工作
 */

const barkNotifier = require('../src/bark-notifier');

// 初始化 Bark 模块
barkNotifier.initialize();

console.log('\n========== Bark 通知功能测试 ==========');
console.log(`Bark 启用状态: ${barkNotifier.isEnabled() ? '✅ 已启用' : '❌ 未启用'}`);

if (!barkNotifier.isEnabled()) {
  console.log('\n⚠️  Bark 通知功能未启用，请检查 .env 文件中的 ENABLE_BARK_NOTIFICATION 配置');
  process.exit(0);
}

// 显示配置的设备数量
const barkNotifierModule = require('../src/bark-notifier');
// 注意：这里我们无法直接访问内部配置，所以通过日志输出
console.log('💡 提示：查看上方日志确认配置的设备数量');
console.log('');

// 测试1: 发送登录次数充值通知
console.log('\n📤 测试1: 发送登录次数充值通知...');
barkNotifier.sendRechargeNotification({
  username: 'test_user',
  cardType: 'login',
  cardValues: 5,
  remainingLogins: 10,
  remainingPdfLimit: 30
})
.then(result => {
  if (result.success) {
    console.log('✅ 登录次数充值通知发送成功');
    console.log('响应数据:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ 登录次数充值通知发送失败:', result.error);
  }
  
  // 测试2: 发送PDF积分充值通知
  console.log('\n📤 测试2: 发送PDF积分充值通知...');
  return barkNotifier.sendRechargeNotification({
    username: 'test_user',
    cardType: 'pdf',
    cardValues: 30,
    remainingLogins: 10,
    remainingPdfLimit: 60
  });
})
.then(result => {
  if (result.success) {
    console.log('✅ PDF积分充值通知发送成功');
    console.log('响应数据:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ PDF积分充值通知发送失败:', result.error);
  }
  
  // 测试3: 发送自定义通知
  console.log('\n📤 测试3: 发送自定义通知...');
  return barkNotifier.sendNotification({
    title: '🔔 系统测试通知',
    body: '这是一条测试消息，用于验证 Bark 推送功能是否正常',
    subtitle: `测试时间: ${new Date().toLocaleString('zh-CN')}`,
    level: 'active',
    sound: 'minuet'
  });
})
.then(result => {
  if (result.success) {
    console.log('✅ 自定义通知发送成功');
    console.log('响应数据:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ 自定义通知发送失败:', result.error);
  }
  
  console.log('\n========== 测试完成 ==========');
})
.catch(error => {
  console.error('❌ 测试过程中发生错误:', error.message);
  console.error(error.stack);
});
