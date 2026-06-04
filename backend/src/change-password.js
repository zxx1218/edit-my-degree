const { logPasswordChange } = require('./operation-logger');

/**
 * 修改密码接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                      req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';

    try {
      const { username, oldPassword, newPassword } = req.body;

      if (!username || !newPassword) {
        return res.status(400).json({
          success: false,
          error: '请提供用户名和新密码'
        });
      }

      // 查找用户
      const [users] = await db.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        // 用户不存在
        logPasswordChange(null, username, ipAddress, userAgent, 'failed', { reason: '用户不存在' });
        
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      // 如果提供了oldPassword，则验证原密码（普通用户改密）
      // 如果未提供或为空，则跳过验证（管理员改密）
      if (oldPassword && oldPassword.trim() !== '') {
        if (users[0].password !== oldPassword) {
          // 原密码错误
          logPasswordChange(users[0].id, username, ipAddress, userAgent, 'failed', { reason: '原密码错误' });
          
          return res.status(401).json({
            success: false,
            error: '原密码错误'
          });
        }
      }

      // 更新密码
      await db.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPassword, users[0].id]
      );

      // 记录密码更改成功日志
      logPasswordChange(users[0].id, username, ipAddress, userAgent, 'success');

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (err) {
      console.error('[安全] 密码修改异常:', err.message, { 
        username: req.body?.username,
        ip: ipAddress,
        stack: err.stack 
      });
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  };
}

module.exports = {
  initialize
};