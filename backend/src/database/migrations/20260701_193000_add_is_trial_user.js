/**
 * 为users表添加is_trial_user字段
 * 用于标记用户是否为体验版用户
 */

// 加载环境变量
const path = require('path');
const envPath = path.resolve(__dirname, '../../../../.env');
const result = require('dotenv').config({ path: envPath });

if (result.error) {
  console.error('加载 .env 文件失败:', result.error);
} else {
  console.log('✓ 环境变量加载成功');
}

// 添加 console.safe 的 polyfill（用于非 PM2 环境）
if (!console.safe) {
  console.safe = console.log;
}

const dbManager = require('../../db-utils');

async function addIsTrialUserColumn() {
  let pool;
  
  try {
    console.log('开始执行迁移：为 users 表添加 is_trial_user 字段...');
    
    // 初始化数据库连接池
    pool = await dbManager.initializePool();
    
    // 检查字段是否已存在
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_trial_user'"
    );
    
    if (columns.length > 0) {
      console.log('is_trial_user 字段已存在，跳过添加');
      return;
    }
    
    // 添加 is_trial_user 字段（TINYINT类型，允许NULL，默认值为NULL）
    await pool.execute(
      "ALTER TABLE users ADD COLUMN is_trial_user TINYINT(1) DEFAULT NULL COMMENT '是否为体验版用户: NULL-未设置, 1-是, 0-否'"
    );
    
    console.log('✓ 成功添加 is_trial_user 字段到 users 表');
  } catch (err) {
    console.error('添加 is_trial_user 字段失败:', err);
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
  addIsTrialUserColumn()
    .then(() => {
      console.log('✓ 迁移完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('✗ 迁移失败:', err);
      process.exit(1);
    });
}

module.exports = { addIsTrialUserColumn };
