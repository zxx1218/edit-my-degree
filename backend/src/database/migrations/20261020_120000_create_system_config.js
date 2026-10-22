const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'degree_management'
  });

  try {
    console.log('开始创建系统配置表...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_config (
        config_key VARCHAR(100) NOT NULL PRIMARY KEY COMMENT '配置键',
        config_value TEXT NOT NULL COMMENT '配置值',
        description VARCHAR(255) COMMENT '配置描述',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统动态配置表'
    `);

    // 插入默认配置
    const defaultConfigs = [
      ['bark_enabled', 'true', 'Bark推送功能开关'],
      ['bark_sound', 'paymentsuccess', 'Bark推送铃声'],
      ['bark_daily_report_enabled', 'true', '每日收入统计定时推送开关'],
    ];

    for (const [key, value, desc] of defaultConfigs) {
      await connection.execute(
        `INSERT IGNORE INTO system_config (config_key, config_value, description) VALUES (?, ?, ?)`,
        [key, value, desc]
      );
    }

    console.log('✅ 系统配置表创建成功');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
