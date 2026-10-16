/**
 * 查询特定用户接口（仅管理员可用）
 * @param {Object} db - 数据库连接实例
 */
const jwt = require('jsonwebtoken');
const { getClientIp } = require('./get-client-ip');

function initialize(db, JWT_SECRET) {
  return async (req, res) => {
    try {
      // 验证管理员身份
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: '未提供认证令牌' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET || process.env.JWT_SECRET);
      if (!(decoded.isAdmin || decoded.is_admin)) {
        return res.status(403).json({ success: false, error: '需要管理员权限' });
      }

      const { username } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: '缺少用户名参数'
        });
      }

      const [users] = await db.execute(
        'SELECT id, username, password, remaining_logins, pdf_limit FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }

      res.json({
        success: true,
        user: {
          id: users[0].id.toString(),
          username: users[0].username,
          password: users[0].password,
          remaining_logins: users[0].remaining_logins,
          pdf_limit: users[0].pdf_limit
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