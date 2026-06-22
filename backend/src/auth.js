const jwt = require('jsonwebtoken');
const { logLogin, logAdminOperation } = require('./operation-logger');
const { queryIPLocation } = require('./ip-location');
const dbManager = require('./db-utils');
const { isIpBlacklisted, recordAndCheckIp, logIpBlacklist } = require('./ip-blacklist');

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
      // 检查IP是否在黑名单中
      const blacklisted = await isIpBlacklisted(ipAddress);
      if (blacklisted) {
        logIpBlacklist(ipAddress, 'checked', '黑名单IP尝试登录', { userAgent });
        return res.status(403).json({ 
          error: '你的机器码已经被封禁，拒绝访问',
          message: '由于异常活动，您的IP已被暂时限制访问。请稍后再试或联系管理员。'
        });
      }

      // 记录并检查IP请求频率
      await recordAndCheckIp(ipAddress);
      
      const { username, password } = req.body;
      
      // 使用连接池执行查询
      const [rows] = await dbManager.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      if (rows.length === 0) {
        // 记录登录失败日志
        logLogin(null, username, ipAddress, userAgent, 'failed', { 
          reason: '用户不存在',
          password: req.body?.password
        });
        
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
        logLogin(user.id, username, ipAddress, userAgent, 'failed', { 
          reason: '密码错误',
          password: req.body?.password
        });
        
        return res.status(401).json({ 
          error: '用户名或密码错误',
          message: '用户名或密码错误' 
        });
      }
      
      // 检查登录次数
      if (user.remaining_logins <= 0) {
        // 记录登录失败日志
        logLogin(user.id, username, ipAddress, userAgent, 'failed', { reason: '登录次数不足', remaining_logins: 0 });
        
        return res.status(403).json({ 
          error: '您的剩余登录次数为0，请购买或续费后再登录！',
          message: '您的账号剩余可登录次数为 0 ，请购买或续费套餐后再登录！'
        });
      }
      
      // 获取用户当前剩余登录次数（扣除本次登录前）
      const remainingLoginsBefore = user.remaining_logins;
      
      // 根据当前剩余登录次数确定会话时长（单位：毫秒）
      let sessionDuration;
      if (remainingLoginsBefore == 1) {
        // 当前剩余登录次数为1时，会话时长3分钟
        sessionDuration = parseInt(process.env.SESSION_DURATION_LEVEL_1 || '180000', 10);
      } else if (remainingLoginsBefore <= 5) {
        // 当前剩余登录次数大于1但小于等于5时，会话时长8分钟
        sessionDuration = parseInt(process.env.SESSION_DURATION_LEVEL_2 || '480000', 10);
      } else if (remainingLoginsBefore <= 30) {
        // 当前剩余登录次数大于5但小于等于30时，会话时长20分钟
        sessionDuration = parseInt(process.env.SESSION_DURATION_LEVEL_3 || '1200000', 10);
      } else {
        // 当前剩余登录次数大于30时，会话时长24小时
        sessionDuration = parseInt(process.env.SESSION_DURATION_LEVEL_4 || '86400000', 10);
      }
      
      // 减少登录次数
      await dbManager.execute(
        'UPDATE users SET remaining_logins = remaining_logins - 1 WHERE id = ?',
        [user.id]
      );
      
      // 获取扣除本次登录后的剩余登录次数
      const remainingLoginsAfter = remainingLoginsBefore - 1;
      
      const sessionDurationMinutes = Math.floor(sessionDuration / 60000);
      
      // 记录登录成功日志
      logLogin(user.id, username, ipAddress, userAgent, 'success', { 
        remaining_logins_before: remainingLoginsBefore,
        remaining_logins_after: remainingLoginsAfter,
        session_duration_ms: sessionDuration,
        session_duration_minutes: sessionDurationMinutes,
        session_expiry_info: `本次登录后会话有效期为${sessionDurationMinutes}分钟`,
        session_level: remainingLoginsBefore <= 1 ? 'level_1' : remainingLoginsBefore <= 5 ? 'level_2' : remainingLoginsBefore <= 30 ? 'level_3' : 'level_4'
      });
      
      // 记录登录日志到login_logs表（包含IP和地理位置）
      let ipLocation = null;
      try {
        ipLocation = await queryIPLocation(ipAddress);
      } catch (err) {
        console.warn('[认证] IP地理位置查询失败:', err.message);
        ipLocation = '未知';
      }
      
      await dbManager.execute(
        'INSERT INTO login_logs (user_id, username, login_ip, ip_location) VALUES (?, ?, ?, ?)',
        [user.id, username, ipAddress, ipLocation]
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
          remaining_logins: remainingLoginsAfter,
          pdf_limit: user.pdf_limit || 0
        },
        token,
        sessionDuration: sessionDuration // 返回会话时长给前端
      });
    } catch (err) {
      console.error('[认证] 登录异常:', err.message, { 
        username: req.body?.username,
        ip: ipAddress,
        stack: err.stack 
      });
      // 如果是连接相关错误，尝试重新连接
      if (err.message.includes('connection is in closed state')) {
        try {
          await dbManager.reconnect();
          return res.status(503).json({
            success: false,
            error: '数据库连接已恢复，请重新尝试'
          });
        } catch (reconnectErr) {
          console.error('[认证] 数据库重新连接失败:', reconnectErr.message);
        }
      }
      
      res.status(500).json({
        success: false,
        error: '服务器正在维护中，请稍后再试，具体信息请关注Q群通知！'
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
        logAdminOperation(null, username, '管理员登录', ipAddress, userAgent, 'failed', { 
          error: '用户不存在' 
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
        logAdminOperation(admin.id, username, '管理员登录', ipAddress, userAgent, 'failed', { 
          error: '密码错误' 
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
      logAdminOperation(admin.id, username, '管理员登录', ipAddress, userAgent, 'success');
      
      res.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username
        },
        token
      });
    } catch (err) {
      console.error('[认证] 管理员登录异常:', err.message, { 
        username: req.body?.username,
        ip: ipAddress,
        stack: err.stack 
      });
      // 如果是连接相关错误，尝试重新连接
      if (err.message.includes('connection is in closed state')) {
        try {
          await dbManager.reconnect();
          return res.status(503).json({
            success: false,
            error: '数据库连接已恢复，请重新尝试'
          });
        } catch (reconnectErr) {
          console.error('[认证] 数据库重新连接失败:', reconnectErr.message);
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