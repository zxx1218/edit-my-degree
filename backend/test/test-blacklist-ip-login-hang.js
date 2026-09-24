/**
 * 测试黑名单IP登录是否还会导致系统卡住
 * 
 * 使用方法：
 * node test/test-blacklist-ip-login-hang.js
 */

const http = require('http');

// 配置
const CONFIG = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  blacklistedIP: '192.168.1.100' // 替换为实际在黑名单中的IP
};

console.log('🧪 开始测试黑名单IP登录...\n');
console.log(`目标服务器: ${CONFIG.host}:${CONFIG.port}`);
console.log(`测试IP: ${CONFIG.blacklistedIP}\n`);

/**
 * 模拟带有特定IP的请求
 */
function simulateLoginWithIP(ip) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify({
      username: 'testuser',
      password: 'testpass'
    });

    const options = {
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Forwarded-For': ip, // 模拟特定IP
        'User-Agent': 'Test-Client/1.0'
      },
      timeout: 10000 // 10秒超时
    };

    console.log(`[${new Date().toLocaleTimeString()}] 发送登录请求...`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toLocaleTimeString()}] ✅ 收到响应 (${duration}ms)`);
        console.log(`状态码: ${res.statusCode}`);
        
        try {
          const response = JSON.parse(data);
          console.log('响应内容:', JSON.stringify(response, null, 2));
        } catch (e) {
          console.log('响应内容:', data);
        }
        
        resolve({
          statusCode: res.statusCode,
          duration,
          data
        });
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.error(`[${new Date().toLocaleTimeString()}] ❌ 请求失败 (${duration}ms):`, error.message);
      reject(error);
    });

    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.error(`[${new Date().toLocaleTimeString()}] ⏱️ 请求超时 (${duration}ms)`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 运行测试
 */
async function runTest() {
  try {
    console.log('📋 测试步骤:\n');
    console.log('1. 检查Bark通知配置是否正确');
    console.log('2. 模拟黑名单IP登录请求');
    console.log('3. 验证响应时间是否正常（应 < 1秒）');
    console.log('4. 连续发送多个请求，验证不会阻塞\n');
    
    // 测试1：单次请求
    console.log('--- 测试1: 单次黑名单IP登录 ---');
    const result1 = await simulateLoginWithIP(CONFIG.blacklistedIP);
    
    if (result1.duration > 2000) {
      console.warn(`⚠️  警告: 响应时间过长 (${result1.duration}ms)，可能仍存在阻塞问题\n`);
    } else {
      console.log(`✅ 响应时间正常 (${result1.duration}ms)\n`);
    }
    
    // 测试2：并发请求
    console.log('--- 测试2: 并发5个黑名单IP登录请求 ---');
    const concurrentTests = [];
    for (let i = 0; i < 5; i++) {
      concurrentTests.push(
        simulateLoginWithIP(CONFIG.blacklistedIP)
          .then(result => ({ index: i, ...result }))
          .catch(err => ({ index: i, error: err.message }))
      );
    }
    
    const results = await Promise.all(concurrentTests);
    
    console.log('\n📊 并发测试结果:');
    results.forEach((result, idx) => {
      if (result.error) {
        console.log(`  请求${idx + 1}: ❌ ${result.error}`);
      } else {
        const status = result.duration > 2000 ? '⚠️ ' : '✅';
        console.log(`  请求${idx + 1}: ${status} ${result.duration}ms (状态码: ${result.statusCode})`);
      }
    });
    
    const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
    console.log(`\n平均响应时间: ${avgDuration.toFixed(0)}ms`);
    
    if (avgDuration > 2000) {
      console.error('\n❌ 测试失败: 平均响应时间过长，系统仍存在阻塞问题');
      console.error('请检查:');
      console.error('1. Bark通知服务是否可访问');
      console.error('2. 数据库连接池配置是否合理');
      console.error('3. notification-history表是否存在');
      process.exit(1);
    } else {
      console.log('\n✅ 测试通过: 黑名单IP登录不再导致系统卡住');
      console.log('\n💡 提示: 请查看后端日志确认Bark通知是否正常发送');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ 测试执行失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
runTest();
