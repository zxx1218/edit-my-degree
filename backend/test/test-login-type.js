/**
 * 测试登录类型功能
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function testLoginType() {
  console.log('=== 测试登录类型功能 ===\n');
  
  // 步骤1: 管理员登录
  console.log('步骤1: 管理员登录...');
  try {
    const adminResponse = await axios.post(`${API_BASE_URL}/admin-auth`, {
      username: 'admin',
      password: 'admin123' // 请根据实际情况修改
    });
    
    if (adminResponse.data.success) {
      console.log('✓ 管理员登录成功');
      const adminToken = adminResponse.data.token;
      
      // 步骤2: 获取今日登录详情
      console.log('\n步骤2: 获取今日登录详情...');
      const detailsResponse = await axios.post(
        `${API_BASE_URL}/get-today-login-details`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (detailsResponse.data.success) {
        console.log('✓ 成功获取今日登录详情');
        const loginDetails = detailsResponse.data.loginDetails;
        
        if (loginDetails.length === 0) {
          console.log('   今日暂无登录记录');
        } else {
          console.log(`   共有 ${loginDetails.length} 个用户登录\n`);
          
          loginDetails.forEach((user, index) => {
            console.log(`${index + 1}. 用户: ${user.username}`);
            console.log(`   登录次数: ${user.loginCount}`);
            console.log('   登录时间详情:');
            
            user.loginTimes.forEach((item, timeIndex) => {
              const typeLabel = item.type === 'admin_impersonate' 
                ? '🔴 管理员代登' 
                : '🔵 普通登录';
              console.log(`     ${timeIndex + 1}. ${item.time} - ${typeLabel}`);
            });
            console.log();
          });
        }
      } else {
        console.log('✗ 获取登录详情失败:', detailsResponse.data.error);
      }
    } else {
      console.log('✗ 管理员登录失败:', adminResponse.data.error);
    }
  } catch (error) {
    console.log('✗ 请求失败:', error.response?.data?.error || error.message);
  }
  
  console.log('\n=== 测试完成 ===');
}

testLoginType();
