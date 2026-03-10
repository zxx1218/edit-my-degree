// 测试 IP归属地查询和中国 IP 判断功能
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
  
  for (const ip of testIPs) {
    console.log(`\n测试 IP: ${ip}`);
    console.log('-------------------');
    
    try {
      // 测试归属地查询
      const location= await queryIPLocation(ip);
      console.log(`归属地：${location}`);
      
      // 测试是否为中国 IP
      const isChina = await isChinaIP(ip);
      console.log(`是否为中国 IP: ${isChina ? '是' : '否'}`);
      
    } catch (error) {
      console.error(`测试失败：${error.message}`);
    }
  }
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
testIPFunctions().catch(console.error);
