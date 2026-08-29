/**
 * 为login_logs表添加login_type字段
 * 用于区分普通用户登录和管理员代登录
 * 
 * login_type值说明：
 * - 'normal': 普通用户通过网页端登录
 * - 'admin_impersonate': 管理员代用户登录（不消耗积分）
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

async function addLoginTypeColumn() {
  let pool;
  
  try {
    console.log('开始执行迁移：为 login_logs 表添加 login_type 字段...');
    
    // 初始化数据库连接池
    pool = await dbManager.initializePool();
    
    // 检查字段是否已存在
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_logs' AND COLUMN_NAME = 'login_type'"
    );
    
    if (columns.length > 0) {
      console.log('login_type 字段已存在，跳过添加');
    } else {
      // 添加 login_type 字段
      await pool.execute(
        "ALTER TABLE login_logs ADD COLUMN login_type VARCHAR(20) DEFAULT 'normal' COMMENT '登录类型：normal-普通用户登录, admin_impersonate-管理员代登录' AFTER ip_location"
      );
      
      console.log('✓ 成功添加 login_type 字段到 login_logs 表');
    }
    
    // 更新现有记录的login_type字段（设置为默认值）
    const [result] = await pool.execute(
      "UPDATE login_logs SET login_type = 'normal' WHERE login_type IS NULL"
    );
    
    console.log(`✓ 更新了 ${result.affectedRows || 0} 条记录的 login_type 字段`);
    console.log('\n迁移完成！');
    console.log('login_type字段说明：');
    console.log('  - normal: 普通用户通过网页端登录');
    console.log('  - admin_impersonate: 管理员代用户登录（不消耗积分）');
    
  } catch (err) {
    console.error('添加 login_type 字段失败:', err);
    throw err;
  } finally {
    // 关闭数据库连接池
    if (pool) {
      await pool.end();
      console.log('\n数据库连接池已关闭');
    }
  }
}

// 执行迁移
if (require.main === module) {
  addLoginTypeColumn().catch(err => {
    console.error('迁移执行失败:', err);
    process.exit(1);
  });
}

module.exports = addLoginTypeColumn;
