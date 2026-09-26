const dbManager = require('../../db-utils');

async function createPasswordChangeHistoryTable() {
  try {
    // 初始化连接池（如果尚未初始化）
    if (!dbManager.pool) {
      await dbManager.initializePool();
    }
    
    // 设置时区
    await dbManager.execute("SET time_zone = '+08:00'");
    
    // 创建密码修改历史表
    await dbManager.execute(`
      CREATE TABLE IF NOT EXISTS password_change_history (
        id VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY COMMENT '记录唯一标识ID',
        user_id VARCHAR(36) NOT NULL COMMENT '关联的用户ID',
        username VARCHAR(255) NOT NULL COMMENT '用户名',
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
        ip_address VARCHAR(45) COMMENT 'IP地址',
        user_agent TEXT COMMENT 'User-Agent',
        result ENUM('success', 'failed') NOT NULL DEFAULT 'success' COMMENT '操作结果：success-成功, failed-失败',
        is_admin_operation TINYINT(1) DEFAULT 0 COMMENT '是否为管理员操作：0-否, 1-是',
        operator_username VARCHAR(255) COMMENT '操作者用户名（管理员代改时记录）',
        reason TEXT COMMENT '失败原因（失败时记录）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
        INDEX idx_username (username),
        INDEX idx_changed_at (changed_at),
        INDEX idx_result (result)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='密码修改历史记录表'
    `);
    
    console.safe('[数据库迁移] 密码修改历史表创建成功');
  } catch (err) {
    console.error('[数据库迁移] 创建密码修改历史表失败:', err.message);
    throw err;
  }
}

// 执行迁移
if (require.main === module) {
  createPasswordChangeHistoryTable()
    .then(() => {
      console.safe('迁移完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('迁移失败:', err);
      process.exit(1);
    });
}

module.exports = {
  createPasswordChangeHistoryTable
};
