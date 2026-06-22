/**
 * 省份登录统计API测试脚本
 * 用于测试新添加的省份地图功能
 */

const axios = require('axios');

// 配置
const API_BASE_URL = 'http://localhost:3001/api';
const ADMIN_USERNAME = 'admin'; // 请替换为实际的管理员用户名
const ADMIN_PASSWORD = 'admin'; // 请替换为实际的管理员密码

async function testProvinceLoginStats() {
  try {
    console.log('=== 省份登录统计API测试 ===\n');

    // 1. 管理员登录获取token
    console.log('1. 管理员登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/admin-auth`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('管理员登录失败');
    }

    const token = loginResponse.data.token;
    console.log('✓ 登录成功\n');

    // 2. 调用省份统计API
    console.log('2. 获取省份登录统计...');
    const statsResponse = await axios.post(
      `${API_BASE_URL}/get-province-login-stats`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!statsResponse.data.success) {
      throw new Error(`API调用失败: ${statsResponse.data.error}`);
    }

    const data = statsResponse.data;
    console.log('✓ 获取成功\n');

    // 3. 显示统计结果
    console.log('=== 统计结果 ===');
    console.log(`覆盖省份数: ${data.totalProvinces}`);
    console.log(`总登录次数: ${data.totalLogins}`);
    console.log('\nTop 10 省份:');
    console.log('排名 | 省份   | 登录次数 | 用户数');
    console.log('-----|--------|----------|-------');
    
    data.provinceStats.slice(0, 10).forEach((stat, index) => {
      console.log(
        `${String(index + 1).padStart(4)} | ${stat.province.padEnd(6)} | ${String(stat.loginCount).padStart(8)} | ${stat.userCount}`
      );
    });

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testProvinceLoginStats();
