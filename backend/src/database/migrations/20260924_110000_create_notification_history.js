const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../../.env' });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'degree_management'
  });

  try {
    console.log('开始创建通知历史表...');

    // 创建notification_history表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notification_history (
        id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '通知唯一标识ID',
        channel ENUM('bark', 'email') NOT NULL COMMENT '通知渠道：bark-Bark推送, email-邮件',
        title TEXT NOT NULL COMMENT '通知标题',
        body TEXT NOT NULL COMMENT '通知正文',
        recipient TEXT COMMENT '接收者（Bark设备密钥或邮箱地址）',
        \`group\` TEXT COMMENT '消息分组',
        level TEXT COMMENT '推送级别',
        sound TEXT COMMENT '铃声',
        status ENUM('success', 'failed') NOT NULL DEFAULT 'success' COMMENT '发送状态：success-成功, failed-失败',
        error_message TEXT COMMENT '错误信息（失败时记录）',
        metadata JSON COMMENT '额外元数据（JSON格式）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
        INDEX idx_channel (channel),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知历史记录表'
    `);

    console.log('✅ 通知历史表创建成功');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
