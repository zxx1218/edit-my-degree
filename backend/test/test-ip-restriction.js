// 测试 IP归属地查询和中国 IP 判断功能（包含缓存测试）
const { queryIPLocation, isChinaIP } = require('../src/ip-location');

async function testIPFunctions() {
  console.log('=== IP归属地查询和中国 IP 判断测试 ===\n');
  
  // 测试用例列表
  const testIPs = [
    '114.114.114.114',      // 中国江苏南京
    '8.8.8.8',              // 美国 Google DNS
    '127.0.0.1',            // 本地测试
    '1.2.3.4',              // 未知 IP
    '103.151.173.206'
  ];
  
  console.log('【第一轮测试】首次查询（会调用API）');
  console.log('=====================================\n');
  
  for (const ip of testIPs) {
    console.log(`\n测试 IP: ${ip}`);
    console.log('-------------------');
    
    try {
      const startTime = Date.now();
      
      // 测试归属地查询
      const location = await queryIPLocation(ip);
      const locationTime = Date.now() - startTime;
      console.log(`归属地：${location} (耗时: ${locationTime}ms)`);
      
      // 测试是否为中国 IP
      const chinaStartTime = Date.now();
      const isChina = await isChinaIP(ip);
      const chinaTime = Date.now() - chinaStartTime;
      console.log(`是否为中国 IP: ${isChina ? '是' : '否'} (耗时: ${chinaTime}ms)`);
      
    } catch (error) {
      console.error(`测试失败：${error.message}`);
    }
  }
  
  console.log('\n\n【第二轮测试】重复查询（应该使用缓存，速度更快）');
  console.log('================================================\n');
  
  for (const ip of testIPs) {
    console.log(`\n测试 IP: ${ip}`);
    console.log('-------------------');
    
    try {
      const startTime = Date.now();
      
      // 测试归属地查询（应该命中缓存）
      const location = await queryIPLocation(ip);
      const locationTime = Date.now() - startTime;
      console.log(`归属地：${location} (耗时: ${locationTime}ms) ${locationTime < 10 ? '✓ 缓存命中' : ''}`);
      
      // 测试是否为中国 IP（应该命中缓存）
      const chinaStartTime = Date.now();
      const isChina = await isChinaIP(ip);
      const chinaTime = Date.now() - chinaStartTime;
      console.log(`是否为中国 IP: ${isChina ? '是' : '否'} (耗时: ${chinaTime}ms) ${chinaTime < 10 ? '✓ 缓存命中' : ''}`);
      
    } catch (error) {
      console.error(`测试失败：${error.message}`);
    }
  }
  
  console.log('\n\n【缓存性能对比】');
  console.log('================\n');
  console.log('如果第二轮测试的耗时明显小于第一轮（通常<10ms），说明缓存机制工作正常！');
  console.log('缓存配置：');
  console.log('- 最大缓存条目数: 10000');
  console.log('- 缓存有效期: 24小时');
  console.log('- 自动清理: 当缓存超过限制时删除最旧的50%条目');
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
testIPFunctions().catch(console.error);
