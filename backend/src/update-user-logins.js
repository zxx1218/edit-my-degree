/**
 * 更新用户登录次数接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    try {
      const { userId, username, addLogins } = req.body; // 支持通过userId或username
      
      if (!userId && !username) {
        return res.status(400).json({
          success: false,
          error: '缺少用户ID或用户名参数'
        });
      }
      
      if (addLogins === undefined) {
        return res.status(400).json({
          success: false,
          error: '缺少addLogins参数'
        });
      }
      
      // 查找用户
      let user;
      if (userId) {
        const [users] = await db.execute(
          'SELECT id FROM users WHERE id = ?',
          [userId]
        );
        user = users[0];
      } else if (username) {
        const [users] = await db.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );
        user = users[0];
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }
      
      // 更新用户登录次数
      const [result] = await db.execute(
        'UPDATE users SET remaining_logins = remaining_logins + ? WHERE id = ?',
        [addLogins, user.id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }
      
      // 获取更新后的用户信息
      const [users] = await db.execute(
        'SELECT remaining_logins FROM users WHERE id = ?',
        [user.id]
      );
      
      res.json({
        success: true,
        newLogins: users[0].remaining_logins
      });
    } catch (err) {
      console.error(err);
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