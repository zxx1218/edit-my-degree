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

      if (!username || !oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: '请提供完整的信息'
        });
      }

      // 验证原密码是否正确
      const [users] = await db.execute(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, oldPassword]
      );

      if (users.length === 0) {
        // 记录密码更改失败日志
        if (users.length > 0) {
          logPasswordChange(users[0].id, username, ipAddress, userAgent, 'failed');
        }
        
        return res.status(401).json({
          success: false,
          error: '用户名或原密码错误'
        });
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
      console.error('Error changing password:', err);
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