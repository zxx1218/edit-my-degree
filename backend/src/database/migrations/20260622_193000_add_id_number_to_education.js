/**
 * 数据库迁移脚本：为 education 表添加 id_number 字段
 * 
 * 执行时间：2026-06-22
 * 描述：为了支持自考本科的证件号码显示功能，需要在 education 表中添加 id_number 字段
 */

// 加载环境变量
const path = require('path');
// migrations 目录在: backend/src/database/migrations/
// .env 在: project_root/.env
// 需要向上 4 级: migrations -> database -> src -> backend -> root
const envPath = path.resolve(__dirname, '../../../../.env');
console.log('尝试加载环境变量文件:', envPath);

const result = require('dotenv').config({ path: envPath });

if (result.error) {
  console.error('加载 .env 文件失败:', result.error);
} else {
  console.log('✓ 环境变量加载成功');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***已设置***' : '未设置');
  console.log('DB_NAME:', process.env.DB_NAME);
}

// 添加 console.safe 的 polyfill（用于非 PM2 环境）
if (!console.safe) {
  console.safe = console.log;
}

const dbManager = require('../../db-utils');

async function addIdNumberToEducationTable() {
  let pool;
  
  try {
    console.log('开始执行迁移：为 education 表添加 id_number 字段...');
    
    // 获取数据库连接池
    pool = await dbManager.initializePool();
    
    // 检查字段是否已存在
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'education' 
        AND COLUMN_NAME = 'id_number'
    `);
    
    if (columns.length > 0) {
      console.log('id_number 字段已存在，跳过迁移');
      return;
    }
    
    // 添加 id_number 字段
    await pool.execute(`
      ALTER TABLE education 
      ADD COLUMN id_number TEXT AFTER certificate_number
    `);
    
    console.log('✓ 成功为 education 表添加 id_number 字段');
    
  } catch (error) {
    console.error('✗ 迁移失败:', error.message);
    throw error;
  } finally {
    // 关闭连接池
    if (pool) {
      try {
        await pool.end();
        console.log('数据库连接已关闭');
      } catch (err) {
        console.error('关闭数据库连接时出错:', err.message);
      }
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addIdNumberToEducationTable()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = addIdNumberToEducationTable;
