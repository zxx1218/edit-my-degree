/**
 * 二维码404问题诊断脚本
 * 
 * 使用方法：
 * node test/diagnose-qr-issue.js
 */

const mysql = require('mysql2/promise');
const http = require('http');
const https = require('https');
const { URL } = require('url');
require('dotenv').config();

console.log('========================================');
console.log('  二维码404问题诊断工具');
console.log('========================================\n');

async function diagnose() {
  const results = [];
  
  // 1. 检查数据库连接
  console.log('📡 [1/6] 检查数据库连接...');
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '991218aa',
      database: process.env.DB_NAME || 'degree_management'
    });
    console.log('   ✅ 数据库连接成功\n');
    results.push({ step: '数据库连接', status: 'PASS' });
  } catch (error) {
    console.log(`   ❌ 数据库连接失败: ${error.message}\n`);
    results.push({ step: '数据库连接', status: 'FAIL', error: error.message });
    return printResults(results);
  }
  
  // 2. 检查qr_code_urls表是否存在
  console.log('📊 [2/6] 检查qr_code_urls表...');
  try {
    const [tables] = await connection.execute("SHOW TABLES LIKE 'qr_code_urls'");
    if (tables.length === 0) {
      console.log('   ❌ qr_code_urls表不存在\n');
      console.log('   💡 解决方案: 重启后端服务以自动创建表');
      results.push({ step: '数据表存在性', status: 'FAIL', error: '表不存在' });
      await connection.end();
      return printResults(results);
    }
    console.log('   ✅ qr_code_urls表存在\n');
    results.push({ step: '数据表存在性', status: 'PASS' });
  } catch (error) {
    console.log(`   ❌ 检查表失败: ${error.message}\n`);
    results.push({ step: '数据表存在性', status: 'FAIL', error: error.message });
    await connection.end();
    return printResults(results);
  }
  
  // 3. 检查是否有短码记录
  console.log('🔍 [3/6] 检查短码记录...');
  try {
    const [rows] = await connection.execute('SELECT short_code, pdf_type, full_url FROM qr_code_urls ORDER BY created_at DESC LIMIT 5');
    if (rows.length === 0) {
      console.log('   ⚠️  暂无短码记录（这是正常的，如果还未生成PDF）\n');
      results.push({ step: '短码记录', status: 'WARNING', note: '无记录' });
    } else {
      console.log(`   ✅ 找到 ${rows.length} 条短码记录:`);
      rows.forEach((row, index) => {
        console.log(`      ${index + 1}. 短码: ${row.short_code}, 类型: ${row.pdf_type}`);
        console.log(`         URL长度: ${row.full_url.length} 字符`);
      });
      console.log('');
      results.push({ step: '短码记录', status: 'PASS', count: rows.length });
    }
  } catch (error) {
    console.log(`   ❌ 查询失败: ${error.message}\n`);
    results.push({ step: '短码记录', status: 'FAIL', error: error.message });
  }
  
  // 4. 测试短码查询功能
  if (rows && rows.length > 0) {
    console.log('🧪 [4/6] 测试短码查询功能...');
    const testShortCode = rows[0].short_code;
    try {
      const [result] = await connection.execute(
        'SELECT full_url, pdf_type, expires_at, scan_count FROM qr_code_urls WHERE short_code = ?',
        [testShortCode]
      );
      if (result.length > 0) {
        console.log(`   ✅ 短码查询成功: ${testShortCode}`);
        console.log(`      类型: ${result[0].pdf_type}`);
        console.log(`      扫描次数: ${result[0].scan_count}`);
        if (result[0].expires_at) {
          const expiresAt = new Date(result[0].expires_at);
          console.log(`      过期时间: ${expiresAt.toLocaleString('zh-CN')}`);
        }
        console.log('');
        results.push({ step: '短码查询', status: 'PASS' });
      } else {
        console.log(`   ❌ 未找到短码: ${testShortCode}\n`);
        results.push({ step: '短码查询', status: 'FAIL' });
      }
    } catch (error) {
      console.log(`   ❌ 查询测试失败: ${error.message}\n`);
      results.push({ step: '短码查询', status: 'FAIL', error: error.message });
    }
  }
  
  await connection.end();
  
  // 5. 检查后端服务状态
  console.log('🖥️  [5/6] 检查后端服务...');
  const backendPort = process.env.PORT || 20000;
  const backendUrl = `http://localhost:${backendPort}`;
  
  try {
    const response = await makeRequest(`${backendUrl}/api/get-today-login-count`, 'POST', {});
    if (response.statusCode === 200 || response.statusCode === 401) {
      console.log(`   ✅ 后端服务运行正常 (端口: ${backendPort})\n`);
      results.push({ step: '后端服务', status: 'PASS', port: backendPort });
    } else {
      console.log(`   ⚠️  后端服务响应异常: ${response.statusCode}\n`);
      results.push({ step: '后端服务', status: 'WARNING', statusCode: response.statusCode });
    }
  } catch (error) {
    console.log(`   ❌ 后端服务无法访问: ${error.message}\n`);
    console.log('   💡 解决方案: 启动后端服务 (pm2 start all 或 npm start)');
    results.push({ step: '后端服务', status: 'FAIL', error: error.message });
  }
  
  // 6. 检查Nginx配置
  console.log('🌐 [6/6] 检查Nginx配置...');
  const nginxHost = process.env.NGINX_HOST || 'cheerout.cn';
  const nginxPort = process.env.NGINX_PORT || 9092;
  
  console.log(`   ℹ️  请手动检查以下配置:`);
  console.log(`      1. Nginx配置文件是否包含 /qr/ location块`);
  console.log(`      2. proxy_pass 是否指向正确的后端端口 (${backendPort})`);
  console.log(`      3. 运行命令: sudo nginx -t 测试配置语法`);
  console.log(`      4. 运行命令: sudo systemctl reload nginx 重新加载`);
  console.log('');
  results.push({ step: 'Nginx配置', status: 'MANUAL_CHECK', note: '需手动验证' });
  
  // 打印总结
  printResults(results);
  
  // 提供修复建议
  printFixSuggestions(results);
}

function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = (parsedUrl.protocol === 'https:' ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        res.body = body;
        resolve(res);
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function printResults(results) {
  console.log('========================================');
  console.log('  诊断结果总结');
  console.log('========================================\n');
  
  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : 
                 result.status === 'FAIL' ? '❌' : 
                 result.status === 'WARNING' ? '⚠️ ' : 'ℹ️ ';
    console.log(`${icon} ${index + 1}. ${result.step}: ${result.status}`);
    if (result.error) {
      console.log(`      错误: ${result.error}`);
    }
    if (result.note) {
      console.log(`      说明: ${result.note}`);
    }
  });
  
  console.log('\n========================================\n');
}

function printFixSuggestions(results) {
  const failedSteps = results.filter(r => r.status === 'FAIL');
  
  if (failedSteps.length === 0) {
    console.log('✅ 所有检查项通过！\n');
    console.log('如果仍然出现404，请检查:');
    console.log('1. Nginx配置是否正确添加 /qr/ location块');
    console.log('2. 后端服务是否已重启 (pm2 restart all)');
    console.log('3. 查看后端日志: pm2 logs');
    console.log('4. 查看Nginx错误日志: sudo tail -f /var/log/nginx/error.log');
  } else {
    console.log('❌ 发现问题，请按以下步骤修复:\n');
    
    failedSteps.forEach(step => {
      console.log(`【${step.step}】`);
      if (step.step === '数据库连接') {
        console.log('  → 检查MySQL服务是否运行: sudo systemctl status mysql');
        console.log('  → 检查.env文件中的数据库配置是否正确');
      } else if (step.step === '数据表存在性') {
        console.log('  → 重启后端服务: pm2 restart all');
        console.log('  → 或手动执行SQL创建表（见database/init.js）');
      } else if (step.step === '后端服务') {
        console.log('  → 启动后端服务: cd backend && pm2 start all');
        console.log('  → 或: cd backend && npm start');
        console.log('  → 检查端口是否被占用: netstat -tlnp | grep 20000');
      }
      console.log('');
    });
  }
  
  console.log('\n📖 详细文档请参考:');
  console.log('   - backend/nginx_config/QR_CODE_NGINX_UPDATE.md');
  console.log('   - backend/src/pdf-generators/QR_CODE_OPTIMIZATION.md');
  console.log('   - QRCODE_OPTIMIZATION_GUIDE.md');
  console.log('');
}

diagnose().catch(error => {
  console.error('诊断过程出错:', error);
  process.exit(1);
});
