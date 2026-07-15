/**
 * 测试安全机制邮件通知功能
 * 
 * 本脚本用于测试以下安全场景的邮件通知：
 * 1. IP因频率限制被自动封禁
 * 2. 黑名单IP尝试登录
 * 3. IP注册频率超限
 * 4. 手动配置黑名单IP访问
 * 
 * 使用方法:
 * cd /home/ctkj/edit-my-degree/backend
 * node test/test-security-email-notification.js
 * 
 * 注意事项:
 * - 确保.env文件中已正确配置SMTP信息
 * - 确保ENABLE_ERROR_EMAIL_NOTIFICATION=true
 * - 测试邮件会发送到ERROR_NOTIFICATION_EMAIL配置的邮箱
 */

require('dotenv').config({ path: '../.env' }); // 加载根目录的.env文件
const { sendSecurityAlert } = require('../src/email-notifier');

// 兼容性处理
if (!console.safe) {
  console.safe = console.log;
}

console.log('=== 安全机制邮件通知功能测试 ===\n');

/**
 * 测试1: IP因频率限制被自动封禁
 */
async function testIpRateLimitBlock() {
  console.log('测试1: IP因频率限制被自动封禁...');
  try {
    const result = await sendSecurityAlert({
      subject: 'IP因频繁请求被自动封禁',
      message: `系统检测到IP地址 192.168.1.100 在短时间内发起大量请求，已触发频率限制机制并自动加入黑名单。`,
      details: {
        ipAddress: '192.168.1.100',
        reason: '在300秒内请求15次，超过阈值10次',
        blockedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        blockDurationDays: 7,
        timestamp: new Date().toISOString(),
        config: {
          timeWindowSeconds: 300,
          maxRequests: 10,
          blockDurationDays: 7
        }
      }
    });
    console.log(`结果: ${result ? '✅ 发送成功' : '❌ 发送失败'}\n`);
    return result;
  } catch (error) {
    console.error(`错误: ${error.message}\n`);
    return false;
  }
}

/**
 * 测试2: 黑名单IP尝试登录
 */
async function testBlacklistedIpLogin() {
  console.log('测试2: 黑名单IP尝试登录...');
  try {
    const result = await sendSecurityAlert({
      subject: '黑名单IP尝试登录',
      message: `系统检测到已被封禁的IP地址 103.151.173.208 尝试登录系统，可能存在安全风险。`,
      details: {
        ipAddress: '103.151.173.208',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        action: 'login_attempt',
        timestamp: new Date().toISOString(),
        reason: '黑名单IP尝试登录'
      }
    });
    console.log(`结果: ${result ? '✅ 发送成功' : '❌ 发送失败'}\n`);
    return result;
  } catch (error) {
    console.error(`错误: ${error.message}\n`);
    return false;
  }
}

/**
 * 测试3: IP注册频率超限
 */
async function testRegistrationRateLimit() {
  console.log('测试3: IP注册频率超限...');
  try {
    const result = await sendSecurityAlert({
      subject: 'IP注册频率超限被拦截',
      message: `系统检测到IP地址 183.6.9.103 在24小时内尝试注册多个账户（已注册3个），触发安全防护机制并被拦截。`,
      details: {
        ipAddress: '183.6.9.103',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        attemptedUsername: 'test_user_001',
        existingRegistrations: [
          { id: 'uuid-001', username: 'user_a' },
          { id: 'uuid-002', username: 'user_b' },
          { id: 'uuid-003', username: 'user_c' }
        ],
        registrationCount: 3,
        timestamp: new Date().toISOString(),
        action: 'registration_blocked'
      }
    });
    console.log(`结果: ${result ? '✅ 发送成功' : '❌ 发送失败'}\n`);
    return result;
  } catch (error) {
    console.error(`错误: ${error.message}\n`);
    return false;
  }
}

/**
 * 测试4: 手动配置黑名单IP访问
 */
async function testManualBlacklistAccess() {
  console.log('测试4: 手动配置黑名单IP访问...');
  try {
    const result = await sendSecurityAlert({
      subject: '手动配置黑名单IP访问被拦截',
      message: `系统检测到手动配置的黑名单IP 222.120.184.140 尝试访问系统，已被拦截。`,
      details: {
        ipAddress: '222.120.184.140',
        userAgent: 'curl/7.68.0',
        url: '/api/user-data',
        method: 'GET',
        timestamp: new Date().toISOString(),
        action: 'manual_blacklist_access_blocked'
      }
    });
    console.log(`结果: ${result ? '✅ 发送成功' : '❌ 发送失败'}\n`);
    return result;
  } catch (error) {
    console.error(`错误: ${error.message}\n`);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  const results = [];
  
  // 测试之间有延迟，避免触发SMTP频率限制
  results.push(await testIpRateLimitBlock());
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push(await testBlacklistedIpLogin());
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push(await testRegistrationRateLimit());
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push(await testManualBlacklistAccess());
  
  // 统计结果
  console.log('\n=== 测试结果汇总 ===');
  const successCount = results.filter(r => r).length;
  const failCount = results.filter(r => !r).length;
  console.log(`总测试数: ${results.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  
  if (successCount === results.length) {
    console.log('\n✅ 所有测试通过！请检查邮箱是否收到4封测试邮件。');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查：');
    console.log('1. .env文件中的SMTP配置是否正确');
    console.log('2. ENABLE_ERROR_EMAIL_NOTIFICATION是否设置为true');
    console.log('3. 邮箱授权码是否有效');
    console.log('4. 查看backend/logs/application-*.safe日志文件');
  }
}

// 执行测试
runAllTests().catch(err => {
  console.error('测试执行出错:', err);
  process.exit(1);
});
