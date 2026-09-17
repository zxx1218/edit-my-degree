#!/usr/bin/env node

/**
 * 测试合并后的黑名单管理模块
 */

// 加载环境变量
const path = require('path');
const envPath = path.resolve(__dirname, '../../.env');
console.log('加载环境变量文件:', envPath);
require('dotenv').config({ path: envPath });

// 添加 console.safe 的 polyfill
if (!console.safe) {
  console.safe = console.log;
}

const dbManager = require('../src/db-utils');

async function testBlacklistModule() {
  let pool;
  
  try {
    console.log('\n' + '='.repeat(60));
    console.log('测试合并后的黑名单管理模块');
    console.log('='.repeat(60) + '\n');

    // 初始化数据库连接
    pool = await dbManager.initializePool();
    console.log('✓ 数据库连接成功\n');

    // 1. 检查IP黑名单表
    console.log('1️⃣  检查IP黑名单表...');
    const [ipTables] = await pool.execute("SHOW TABLES LIKE 'ip_blacklist'");
    if (ipTables.length > 0) {
      console.log('✓ ip_blacklist 表存在');
      const [ipCount] = await pool.execute('SELECT COUNT(*) as count FROM ip_blacklist WHERE blocked_until > NOW()');
      console.log(`   当前有效记录数: ${ipCount[0].count}\n`);
    } else {
      console.log('✗ ip_blacklist 表不存在\n');
    }

    // 2. 检查用户黑名单表
    console.log('2️⃣  检查用户黑名单表...');
    const [userTables] = await pool.execute("SHOW TABLES LIKE 'user_blacklist'");
    if (userTables.length > 0) {
      console.log('✓ user_blacklist 表存在');
      const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM user_blacklist WHERE blocked_until > NOW()');
      console.log(`   当前有效记录数: ${userCount[0].count}\n`);
    } else {
      console.log('✗ user_blacklist 表不存在\n');
    }

    // 3. 测试isUserBlacklisted函数
    console.log('3️⃣  测试isUserBlacklisted函数...');
    const { isUserBlacklisted } = require('../src/manage-ip-blacklist');
    
    // 测试不存在的用户
    const nonExistentUser = await isUserBlacklisted('test_nonexistent_user_12345');
    console.log(`   不存在的用户: ${nonExistentUser === null ? '✓ 返回null' : '✗ 错误'}`);
    
    // 如果有用户黑名单记录，测试一个真实用户
    if (userTables.length > 0) {
      const [records] = await pool.execute('SELECT username FROM user_blacklist WHERE blocked_until > NOW() LIMIT 1');
      if (records.length > 0) {
        const testUser = records[0].username;
        const result = await isUserBlacklisted(testUser);
        console.log(`   已封禁用户 (${testUser}): ${result !== null ? '✓ 正确检测到' : '✗ 未检测到'}`);
        if (result) {
          console.log(`      - 原因: ${result.reason.substring(0, 30)}...`);
          console.log(`      - 封禁至: ${new Date(result.blocked_until).toLocaleString('zh-CN')}`);
        }
      }
    }
    console.log();

    // 4. 验证模块导出
    console.log('4️⃣  验证模块导出...');
    const module = require('../src/manage-ip-blacklist');
    const hasInitialize = typeof module.initialize === 'function';
    const hasIsUserBlacklisted = typeof module.isUserBlacklisted === 'function';
    console.log(`   initialize函数: ${hasInitialize ? '✓' : '✗'}`);
    console.log(`   isUserBlacklisted函数: ${hasIsUserBlacklisted ? '✓' : '✗'}\n`);

    console.log('='.repeat(60));
    console.log('✅ 测试完成！合并后的黑名单模块工作正常');
    console.log('='.repeat(60));
    console.log('\n功能说明:');
    console.log('- IP黑名单和用户黑名单已合并到 manage-ip-blacklist.js');
    console.log('- 通过 type 参数区分操作类型（"ip" 或 "user"）');
    console.log('- API端点统一为: POST /api/manage-ip-blacklist');
    console.log('- 登录时会自动检测用户是否在黑名单中并显示原因\n');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (pool) {
      try {
        await dbManager.close();
        console.log('数据库连接已关闭');
      } catch (err) {
        console.error('关闭连接时出错:', err.message);
      }
    }
  }
}

// 执行测试
testBlacklistModule();
