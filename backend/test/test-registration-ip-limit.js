// 测试注册接口的 IP 频率限制功能
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
async function sendRegisterRequest(username, password, testIp) {
  const url = '/api/register';
  const method = 'POST';
  const timestamp = Date.now().toString();
  
  const params = { username, password };
  const signature = generateSignature(method, url, params, timestamp);
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp,
    'X-Signature': signature,
    'X-App-Key': APP_KEY,
    'X-Forwarded-For': testIp // 模拟特定 IP 地址
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
 * 测试同一 IP 频繁注册被限制
 */
async function testIPRegistrationLimit() {
  console.log('=== 测试同一 IP 频繁注册限制 ===\n');
  
  const testIp = '103.151.173.206'; // 使用一个测试 IP
  const results = [];
  
  // 尝试用同一个 IP 注册多个账户
  for (let i = 1; i <= 5; i++) {
   const username = `test_user_${Date.now()}_${i}`;
   const password = 'Test123456!';
    
   console.log(`第 ${i} 次注册：${username}`);
    
   try {
     const result = await sendRegisterRequest(username, password, testIp);
      results.push(result);
      
      if (result.success) {
       console.log(`✓ 注册成功`);
      } else {
       console.log(`✗ 注册失败：${result.error}`);
      }
    } catch (error) {
     console.log(`✗ 请求异常：${error.message}`);
      results.push({ success: false, error: error.message });
    }
    
    // 等待 100ms 避免过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n=== 测试结果统计 ===');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`成功注册：${successCount} 次`);
  console.log(`失败次数：${failCount} 次`);
  
  if (failCount > 0) {
   console.log('✓ IP 频率限制生效！');
  } else {
   console.log('✗ IP 频率限制未生效，存在安全风险！');
  }
}

/**
 * 测试不同 IP 注册不受影响
 */
async function testDifferentIPs() {
  console.log('\n\n=== 测试不同 IP 注册（应正常） ===\n');
  
  const results = [];
  
  // 使用不同的 IP 进行注册
  for (let i = 1; i <= 3; i++) {
   const username = `diff_ip_user_${Date.now()}_${i}`;
   const password = 'Test123456!';
   const testIp = `192.168.1.${i}`; // 不同的 IP
    
   console.log(`第 ${i} 次注册（IP: ${testIp}）：${username}`);
    
   try {
     const result = await sendRegisterRequest(username, password, testIp);
      results.push(result);
      
      if (result.success) {
       console.log(`✓ 注册成功`);
      } else {
       console.log(`✗ 注册失败：${result.error}`);
      }
    } catch (error) {
     console.log(`✗ 请求异常：${error.message}`);
      results.push({ success: false, error: error.message });
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n=== 测试结果统计 ===');
  const successCount = results.filter(r => r.success).length;
  
  if (successCount === 3) {
   console.log('✓ 不同 IP 注册正常，策略合理！');
  } else {
   console.log(`✗ 预期 3 次全部成功，实际成功 ${successCount} 次`);
  }
}

// 运行测试
async function runTests() {
  try {
    await testIPRegistrationLimit();
    await testDifferentIPs();
   console.log('\n=== 所有测试完成 ===');
  } catch(error) {
   console.error('测试执行出错:', error);
  }
}

runTests().catch(console.error);
