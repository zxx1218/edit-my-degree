const jwt = require('jsonwebtoken');

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * 初始化认证模块
 * @param {Object} db - 数据库连接实例
 */
function initialize(db, jwtSecret) {
  // JWT 密钥
  const JWT_SECRET = jwtSecret || process.env.JWT_SECRET;

  /**
   * 用户登录
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async function login(req, res) {
    try {
      // 设置时区为中国时区
      await db.execute("SET time_zone = '+08:00'");
      
      const { username, password } = req.body;
      
      // 查询用户
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: '用户名或密码错误'
        });
      }
      
      const user = rows[0];
      
      // 检查密码
      const isPasswordValid = password === user.password; // 简化处理，实际应该使用 bcrypt
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: '用户名或密码错误'
        });
      }
      
      // 检查登录次数
      if (user.remaining_logins <= 0) {
        return res.status(401).json({
          success: false,
          error: '登录次数已用完'
        });
      }
      
      // 减少登录次数
      await db.execute(
        'UPDATE users SET remaining_logins = remaining_logins - 1 WHERE id = ?',
        [user.id]
      );
      
      // 记录登录日志到login_logs表
      await db.execute(
        'INSERT INTO login_logs (user_id, username) VALUES (?, ?)',
        [user.id, username]
      );
      
      // 生成 JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          remaining_logins: user.remaining_logins - 1
        },
        token
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  /**
   * 管理员登录
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async function adminLogin(req, res) {
    try {
      // 设置时区为中国时区
      await db.execute("SET time_zone = '+08:00'");
      
      const { username, password } = req.body;
      
      // 查询管理员
      const [rows] = await db.execute(
        'SELECT * FROM admins WHERE username = ?',
        [username]
      );
      
      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: '用户名或密码错误'
        });
      }
      
      const admin = rows[0];
      
      // 检查密码
      const isPasswordValid = password === admin.password; // 简化处理，实际应该使用 bcrypt
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: '用户名或密码错误'
        });
      }
      
      // 生成 JWT token
      const token = jwt.sign(
        { id: admin.id, username: admin.username, isAdmin: true },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username
        },
        token
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  return {
    login,
    adminLogin
  };
}

module.exports = {
  initialize
};