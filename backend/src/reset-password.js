const { logPasswordChange } = require('./operation-logger');
const { sendSecurityAlert } = require('./email-notifier');

// 简单的内存存储，用于记录失败次数（生产环境建议使用 Redis）
const failedAttempts = new Map();

/**
 * 忘记密码重置接口 - 通过用户名和卡密验证来重置密码
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                      req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';

    try {
      const { username, cardId, newPassword, confirmPassword } = req.body;

      // 参数验证
      if (!username || !cardId || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          error: '请提供所有必填字段'
        });
      }

      // 检查失败次数限制
      const failKey = `${ipAddress}_${username}`;
      const attempts = failedAttempts.get(failKey) || 0;
      
      if (attempts >= 5) {
        logPasswordChange(null, username, ipAddress, userAgent, 'failed', { 
          reason: '尝试次数过多，已被临时锁定',
          operation: 'reset_password'
        });
        
        // 发送告警邮件
        sendSecurityAlert({
          subject: '频繁重置密码尝试警告',
          message: `检测到针对用户 ${username} 的频繁密码重置尝试，可能正在遭受恶意攻击。`,
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

      // 验证新密码长度
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: '新密码长度至少为6位'
        });
      }

      // 验证两次输入的密码是否一致
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: '两次输入的新密码不一致'
        });
      }

      // 查找目标用户
      const [users] = await db.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        // 用户不存在
        logPasswordChange(null, username, ipAddress, userAgent, 'failed', { 
          reason: '用户不存在',
          operation: 'reset_password'
        });
        
        // 即使不存在也增加计数，防止枚举用户名
        failedAttempts.set(failKey, attempts + 1);
        setTimeout(() => failedAttempts.delete(failKey), 15 * 60 * 1000); // 15分钟后重置
        
        return res.status(404).json({
          success: false,
          error: '用户名不存在'
        });
      }

      const targetUser = users[0];

      // 验证卡密是否属于该用户
      // 用户直接输入的是原始卡密ID，直接使用即可
      const cardIdTrimmed = cardId.trim();

      // 查询该用户是否使用过这个卡密
      const [cardRecords] = await db.execute(
        'SELECT id, type, `values` FROM cards WHERE id = ? AND used_by = ? AND used = TRUE',
        [cardIdTrimmed, targetUser.id]
      );

      if (cardRecords.length === 0) {
        // 卡密与用户不对应
        logPasswordChange(targetUser.id, username, ipAddress, userAgent, 'failed', { 
          reason: '卡密与用户不对应',
          operation: 'reset_password',
          cardId: cardIdTrimmed
        });
        
        // 增加失败计数
        failedAttempts.set(failKey, attempts + 1);
        setTimeout(() => failedAttempts.delete(failKey), 15 * 60 * 1000); // 15分钟后重置

        // 如果达到阈值，发送告警
        if (attempts + 1 >= 3) {
           sendSecurityAlert({
            subject: '密码重置验证失败次数过多',
            message: `用户 ${username} 在短时间内多次输入错误的卡密进行密码重置。`,
            details: {
              ipAddress,
              userAgent,
              attempts: attempts + 1,
              timestamp: new Date().toISOString()
            }
          }).catch(err => console.error('[安全] 发送告警邮件失败:', err.message));
        }
        
        return res.status(400).json({
          success: false,
          error: '卡密与用户不对应'
        });
      }

      // 更新密码
      await db.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPassword, targetUser.id]
      );

      // 成功后清除失败记录
      failedAttempts.delete(failKey);

      // 记录密码重置成功日志
      logPasswordChange(targetUser.id, username, ipAddress, userAgent, 'success', { 
        operation: 'reset_password',
        cardId: cardIdTrimmed,
        cardType: cardRecords[0].type,
        cardValues: cardRecords[0].values
      });

      console.info(`[密码重置] 用户 ${username} 通过卡密验证成功重置密码, IP: ${ipAddress}`);

      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (err) {
      console.error('[安全] 密码重置异常:', err.message, { 
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