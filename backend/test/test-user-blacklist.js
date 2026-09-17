const dbManager = require('../src/db-utils');

/**
 * 测试用户黑名单功能
 */
async function testUserBlacklist() {
  try {
    console.log('=== 开始测试用户黑名单功能 ===\n');

    // 初始化数据库连接
    await dbManager.initializePool();
    console.log('✓ 数据库连接成功\n');

    // 1. 检查user_blacklist表是否存在
    const [tables] = await dbManager.execute(
      "SHOW TABLES LIKE 'user_blacklist'"
    );
    
    if (tables.length === 0) {
      console.error('✗ user_blacklist表不存在，请先运行数据库迁移脚本');
      process.exit(1);
    }
    console.log('✓ user_blacklist表存在\n');

    // 2. 查看表结构
    const [columns] = await dbManager.execute('DESCRIBE user_blacklist');
    console.log('表结构:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    console.log();

    // 3. 查询现有记录
    const [records] = await dbManager.execute(
      'SELECT id, username, reason, blocked_until, created_at, created_by FROM user_blacklist ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log(`当前黑名单记录数: ${records.length}`);
    if (records.length > 0) {
      console.log('\n最近5条记录:');
      records.forEach((record, index) => {
        const blockedUntil = new Date(record.blocked_until);
        const now = new Date();
        const isExpired = blockedUntil < now;
        
        console.log(`  ${index + 1}. 用户名: ${record.username}`);
        console.log(`     原因: ${record.reason}`);
        console.log(`     封禁至: ${blockedUntil.toLocaleString('zh-CN')}`);
        console.log(`     状态: ${isExpired ? '已过期' : '有效'}`);
        console.log(`     操作者: ${record.created_by || '未知'}`);
        console.log();
      });
    } else {
      console.log('(暂无记录)\n');
    }

    // 4. 测试查询功能
    console.log('测试查询功能...');
    const [testRecords] = await dbManager.execute(
      'SELECT id, username, reason, blocked_until, TIMESTAMPDIFF(HOUR, NOW(), blocked_until) as hours_remaining FROM user_blacklist WHERE blocked_until > NOW() ORDER BY created_at DESC'
    );
    console.log(`✓ 未过期记录数: ${testRecords.length}\n`);

    console.log('=== 测试完成 ===');
    process.exit(0);
  } catch (error) {
    console.error('✗ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行测试
testUserBlacklist();
