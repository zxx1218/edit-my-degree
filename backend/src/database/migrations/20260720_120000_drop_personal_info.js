/**
 * 删除student_status表中的personal_info字段
 * 该字段已废弃，gender和birth_date已改为独立字段存储
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

async function dropPersonalInfoColumn() {
  let pool;
  
  try {
    console.log('开始执行迁移：删除 student_status 表中的 personal_info 字段...');
    
    // 初始化数据库连接池
    pool = await dbManager.initializePool();
    
    // 检查字段是否存在
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_status' AND COLUMN_NAME = 'personal_info'"
    );
    
    if (columns.length === 0) {
      console.log('personal_info 字段不存在，跳过删除');
      return;
    }
    
    // 删除 personal_info 字段
    await pool.execute(
      "ALTER TABLE student_status DROP COLUMN personal_info"
    );
    
    console.log('✓ 成功删除 student_status 表中的 personal_info 字段');
    console.log('✓ gender 和 birth_date 现在作为独立字段使用');
  } catch (err) {
    console.error('删除 personal_info 字段失败:', err);
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
  dropPersonalInfoColumn()
    .then(() => {
      console.log('✓ 迁移完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('✗ 迁移失败:', err);
      process.exit(1);
    });
}

module.exports = { dropPersonalInfoColumn };
