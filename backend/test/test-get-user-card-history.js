const axios = require('axios');
require('dotenv').config();

// 测试获取用户卡密历史记录API
async function testGetUserCardHistory() {
  console.log('=== 测试获取用户卡密历史记录API ===\n');

  try {
    // 第一步：管理员登录获取token
    console.log('1. 管理员登录...');
    const loginResponse = await axios.post(
      'http://localhost:3001/api/admin-auth',
      {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      }
    );

    if (!loginResponse.data.success) {
      throw new Error('管理员登录失败: ' + loginResponse.data.error);
    }

    const token = loginResponse.data.token;
    console.log('✓ 登录成功，获取到token\n');

    // 第二步：获取所有用户列表，选择一个有卡密记录的用户
    console.log('2. 获取用户列表...');
    const usersResponse = await axios.post(
      'http://localhost:3001/api/get-all-users',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!usersResponse.data.success) {
      throw new Error('获取用户列表失败: ' + usersResponse.data.error);
    }

    const users = usersResponse.data.users;
    if (users.length === 0) {
      console.log('⚠ 没有用户，无法测试');
      return;
    }

    // 选择第一个用户进行测试
    const testUser = users[0];
    console.log(`✓ 找到 ${users.length} 个用户`);
    console.log(`  测试用户: ${testUser.username}\n`);

    // 第三步：获取该用户的卡密历史记录
    console.log('3. 获取用户卡密历史记录...');
    const historyResponse = await axios.post(
      'http://localhost:3001/api/get-user-card-history',
      { username: testUser.username },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!historyResponse.data.success) {
      throw new Error('获取卡密历史失败: ' + historyResponse.data.error);
    }

    const cards = historyResponse.data.cards;
    console.log(`✓ 获取成功！`);
    console.log(`  共找到 ${cards.length} 条卡密记录\n`);

    if (cards.length > 0) {
      console.log('卡密记录详情:');
      cards.forEach((card, index) => {
        console.log(`\n  [${index + 1}] ${card.card_type_label}`);
        console.log(`      ID: ${card.id}`);
        console.log(`      类型: ${card.type}`);
        console.log(`      充值数量: ${card.values}`);
        console.log(`      使用时间: ${card.used_at}`);
      });
    } else {
      console.log('  该用户尚未使用过任何卡密');
    }

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testGetUserCardHistory();
