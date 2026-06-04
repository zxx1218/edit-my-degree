const { logOperation } = require('./operation-logger');

/**
 * 删除用户接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                      req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';

    let connection;

    try {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: '请提供用户名'
        });
      }

      // 查找用户
      const [users] = await db.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const userId = users[0].id;

      // 获取独立连接用于事务
      connection = await db.getConnection();

      // 开启事务
      await connection.beginTransaction();

      try {
        // 删除学生状态数据
        await connection.execute('DELETE FROM student_status WHERE user_id = ?', [userId]);
        
        // 删除教育背景数据
        await connection.execute('DELETE FROM education WHERE user_id = ?', [userId]);
        
        // 删除学位数据
        await connection.execute('DELETE FROM degree WHERE user_id = ?', [userId]);
        
        // 删除考试数据
        await connection.execute('DELETE FROM exam WHERE user_id = ?', [userId]);
        
        // 删除登录日志
        await connection.execute('DELETE FROM login_logs WHERE user_id = ?', [userId]);
        
        // 删除充值卡使用记录（设置为NULL）
        await connection.execute('UPDATE cards SET used_by = NULL, used_at = NULL WHERE used_by = ?', [userId]);
        
        // 最后删除用户
        await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

        // 提交事务
        await connection.commit();

        // 记录操作日志
        logOperation('delete_user', ipAddress, userAgent, 'success', { 
          deletedUsername: username,
          deletedUserId: userId 
        });

        res.json({
          success: true,
          message: `用户 ${username} 及其所有相关数据已彻底删除`
        });
      } catch (error) {
        // 回滚事务
        await connection.rollback();
        throw error;
      }
    } catch (err) {
      console.error('[安全] 删除用户异常:', err.message, { 
        username: req.body?.username,
        ip: ipAddress,
        stack: err.stack 
      });
      
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    } finally {
      // 释放连接
      if (connection) {
        connection.release();
      }
    }
  };
}

module.exports = {
  initialize
};
