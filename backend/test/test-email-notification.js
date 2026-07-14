/**
 * 测试邮件通知功能
 */

const { sendSecurityAlert, sendIllegalApiCallAlert } = require('../src/email-notifier');
require('dotenv').config({ path: '../.env' }); // 加载根目录的.env文件

console.log('=== 邮件通知功能测试 ===\n');

// 模拟请求对象
const mockReq = {
  ip: '192.168.1.100',
  connection: { remoteAddress: '192.168.1.100' },
  get: (header) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    return headers[header] || 'Unknown';
  },
  path: '/api/manage-cards',
  method: 'POST',
  body: { action: 'use', username: 'testuser' }
};

async function runTests() {
  console.log('测试1: 发送普通安全告警...');
  try {
    const result1 = await sendSecurityAlert({
      subject: '测试告警邮件',
      message: '这是一封测试用的安全告警邮件，用于验证邮件发送功能是否正常。',
      details: {
        testId: 'TEST_001',
        timestamp: new Date().toISOString(),
        environment: 'development'
      }
    });
    console.log(`结果: ${result1 ? '✅ 发送成功' : '❌ 发送失败'}\n`);
  } catch (error) {
    console.error(`错误: ${error.message}\n`);
  }

  // 等待2秒避免频率限制
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('测试2: 发送非法API调用告警...');
  try {
    const result2 = await sendIllegalApiCallAlert({
      req: mockReq,
      reason: '缺少SBverify参数',
      details: {
        missingField: 'SBverify',
        providedFields: ['action', 'username'],
        expectedAction: 'use'
      }
    });
    console.log(`结果: ${result2 ? '✅ 发送成功' : '❌ 发送失败'}\n`);
  } catch (error) {
    console.error(`错误: ${error.message}\n`);
  }

  console.log('=== 测试完成 ===');
  console.log('\n请检查邮箱是否收到测试邮件。');
  console.log('如果未收到，请检查：');
  console.log('1. .env文件中的SMTP配置是否正确');
  console.log('2. ENABLE_ERROR_EMAIL_NOTIFICATION是否设置为true');
  console.log('3. 邮箱授权码是否有效');
  console.log('4. 查看backend/logs/application-*.safe日志文件');
}

runTests().catch(console.error);
