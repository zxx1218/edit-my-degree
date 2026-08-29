/**
 * 验证登录类型功能
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../.env' });

async function verify() {
  console.log('=== 验证登录类型功能 ===\n');
  
  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });
  
  try {
    // 1. 检查字段是否存在
    console.log('1. 检查login_type字段...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'login_logs' 
        AND COLUMN_NAME = 'login_type'
    `, [process.env.DB_NAME]);
    
    if (columns.length > 0) {
      console.log('✓ login_type字段存在');
      console.log(`  - 类型: ${columns[0].COLUMN_TYPE}`);
      console.log(`  - 默认值: ${columns[0].COLUMN_DEFAULT}`);
    } else {
      console.log('✗ login_type字段不存在');
      return;
    }
    
    // 2. 查看今日登录记录
    console.log('\n2. 查看今日登录记录...');
    const [todayLogins] = await connection.execute(`
      SELECT username, login_time, login_type
      FROM login_logs
      WHERE DATE(login_time) = CURDATE()
      ORDER BY login_time DESC
      LIMIT 5
    `);
    
    if (todayLogins.length === 0) {
      console.log('   今日暂无登录记录');
    } else {
      console.log(`   找到 ${todayLogins.length} 条记录:`);
      todayLogins.forEach(record => {
        const typeLabel = record.login_type === 'admin_impersonate' 
          ? '🔴 管理员代登' 
          : '🔵 普通登录';
        const time = new Date(record.login_time).toLocaleTimeString('zh-CN');
        console.log(`   - ${record.username}: ${time} - ${typeLabel}`);
      });
    }
    
    // 3. 统计登录类型分布
    console.log('\n3. 登录类型统计...');
    const [stats] = await connection.execute(`
      SELECT 
        login_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM login_logs), 2) as percentage
      FROM login_logs
      GROUP BY login_type
    `);
    
    stats.forEach(stat => {
      const typeLabel = stat.login_type === 'admin_impersonate' 
        ? '管理员代登' 
        : '普通登录';
      console.log(`   ${typeLabel}: ${stat.count} 次 (${stat.percentage}%)`);
    });
    
    console.log('\n✓ 验证完成！');
    
  } catch (error) {
    console.error('✗ 验证失败:', error.message);
  } finally {
    await connection.end();
  }
}

verify();
