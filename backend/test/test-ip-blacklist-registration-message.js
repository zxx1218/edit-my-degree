/**
 * 测试IP黑名单对注册和留言接口的拦截功能
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001';

// 测试配置
const TEST_CONFIG = {
  blacklistedIP: '192.168.1.100', // 需要手动将此IP加入黑名单进行测试
  testUsername: 'test_user_' + Date.now(),
  testPassword: 'Test@123456',
  testMessage: '这是一条测试留言'
};

/**
 * 测试注册接口被黑名单IP访问
 */
async function testRegistrationWithBlacklistedIP() {
  console.log('\n===== 测试1：黑名单IP尝试注册 =====');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: TEST_CONFIG.testUsername,
        password: TEST_CONFIG.testPassword
      })
    });

    const data = await response.json();
    
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
    if (response.status === 403 && data.isBlacklisted === true) {
      console.log('✅ 测试通过：注册接口正确拦截了黑名单IP');
      return true;
    } else {
      console.log('❌ 测试失败：注册接口未正确拦截黑名单IP');
      return false;
    }
  } catch (error) {
    console.error('测试执行错误:', error.message);
    return false;
  }
}

/**
 * 测试留言接口被黑名单IP访问
 */
async function testMessageWithBlacklistedIP() {
  console.log('\n===== 测试2：黑名单IP尝试留言 =====');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/add-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: TEST_CONFIG.testMessage,
        username: TEST_CONFIG.testUsername
      })
    });

    const data = await response.json();
    
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
    if (response.status === 403 && data.isBlacklisted === true) {
      console.log('✅ 测试通过：留言接口正确拦截了黑名单IP');
      return true;
    } else {
      console.log('❌ 测试失败：留言接口未正确拦截黑名单IP');
      return false;
    }
  } catch (error) {
    console.error('测试执行错误:', error.message);
    return false;
  }
}

/**
 * 测试正常IP可以注册（对照测试）
 */
async function testNormalIPRegistration() {
  console.log('\n===== 测试3：正常IP尝试注册（对照测试）=====');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'normal_user_' + Date.now(),
        password: TEST_CONFIG.testPassword
      })
    });

    const data = await response.json();
    
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
    if (response.status !== 403 || data.isBlacklisted !== true) {
      console.log('✅ 测试通过：正常IP未被错误拦截');
      return true;
    } else {
      console.log('❌ 测试失败：正常IP被错误拦截');
      return false;
    }
  } catch (error) {
    console.error('测试执行错误:', error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('========================================');
  console.log('IP黑名单检测功能测试');
  console.log('========================================');
  console.log('测试时间:', new Date().toLocaleString('zh-CN'));
  console.log('API地址:', API_BASE_URL);
  console.log('========================================');
  
  const results = [];
  
  // 运行测试
  results.push(await testRegistrationWithBlacklistedIP());
  results.push(await testMessageWithBlacklistedIP());
  results.push(await testNormalIPRegistration());
  
  // 统计结果
  console.log('\n========================================');
  console.log('测试结果汇总');
  console.log('========================================');
  console.log(`总测试数: ${results.length}`);
  console.log(`通过数: ${results.filter(r => r).length}`);
  console.log(`失败数: ${results.filter(r => !r).length}`);
  console.log('========================================\n');
  
  if (results.every(r => r)) {
    console.log('🎉 所有测试通过！');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，请检查配置和日志');
    process.exit(1);
  }
}

// 执行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试执行异常:', error);
    process.exit(1);
  });
}

module.exports = {
  testRegistrationWithBlacklistedIP,
  testMessageWithBlacklistedIP,
  testNormalIPRegistration,
  runTests
};
