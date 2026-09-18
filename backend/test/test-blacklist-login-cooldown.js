/**
 * 测试黑名单用户登录邮件通知的IP冷却机制
 * 
 * 用途：验证同一IP在15分钟内只发送一次邮件的功能
 * 
 * 运行方式：node backend/test/test-blacklist-login-cooldown.js
 */

require('dotenv').config({ path: '../.env' }); // 加载根目录的.env文件
const { sendBlacklistUserLoginAlert } = require('../src/email-notifier');

// 兼容性处理
if (!console.safe) {
  console.safe = console.log;
}

console.log('\n=== 黑名单用户登录邮件通知IP冷却机制测试 ===\n');

// 模拟数据
const testParams = {
  ipAddress: '192.168.1.100',
  username: 'testuser',
  reason: '违反使用协议，多次尝试破解系统',
  blockedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function runTests() {
  console.log('📧 测试场景：同一IP在15分钟内的多次登录尝试\n');
  
  // 第一次尝试 - 应该发送邮件
  console.log('第1次尝试（应该发送邮件）...');
  const result1 = await sendBlacklistUserLoginAlert(testParams);
  console.log(`结果: ${result1 ? '✅ 邮件已发送' : '❌ 邮件未发送'}\n`);
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 第二次尝试 - 不应该发送邮件（在冷却期内）
  console.log('第2次尝试（2秒后，在冷却期内，不应发送邮件）...');
  const result2 = await sendBlacklistUserLoginAlert(testParams);
  console.log(`结果: ${result2 ? '✅ 邮件已发送' : '⏸️  已跳过（冷却期内）'}\n`);
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 第三次尝试 - 不应该发送邮件（仍在冷却期内）
  console.log('第3次尝试（4秒后，仍在冷却期内，不应发送邮件）...');
  const result3 = await sendBlacklistUserLoginAlert(testParams);
  console.log(`结果: ${result3 ? '✅ 邮件已发送' : '⏸️  已跳过（冷却期内）'}\n`);
  
  console.log('--- 测试结果汇总 ---');
  console.log(`第1次: ${result1 ? '✅ 发送成功' : '❌ 发送失败'}`);
  console.log(`第2次: ${!result2 ? '✅ 正确跳过' : '❌ 错误地发送了邮件'}`);
  console.log(`第3次: ${!result3 ? '✅ 正确跳过' : '❌ 错误地发送了邮件'}`);
  
  if (result1 && !result2 && !result3) {
    console.log('\n✅ 所有测试通过！IP冷却机制工作正常。\n');
  } else {
    console.log('\n❌ 部分测试未通过，请检查实现。\n');
  }
  
  console.log('💡 提示：');
  console.log('- 冷却时间为15分钟');
  console.log('- 同一IP在冷却期内不会重复发送邮件');
  console.log('- 可以查看邮箱确认是否只收到一封邮件\n');
}

runTests().catch(err => {
  console.error('测试执行出错:', err.message);
  process.exit(1);
});
