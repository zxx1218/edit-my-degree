const { v4: uuidv4 } = require('uuid');
const { logRegister, logOperation } = require('./operation-logger');
const { sendSecurityAlert } = require('./email-notifier');

/**
 * 初始化注册模块
 * @param {Object} db- 数据库连接实例
 */
function initialize(db) {
  /**
   * 用户注册
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async function register(req, res) {
   const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                      req.headers['x-real-ip'] || 'unknown';
   const userAgent = req.get('User-Agent') || 'Unknown';

   try {
     const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: '用户名和密码不能为空'
        });
      }

      // 验证用户名长度：至少3个字符
      if (username.length < 3) {
        logRegister(null, username, ipAddress, userAgent, 'failed', { reason: '用户名长度不足' });
        
        return res.status(400).json({
          success: false,
          error: '用户名至少需要3个字符'
        });
      }

      // 验证用户名格式：只能包含数字、字母和下划线
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        logRegister(null, username, ipAddress, userAgent, 'failed', { reason: '用户名格式不正确' });
        
        return res.status(400).json({
          success: false,
          error: '用户名只能由数字、字母和下划线组成'
        });
      }

      // 【第二层防护】检查该 IP 在过去 24 小时内是否已经注册过
     const [recentRegistrations] = await db.execute(
        `SELECT id, username FROM users 
         WHERE registration_ip = ? 
         AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [ipAddress]
      );

      if (recentRegistrations.length > 2) {
        // 记录安全日志
        logRegister(null, username, ipAddress, userAgent, 'failed', {
          reason: 'IP注册频率超限',
          existingUsernames: recentRegistrations.map(r => r.username),
          registrationCount: recentRegistrations.length
        });

        // 发送安全告警邮件
        sendSecurityAlert({
          subject: 'IP注册频率超限被拦截',
          message: `系统检测到IP地址 ${ipAddress} 在24小时内尝试注册多个账户（已注册${recentRegistrations.length}个），触发安全防护机制并被拦截。`,
          details: {
            ipAddress: ipAddress,
            userAgent: userAgent,
            attemptedUsername: username,
            existingRegistrations: recentRegistrations.map(r => ({
              id: r.id,
              username: r.username
            })),
            registrationCount: recentRegistrations.length,
            timestamp: new Date().toISOString(),
            action: 'registration_blocked'
          }
        }).catch(err => {
          console.error('[注册] 发送IP注册频率超限告警邮件失败:', err.message);
        });

        return res.status(403).json({
          success: false,
          error: '阿里云安全服务器已拦截您的请求，若再请求一次将永久封禁机器码！'
        });
      }

      // 检查用户名是否已存在
     const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existingUsers.length > 0) {
        logRegister(null, username, ipAddress, userAgent, 'failed', { reason: '用户名已存在' });
        
        return res.status(400).json({
          success: false,
          error: '用户名已存在，请选择其他用户名'
        });
      }

      // 生成 UUID 作为用户ID
     const userId = uuidv4();

      // 插入新用户，初始登录次数为 0，并记录注册 IP
      await db.execute(
        'INSERT INTO users (id, username, password, remaining_logins, registration_ip) VALUES (?, ?, ?, ?, ?)',
        [userId, username, password, 0, ipAddress]
      );

      // 为新用户创建默认的学籍记录
     const studentStatusId = uuidv4();
      await db.execute(
        `INSERT INTO student_status (id, user_id, name, school, major, study_type, degree_level) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [studentStatusId, userId, '浆果儿', '清华大学', '汉语言文学', '普通全日制', '本科']
      );

      // 记录用户注册日志
      logRegister(userId, username, ipAddress, userAgent, 'success', {
        initial_logins: 0,
        default_data_created: true
      });

      // 获取新创建的用户信息
     const [newUsers] = await db.execute(
        'SELECT id, username, remaining_logins FROM users WHERE id = ?',
        [userId]
      );

     const newUser = newUsers[0];

      res.status(200).json({
        success: true,
        user: newUser
      });
    } catch(err) {
     console.error('[认证] 注册异常:', err.message, { 
        username: req.body?.username,
        ip: ipAddress,
        stack: err.stack 
      });
      res.status(500).json({
        success: false,
        error: '注册失败，请重试'
      });
    }
  }

  return {
    register
  };
}

module.exports = {
  initialize
};