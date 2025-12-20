/**
 * 修改密码接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
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