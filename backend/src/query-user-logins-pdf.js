/**
 * 查询用户登录次数和 PDF 积分接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: '缺少用户名或密码参数'
        });
      }
      
      // 验证用户名和密码
      const [users] = await db.execute(
        'SELECT id, username, password, remaining_logins, pdf_limit FROM users WHERE username = ?',
        [username]
      );
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }
      
      const user = users[0];
      
      // 验证密码
      if (user.password !== password) {
        return res.status(401).json({
          success: false,
          error: '密码错误'
        });
      }
      
      res.json({
        success: true,
        user: {
          id: user.id.toString(),
          username: user.username,
          remaining_logins: user.remaining_logins,
          pdf_limit: user.pdf_limit
        }
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
