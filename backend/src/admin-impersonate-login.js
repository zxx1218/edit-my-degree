const jwt = require('jsonwebtoken');
const { logOperation } = require('./operation-logger');

/**
 * 管理员直接登录用户接口（不消耗积分）
 * @param {Object} db - 数据库连接实例
 * @param {string} jwtSecret - JWT密钥
 */
function initialize(db, jwtSecret) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                      req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';

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
      
      // 检查用户是否为管理员（兼容两种命名方式）
      if (!decoded.is_admin && !decoded.isAdmin) {
        return res.status(403).json({
          success: false,
          error: '权限不足'
        });
      }

      const adminUsername = decoded.username;
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: '请提供用户名'
        });
      }

      // 查找目标用户
      const [users] = await db.execute(
        'SELECT id, username, remaining_logins, pdf_limit FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const targetUser = users[0];

      // 生成用户的 JWT token（有效期24小时）
      const userToken = jwt.sign(
        {
          id: targetUser.id,
          username: targetUser.username,
          isAdmin: false,
          isImpersonated: true, // 标记这是管理员代登录
          impersonatedBy: adminUsername, // 记录是哪个管理员操作的
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
        },
        jwtSecret || process.env.JWT_SECRET || 'default_jwt_secret'
      );

      // 记录管理员代登录日志到login_logs表
      let ipLocation = null;
      try {
        const queryIPLocation = require('./ip-location-query');
        ipLocation = await queryIPLocation(ipAddress);
      } catch (err) {
        console.warn('[管理员代登录] IP地理位置查询失败:', err.message);
        ipLocation = '未知';
      }
      
      await db.execute(
        'INSERT INTO login_logs (user_id, username, login_ip, ip_location, login_type) VALUES (?, ?, ?, ?, ?)',
        [targetUser.id, username, ipAddress, ipLocation, 'admin_impersonate']
      );

      // 记录审计日志
      logOperation(
        adminUsername,
        'admin_impersonate_login',
        ipAddress,
        userAgent,
        'success',
        {
          targetUser: username,
          targetUserId: targetUser.id,
          remainingLogins: targetUser.remaining_logins,
          pdfLimit: targetUser.pdf_limit
        }
      );

      console.info(`[管理员代登录] 管理员 ${adminUsername} 直接登录用户 ${username} (ID: ${targetUser.id}), IP: ${ipAddress}`);

      res.json({
        success: true,
        message: '直接登录成功',
        token: userToken,
        user: {
          id: targetUser.id,
          username: targetUser.username,
          remaining_logins: targetUser.remaining_logins,
          pdf_limit: targetUser.pdf_limit
        },
        sessionDuration: 86400000 // 24小时（毫秒）
      });
    } catch (err) {
      console.error('[管理员代登录] 操作失败:', err.message, { 
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
