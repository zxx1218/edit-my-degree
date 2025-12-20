/**
 * 减少用户登录次数接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    try {
      const { username, decreaseLogins } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: '用户名不能为空'
        });
      }

      if (typeof decreaseLogins !== 'number' || decreaseLogins <= 0) {
        return res.status(400).json({
          success: false,
          error: '减少次数必须为正整数'
        });
      }

      // 先查询用户当前的登录次数
      const [users] = await db.execute(
        'SELECT id, remaining_logins FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const user = users[0];

      // 计算新的登录次数，不能小于0
      const newLogins = Math.max(0, user.remaining_logins - decreaseLogins);

      // 更新用户的登录次数
      const [result] = await db.execute(
        'UPDATE users SET remaining_logins = ? WHERE id = ?',
        [newLogins, user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }

      res.json({
        success: true,
        newLogins,
        decreased: user.remaining_logins - newLogins
      });
    } catch (err) {
      console.error('Unexpected error:', err);
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