/**
 * 测试通知历史记录功能
 */

const { recordNotificationHistory } = require('../src/notification-history');

async function testNotificationHistory() {
  console.log('🧪 开始测试通知历史记录功能...\n');

  try {
    // 测试1: 记录成功的Bark通知
    console.log('📱 测试1: 记录成功的Bark通知');
    await recordNotificationHistory({
      channel: 'bark',
      title: '💳 登录次数充值成功',
      body: '用户 testuser 成功充值 10 次登录次数\n当前剩余: 50 次',
      recipient: 'device_key_12345678, device_key_87654321',
      group: '学位管理系统充值通知',
      level: 'active',
      sound: 'minuet',
      status: 'success',
      metadata: { subtitle: '充值时间: 2026/09/24 15:30:00' }
    });
    console.log('✅ Bark通知记录成功\n');

    // 测试2: 记录失败的Bark通知
    console.log('❌ 测试2: 记录失败的Bark通知');
    await recordNotificationHistory({
      channel: 'bark',
      title: '测试失败通知',
      body: '这是一条失败的通知',
      recipient: 'invalid_device_key',
      group: '测试分组',
      level: 'passive',
      sound: 'none',
      status: 'failed',
      errorMessage: 'Network Error: Connection timeout'
    });
    console.log('✅ 失败Bark通知记录成功\n');

    // 测试3: 记录成功的邮件通知
    console.log('📧 测试3: 记录成功的邮件通知');
    await recordNotificationHistory({
      channel: 'email',
      title: '检测到充值接口非法调用',
      body: '系统检测到对充值卡管理接口的非法调用，可能存在安全风险。',
      recipient: 'admin@example.com',
      group: '安全告警',
      level: 'critical',
      status: 'success',
      metadata: { messageId: '<test-message-id@example.com>' }
    });
    console.log('✅ 邮件通知记录成功\n');

    // 测试4: 记录失败的邮件通知
    console.log('❌ 测试4: 记录失败的邮件通知');
    await recordNotificationHistory({
      channel: 'email',
      title: 'SMTP连接失败',
      body: '无法连接到SMTP服务器',
      recipient: 'admin@example.com',
      group: '安全告警',
      level: 'critical',
      status: 'failed',
      errorMessage: 'Error: connect ECONNREFUSED 127.0.0.1:465'
    });
    console.log('✅ 失败邮件通知记录成功\n');

    console.log('🎉 所有测试通过！');
    console.log('\n💡 提示：请登录SuperAdmin页面查看通知历史记录');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testNotificationHistory();
