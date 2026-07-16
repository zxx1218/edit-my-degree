// 测试注册接口的用户名格式限制功能
const axios = require('axios');
const crypto = require('crypto');

const API_BASE_URL = 'http://localhost:20000';
const APP_KEY = 'sadwgfsefsdgfsdgf';
const SECRET_KEY = 'edit_my_degree_api_secret_key';

/**
 * 生成签名
 */
function generateSignature(method, url, params, timestamp) {
  const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  const signString = `${method.toUpperCase()}${url}${sortedParams}${timestamp}`;
  
  let hash = 0;
  for (let i = 0; i < signString.length; i++) {
   const char = signString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  for (let i = 0; i < SECRET_KEY.length; i++) {
   const char = SECRET_KEY.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16);
}

/**
 * 发送注册请求
 */
async function sendRegisterRequest(username, password) {
  const url = '/api/register';
  const method = 'POST';
  const timestamp = Date.now().toString();
  
  const params = { username, password };
  const signature = generateSignature(method, url, params, timestamp);
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp,
    'X-Signature': signature,
    'X-App-Key': APP_KEY
  };
  
  try {
    const response = await axios.post(`${API_BASE_URL}${url}`, params, { headers });
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

/**
 * 运行测试
 */
async function runTests() {
  console.log('=== 用户名格式限制测试 ===\n');
  
  // 测试用例
  const testCases = [
    {
      name: '有效用户名 - 纯字母',
      username: 'testuser',
      password: 'password123',
      expectSuccess: true
    },
    {
      name: '有效用户名 - 纯数字',
      username: '123456',
      password: 'password123',
      expectSuccess: true
    },
    {
      name: '有效用户名 - 字母数字组合',
      username: 'user123',
      password: 'password123',
      expectSuccess: true
    },
    {
      name: '有效用户名 - 包含下划线',
      username: 'test_user_123',
      password: 'password123',
      expectSuccess: true
    },
    {
      name: '有效用户名 - 最小长度3个字符',
      username: 'abc',
      password: 'password123',
      expectSuccess: true
    },
    {
      name: '无效用户名 - 长度不足（1个字符）',
      username: 'a',
      password: 'password123',
      expectSuccess: false,
      expectedError: '用户名至少需要3个字符'
    },
    {
      name: '无效用户名 - 长度不足（2个字符）',
      username: 'ab',
      password: 'password123',
      expectSuccess: false,
      expectedError: '用户名至少需要3个字符'
    },
    {
      name: '无效用户名 - 空字符串',
      username: '',
      password: 'password123',
      expectSuccess: false,
      expectedError: '用户名和密码不能为空'
    },
    {
      name: '无效用户名 - 包含中文字符',
      username: '测试用户',
      password: 'password123',
      expectSuccess: false,
      expectedError: '用户名只能由数字、字母和下划线组成'
    },
    {
      name: '无效用户名 - 包含特殊符号@',
      username: 'test@user',
      password: 'password123',
      expectSuccess: false,
      expectedError: '用户名只能由数字、字母和下划线组成'
    },
    {
      name: '无效用户名 - 包含空格',
      username: 'test user',
      password: 'password123',
      expectSuccess: false,
      expectedError: '用户名只能由数字、字母和下划线组成'
    },
    {
      name: '无效用户名 - 包含连字符',
      username: 'test-user',
      password: 'password123',
      expectSuccess: false,
      expectedError: '用户名只能由数字、字母和下划线组成'
    },
    {
      name: '无效用户名 - 包含点号',
      username: 'test.user',
      password: 'password123',
      expectSuccess: false,
      expectedError: '用户名只能由数字、字母和下划线组成'
    },
    {
      name: '无效用户名 - 包含多个特殊符号',
      username: 'test#user$name',
      password: 'password123',
      expectSuccess: false,
      expectedError: '用户名只能由数字、字母和下划线组成'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`测试: ${testCase.name}`);
      console.log(`  用户名: "${testCase.username}"`);
      
      const result = await sendRegisterRequest(testCase.username, testCase.password);
      
      if (testCase.expectSuccess) {
        if (result.success) {
          console.log('  ✅ 通过 - 注册成功\n');
          passed++;
        } else {
          console.log(`  ❌ 失败 - 期望成功但收到错误: ${result.error}\n`);
          failed++;
        }
      } else {
        if (!result.success && result.error === testCase.expectedError) {
          console.log(`  ✅ 通过 - 正确拒绝，错误信息: ${result.error}\n`);
          passed++;
        } else {
          console.log(`  ❌ 失败 - 期望错误 "${testCase.expectedError}" 但收到: ${result.error || '成功'}\n`);
          failed++;
        }
      }
      
      // 等待一小段时间避免IP限制
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`  ❌ 失败 - 请求异常: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('=== 测试结果汇总 ===');
  console.log(`总计: ${testCases.length} 个测试`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log(`通过率: ${((passed / testCases.length) * 100).toFixed(2)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️  存在失败的测试，请检查代码');
    process.exit(1);
  }
}

// 执行测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
