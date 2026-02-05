const jwt = require('jsonwebtoken');
const { logLogin } = require('./operation-logger');
const dbManager = require('./db-utils');

/**
 * 初始化认证模块
 * @param {Object} pool - 数据库连接池实例
 */
function initialize(pool, jwtSecret) {
  // JWT 密钥
  const JWT_SECRET = jwtSecret || process.env.JWT_SECRET;

  /**
   * 用户登录
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async function login(req, res) {
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                      req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';

    try {
      const { username, password } = req.body;
      
      // 使用连接池执行查询
      const [rows] = await dbManager.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      if (rows.length === 0) {
        // 记录登录失败日志
        logLogin(null, username, ipAddress, userAgent, 'failed');
        
        return res.status(401).json({ 
          error: '用户名或密码错误',
          message: '用户名或密码错误' 
        });
      }
      
      const user = rows[0];
      
      // 检查密码
      const isPasswordValid = password === user.password; // 简化处理，实际应该使用 bcrypt
      
      if (!isPasswordValid) {
        // 记录登录失败日志
        logLogin(user.id, username, ipAddress, userAgent, 'failed');
        
        return res.status(401).json({ 
          error: '用户名或密码错误',
          message: '用户名或密码错误' 
        });
      }
      
      // 检查登录次数
      if (user.remaining_logins <= 0) {
        // 记录登录失败日志
        logLogin(user.id, username, ipAddress, userAgent, 'failed');
        
        return res.status(403).json({ 
          error: '登录次数不足',
          message: '您的账号剩余可登录次数为 0 ，请购买或续费套餐后再登录！'
        });
      }
      
      // 减少登录次数
      await dbManager.execute(
        'UPDATE users SET remaining_logins = remaining_logins - 1 WHERE id = ?',
        [user.id]
      );
      
      // 记录登录成功日志
      logLogin(user.id, username, ipAddress, userAgent, 'success');
      
      // 记录登录日志到login_logs表
      await dbManager.execute(
        'INSERT INTO login_logs (user_id, username) VALUES (?, ?)',
        [user.id, username]
      );
      
      // 生成 JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
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
      console.error('登录错误:', err);
      // 如果是连接相关错误，尝试重新连接
      if (err.message.includes('connection is in closed state')) {
        try {
          await dbManager.reconnect();
          return res.status(503).json({
            success: false,
            error: '数据库连接已恢复，请重新尝试'
          });
        } catch (reconnectErr) {
          console.error('数据库重新连接失败:', reconnectErr);
        }
      }
      
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
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                      req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';

    try {
      const { username, password } = req.body;
      
      // 查询管理员
      const [rows] = await dbManager.execute(
        'SELECT * FROM admins WHERE username = ?',
        [username]
      );
      
      if (rows.length === 0) {
        console.warn('管理员登录失败: 用户不存在', {
          username,
          ip: ipAddress,
          userAgent
        });
        
        return res.status(401).json({
          success: false,
          error: '用户名或密码错误'
        });
      }
      
      const admin = rows[0];
      
      // 检查密码
      const isPasswordValid = password === admin.password; // 简化处理，实际应该使用 bcrypt
      
      if (!isPasswordValid) {
        console.warn('管理员登录失败: 密码错误', {
          username,
          ip: ipAddress,
          userAgent
        });
        
        return res.status(401).json({
          success: false,
          error: '用户名或密码错误'
        });
      }
      
      // 生成 JWT token
      const token = jwt.sign(
        { id: admin.id, username: admin.username, isAdmin: true },
        JWT_SECRET,
        { expiresIn: process.env.SUPERADD_JWT_EXPIRES_IN || '72h' }
      );
      
      // 记录管理员登录日志
      console.info('管理员登录成功', {
        username,
        ip: ipAddress,
        userAgent
      });
      
      res.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username
        },
        token
      });
    } catch (err) {
      console.error('管理员登录错误:', err);
      // 如果是连接相关错误，尝试重新连接
      if (err.message.includes('connection is in closed state')) {
        try {
          await dbManager.reconnect();
          return res.status(503).json({
            success: false,
            error: '数据库连接已恢复，请重新尝试'
          });
        } catch (reconnectErr) {
          console.error('数据库重新连接失败:', reconnectErr);
        }
      }
      
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