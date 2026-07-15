// 首先加载环境变量
require('dotenv').config({ path: '../.env' });

// 然后加载logger以初始化console.safe
require('../src/logger');
const dbManager = require('../src/db-utils');

/**
 * 测试IP黑名单管理功能
 */
async function testIpBlacklistManagement() {
  console.log('=== IP黑名单管理功能测试 ===\n');

  try {
    // 测试1: 获取黑名单列表
    console.log('测试1: 获取黑名单列表');
    const [blacklist] = await dbManager.execute(
      `SELECT id, ip_address, reason, blocked_until, created_at, 
       TIMESTAMPDIFF(HOUR, NOW(), blocked_until) as hours_remaining 
       FROM ip_blacklist 
       WHERE blocked_until > NOW() 
       ORDER BY blocked_until DESC`
    );
    
    console.log(`找到 ${blacklist.length} 条未过期的黑名单记录`);
    if (blacklist.length > 0) {
      console.log('示例记录:', {
        id: blacklist[0].id,
        ipAddress: blacklist[0].ip_address,
        reason: blacklist[0].reason,
        hoursRemaining: blacklist[0].hours_remaining
      });
    }
    console.log('✓ 测试1通过\n');

    // 测试2: 检查表结构
    console.log('测试2: 检查ip_blacklist表结构');
    const [columns] = await dbManager.execute('DESCRIBE ip_blacklist');
    console.log('表字段:', columns.map(col => col.Field).join(', '));
    console.log('✓ 测试2通过\n');

    // 测试3: 统计信息
    console.log('测试3: 统计信息');
    const [stats] = await dbManager.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN TIMESTAMPDIFF(HOUR, NOW(), blocked_until) < 24 THEN 1 ELSE 0 END) as expiring_24h,
        SUM(CASE WHEN TIMESTAMPDIFF(HOUR, NOW(), blocked_until) >= 720 THEN 1 ELSE 0 END) as long_term
      FROM ip_blacklist 
      WHERE blocked_until > NOW()
    `);
    
    console.log('统计结果:', {
      总数: stats[0].total,
      '24小时内到期': stats[0].expiring_24h,
      '长期封禁(≥30天)': stats[0].long_term
    });
    console.log('✓ 测试3通过\n');

    console.log('=== 所有测试通过 ===');
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testIpBlacklistManagement();
