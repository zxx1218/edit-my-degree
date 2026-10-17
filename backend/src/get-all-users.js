const jwt = require('jsonwebtoken');

/**
 * 获取所有用户接口
 * @param {Object} db - 数据库连接实例
 * @param {string} jwtSecret - JWT密钥
 */
function initialize(db, jwtSecret) {
  return async (req, res) => {
    try {
      // 从请求头获取token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: '未提供访问令牌'
        });
      }
      const token = authHeader.substring(7);
      
      // 验证JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret || process.env.JWT_SECRET || 'default_jwt_secret');
      } catch (err) {
        return res.status(401).json({
          success: false,
          error: '无效的访问令牌'
        });
      }
      
      // 检查用户是否为管理员
      const [users] = await db.execute(
        'SELECT username FROM admins WHERE id = ?', [decoded.id]
      );
      
      if (users.length === 0) {
        return res.status(403).json({
          success: false,
          error: '权限不足'
        });
      }
      
      // 查询所有用户，包括密码字段和性别信息
      // 如果用户有任何一条学籍记录的性别为女，则标记为女性用户
      const [results] = await db.execute(
        `SELECT u.id, u.username, u.password, u.remaining_logins, u.pdf_limit, u.created_at,
                EXISTS(SELECT 1 FROM student_status ss WHERE ss.user_id = u.id AND ss.gender = '女') as is_female
         FROM users u
         ORDER BY u.created_at DESC`
      );

      res.json({
        success: true,
        users: results.map(user => ({
          id: user.id.toString(),
          username: user.username,
          password: user.password,
          remaining_logins: user.remaining_logins,
          pdf_limit: user.pdf_limit,
          created_at: user.created_at,
          gender: user.is_female ? '女' : null
        }))
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