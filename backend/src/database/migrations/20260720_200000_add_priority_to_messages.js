/**
 * 为messages表添加priority字段
 * 用于控制留言展示顺序：priority值越小越靠前，NULL值按时间倒序排在后面
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

async function addPriorityColumn() {
  let pool;
  
  try {
    console.log('开始执行迁移：为 messages 表添加 priority 字段...');
    
    // 初始化数据库连接池
    pool = await dbManager.initializePool();
    
    // 检查字段是否已存在
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'priority'"
    );
    
    if (columns.length > 0) {
      console.log('priority 字段已存在，跳过添加');
      return;
    }
    
    // 添加 priority 字段（INT类型，允许NULL，默认值为NULL）
    await pool.execute(
      "ALTER TABLE messages ADD COLUMN priority INT DEFAULT NULL COMMENT '留言优先级：数字越小越靠前，NULL表示无优先级按时间排序'"
    );
    
    console.log('✓ 成功添加 priority 字段到 messages 表');
  } catch (err) {
    console.error('添加 priority 字段失败:', err);
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
  addPriorityColumn()
    .then(() => {
      console.log('✓ 迁移完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('✗ 迁移失败:', err);
      process.exit(1);
    });
}

module.exports = { addPriorityColumn };
