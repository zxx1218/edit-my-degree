const jwt = require('jsonwebtoken');
const { logPasswordChange } = require('./operation-logger');
const { sendSecurityAlert } = require('./email-notifier');

// 简单的内存存储，用于记录失败次数（生产环境建议使用 Redis）
const failedAttempts = new Map();

/**
 * 修改密码接口
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
      const { username, oldPassword, newPassword } = req.body;

      if (!username || !newPassword) {
        return res.status(400).json({
          success: false,
          error: '请提供用户名和新密码'
        });
      }

      // 检查失败次数限制
      const failKey = `${ipAddress}_${username}`;
      const attempts = failedAttempts.get(failKey) || 0;
      
      if (attempts >= 5) {
        logPasswordChange(null, username, ipAddress, userAgent, 'failed', { 
          reason: '尝试次数过多，已被临时锁定'
        });
        
        // 发送告警邮件
        sendSecurityAlert({
          subject: '频繁修改密码尝试警告',
          message: `检测到针对用户 ${username} 的频繁密码修改尝试，可能正在遭受暴力破解。`,
          details: {
            ipAddress,
            userAgent,
            attempts,
            timestamp: new Date().toISOString()
          }
        }).catch(err => console.error('[安全] 发送告警邮件失败:', err.message));

        return res.status(429).json({
          success: false,
          error: '操作过于频繁，请稍后再试或联系管理员'
        });
      }

      // 查找目标用户
      const [users] = await db.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        // 用户不存在
        logPasswordChange(null, username, ipAddress, userAgent, 'failed', { 
          reason: '用户不存在'
        });
        
        // 即使不存在也增加计数，防止枚举用户名
        failedAttempts.set(failKey, attempts + 1);
        setTimeout(() => failedAttempts.delete(failKey), 15 * 60 * 1000); // 15分钟后重置

        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const targetUser = users[0];
      let isAdmin = false;
      let operatorUsername = username; // 默认为目标用户自己
      let operatorId = targetUser.id;

      // 尝试从请求头获取token进行身份验证
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const decoded = jwt.verify(token, jwtSecret || process.env.JWT_SECRET || 'default_jwt_secret');
          operatorUsername = decoded.username;
          operatorId = decoded.id;
          
          // 检查是否为管理员（兼容两种命名方式）
          isAdmin = decoded.is_admin || decoded.isAdmin;
        } catch (err) {
          // Token无效，忽略token，继续按无token逻辑处理
          console.warn('[密码修改] Token验证失败，按未登录处理:', err.message);
        }
      }

      // 权限验证和密码检查
      if (isAdmin) {
        // 管理员操作：可以修改任意用户密码，无需原密码
        console.info(`[账户管理] 管理员修改密码 - 管理员: ${operatorUsername}, 目标用户: ${username}, IP: ${ipAddress}`);
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        // 有token但不是管理员：只能修改自己的密码
        if (operatorUsername !== username) {
          logPasswordChange(targetUser.id, username, ipAddress, userAgent, 'failed', { 
            reason: '权限不足：普通用户只能修改自己的密码',
            operator: operatorUsername
          });
          
          return res.status(403).json({
            success: false,
            error: '您只能修改自己的密码'
          });
        }
        
        // 必须提供正确的原密码
        if (!oldPassword || oldPassword.trim() === '') {
          return res.status(400).json({
            success: false,
            error: '请提供原密码'
          });
        }
        
        if (targetUser.password !== oldPassword) {
          // 原密码错误
          logPasswordChange(targetUser.id, username, ipAddress, userAgent, 'failed', { 
            reason: '原密码错误',
            operator: operatorUsername
          });
          
          // 增加失败计数
          failedAttempts.set(failKey, attempts + 1);
          setTimeout(() => failedAttempts.delete(failKey), 15 * 60 * 1000); // 15分钟后重置

          // 如果达到阈值，发送告警
          if (attempts + 1 >= 3) {
             sendSecurityAlert({
              subject: '密码修改失败次数过多',
              message: `用户 ${username} 在短时间内多次输入错误原密码。`,
              details: {
                ipAddress,
                userAgent,
                attempts: attempts + 1,
                timestamp: new Date().toISOString()
              }
            }).catch(err => console.error('[安全] 发送告警邮件失败:', err.message));
          }
          
          return res.status(401).json({
            success: false,
            error: '原密码错误'
          });
        }
      } else {
        // 无token的情况（如登录前修改密码）：必须提供正确的原密码
        if (!oldPassword || oldPassword.trim() === '') {
          return res.status(400).json({
            success: false,
            error: '请提供原密码'
          });
        }
        
        if (targetUser.password !== oldPassword) {
          // 原密码错误
          logPasswordChange(targetUser.id, username, ipAddress, userAgent, 'failed', { 
            reason: '原密码错误'
          });
          
          // 增加失败计数
          failedAttempts.set(failKey, attempts + 1);
          setTimeout(() => failedAttempts.delete(failKey), 15 * 60 * 1000); // 15分钟后重置

           // 如果达到阈值，发送告警
          if (attempts + 1 >= 3) {
             sendSecurityAlert({
              subject: '密码修改失败次数过多',
              message: `用户 ${username} 在短时间内多次输入错误原密码。`,
              details: {
                ipAddress,
                userAgent,
                attempts: attempts + 1,
                timestamp: new Date().toISOString()
              }
            }).catch(err => console.error('[安全] 发送告警邮件失败:', err.message));
          }
          
          return res.status(401).json({
            success: false,
            error: '原密码错误'
          });
        }
      }

      // 更新密码
      await db.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPassword, targetUser.id]
      );

      // 成功后清除失败记录
      failedAttempts.delete(failKey);

      // 记录密码更改成功日志
      logPasswordChange(targetUser.id, username, ipAddress, userAgent, 'success', { 
        isAdmin: isAdmin,
        operator: operatorUsername,
        operatorId: operatorId,
        hasToken: !!authHeader
      });

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (err) {
      console.error('[安全] 密码修改异常:', err.message, { 
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