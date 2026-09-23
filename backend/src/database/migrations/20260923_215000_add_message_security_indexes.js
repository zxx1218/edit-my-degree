/**
 * 为messages表添加安全相关索引和字段
 * 用于增强留言板防刷能力
 */

const path = require('path');
const envPath = path.resolve(__dirname, '../../../../.env');
const result = require('dotenv').config({ path: envPath });

if (result.error) {
  console.error('加载 .env 文件失败:', result.error);
} else {
  console.log('✓ 环境变量加载成功');
}

// 添加 console.safe 的 polyfill
if (!console.safe) {
  console.safe = console.log;
}

const dbManager = require('../../db-utils');

async function addMessageSecurityEnhancements() {
  let pool;
  
  try {
    console.log('开始执行迁移：增强messages表安全性...');
    
    // 初始化数据库连接池
    pool = await dbManager.initializePool();
    
    // 1. 检查并添加 ip_address 字段
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'ip_address'"
    );
    
    if (columns.length === 0) {
      await pool.execute(
        "ALTER TABLE messages ADD COLUMN ip_address VARCHAR(45) DEFAULT NULL COMMENT '留言者IP地址，用于安全审计和频率控制'"
      );
      console.log('✓ 成功添加 ip_address 字段');
    } else {
      console.log('ip_address 字段已存在，跳过添加');
    }
    
    // 2. 为 username 和 created_at 添加联合索引（加速频率检查查询）
    const [indexes1] = await pool.execute(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND INDEX_NAME = 'idx_username_created_at'"
    );
    
    if (indexes1.length === 0) {
      await pool.execute(
        "ALTER TABLE messages ADD INDEX idx_username_created_at (username, created_at)"
      );
      console.log('✓ 成功添加 idx_username_created_at 索引');
    } else {
      console.log('idx_username_created_at 索引已存在，跳过添加');
    }
    
    // 3. 为 ip_address 和 created_at 添加联合索引（加速IP维度频率检查）
    const [indexes2] = await pool.execute(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND INDEX_NAME = 'idx_ip_created_at'"
    );
    
    if (indexes2.length === 0) {
      await pool.execute(
        "ALTER TABLE messages ADD INDEX idx_ip_created_at (ip_address, created_at)"
      );
      console.log('✓ 成功添加 idx_ip_created_at 索引');
    } else {
      console.log('idx_ip_created_at 索引已存在，跳过添加');
    }
    
    console.log('✓ messages表安全性增强完成');
  } catch (err) {
    console.error('增强messages表安全性失败:', err);
    throw err;
  } finally {
    // 关闭数据库连接
    if (pool) {
      await pool.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addMessageSecurityEnhancements()
    .then(() => {
      console.log('✓ 迁移完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('✗ 迁移失败:', err);
      process.exit(1);
    });
}

module.exports = { addMessageSecurityEnhancements };
