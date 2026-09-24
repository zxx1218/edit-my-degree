/**
 * 为users表添加tags字段
 * 用于存储用户标签（JSON数组格式），支持特别关注功能
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

async function addTagsColumn() {
  let pool;
  
  try {
    console.log('开始执行迁移：为 users 表添加 tags 字段...');
    
    // 初始化数据库连接池
    pool = await dbManager.initializePool();
    
    // 检查字段是否已存在
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'tags'"
    );
    
    if (columns.length > 0) {
      console.log('tags 字段已存在，跳过添加');
      return;
    }
    
    // 添加 tags 字段（TEXT类型，允许NULL，存储JSON数组）
    await pool.execute(
      "ALTER TABLE users ADD COLUMN tags TEXT DEFAULT NULL COMMENT '用户标签（JSON数组格式），用于标记特别关注的用户'"
    );
    
    console.log('✓ 成功添加 tags 字段到 users 表');
    console.log('标签存储格式示例: ["VIP", "问题用户", "测试账号"]');
  } catch (err) {
    console.error('添加 tags 字段失败:', err);
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
  addTagsColumn()
    .then(() => {
      console.log('✓ 迁移完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('✗ 迁移失败:', err);
      process.exit(1);
    });
}

module.exports = { addTagsColumn };
