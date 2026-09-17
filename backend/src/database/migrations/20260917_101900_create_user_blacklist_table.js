/**
 * 数据库迁移脚本：创建用户黑名单表
 * 
 * 功能说明：
 * - 创建 user_blacklist 表用于存储被封禁的用户信息
 * - 支持管理员将违规用户加入黑名单，禁止其登录
 * - 记录封禁原因、截止时间和操作者
 * 
 * 执行方式：
 * npm run migrate
 * 
 * 回滚方式（如需）：
 * DROP TABLE IF EXISTS user_blacklist;
 */

// 加载环境变量
const path = require('path');
const envPath = path.resolve(__dirname, '../../../../.env');
console.log('加载环境变量文件:', envPath);
require('dotenv').config({ path: envPath });

// 添加 console.safe 的 polyfill（用于非 PM2 环境）
if (!console.safe) {
  console.safe = console.log;
}

const dbManager = require('../../db-utils');

async function migrate(db) {
  try {
    console.log('开始执行迁移: 创建用户黑名单表...');

    // 检查表是否已存在
    const [tables] = await db.execute(
      "SHOW TABLES LIKE 'user_blacklist'"
    );

    if (tables.length > 0) {
      console.log('⚠️  user_blacklist 表已存在，跳过创建');
      return;
    }

    // 创建 user_blacklist 表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_blacklist (
        id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        reason TEXT NOT NULL,
        blocked_until TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        INDEX idx_username (username),
        INDEX idx_blocked_until (blocked_until)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ user_blacklist 表创建成功');

    // 验证表结构
    const [columns] = await db.execute('DESCRIBE user_blacklist');
    console.log('\n表结构验证:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    console.log('\n✓ 迁移完成！');
  } catch (error) {
    console.error('✗ 迁移失败:', error.message);
    throw error;
  }
}

// 如果直接运行此文件，执行迁移
if (require.main === module) {
  (async () => {
    let pool;
    try {
      // 初始化数据库连接
      pool = await dbManager.initializePool();
      console.log('数据库连接池初始化成功\n');

      // 执行迁移
      await migrate(pool);

      console.log('\n迁移脚本执行完成');
    } catch (error) {
      console.error('\n迁移脚本执行失败:', error.message);
      process.exit(1);
    } finally {
      // 关闭数据库连接
      if (pool) {
        try {
          await dbManager.close();
          console.log('数据库连接已关闭');
        } catch (err) {
          console.error('关闭数据库连接时出错:', err.message);
        }
      }
      process.exit(0);
    }
  })();
}

module.exports = { migrate };
