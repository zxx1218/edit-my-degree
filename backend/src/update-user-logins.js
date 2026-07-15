/**
 * 更新用户登录次数接口（管理员操作）
 * @param {Object} db - 数据库连接实例
 */
const cryptoUtils = require('./crypto-utils');
const { sendIllegalApiCallAlert } = require('./email-notifier');

function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    try {
      const { userId, username, addLogins, isad, adminToken } = req.body; // 支持通过userId或username
      
      if (!userId && !username) {
        return res.status(400).json({
          success: false,
          error: '缺少用户ID或用户名参数'
        });
      }
      
      if (addLogins === undefined) {
        return res.status(400).json({
          success: false,
          error: '缺少addLogins参数'
        });
      }
      
      // 验证管理员身份
      let operatorInfo;
      if (isad === true) {
        // 管理员操作，必须提供adminToken
        if (!adminToken) {
          console.warn(`[安全警告] 登录次数调整管理员操作缺少adminToken - IP: ${ipAddress}, User-Agent: ${userAgent}`);
          
          // 发送非法调用告警邮件
          sendIllegalApiCallAlert({
            req,
            reason: '登录次数调整缺少adminToken',
            details: {
              action: 'update-user-logins',
              isad: isad,
              missingField: 'adminToken'
            }
          }).catch(err => {
            console.error('[邮件通知] 发送告警失败:', err.message);
          });
          
          return res.status(401).json({
            success: false,
            error: '管理员操作需要提供有效的adminToken'
          });
        }
        
        try {
          operatorInfo = cryptoUtils.verifyAdminToken(adminToken);
        } catch (error) {
          console.warn(`[安全警告] 登录次数调整管理员Token验证失败 - 错误: ${error.message}, IP: ${ipAddress}, User-Agent: ${userAgent}`);
          
          // 发送非法调用告警邮件
          sendIllegalApiCallAlert({
            req,
            reason: '登录次数调整adminToken验证失败',
            details: {
              action: 'update-user-logins',
              isad: isad,
              errorMessage: error.message,
              adminTokenLength: adminToken.length
            }
          }).catch(err => {
            console.error('[邮件通知] 发送告警失败:', err.message);
          });
          
          return res.status(401).json({
            success: false,
            error: `管理员身份验证失败: ${error.message}`
          });
        }
      } else {
        // 非管理员操作，使用JWT Token验证
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: '未提供有效的认证令牌'
          });
        }
        
        const token = authHeader.substring(7);
        try {
          const jwt = require('jsonwebtoken');
          operatorInfo = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
        } catch (error) {
          return res.status(401).json({
            success: false,
            error: '认证令牌无效或已过期'
          });
        }
      }
      
      const operatorUsername = operatorInfo.username;
      const operatorId = operatorInfo.id;
      
      // 查找用户
      let user;
      if (userId) {
        const [users] = await db.execute(
          'SELECT id, username, remaining_logins, pdf_limit FROM users WHERE id = ?',
          [userId]
        );
        user = users[0];
      } else if (username) {
        const [users] = await db.execute(
          'SELECT id, username, remaining_logins, pdf_limit FROM users WHERE username = ?',
          [username]
        );
        user = users[0];
      }
      
      if (!user) {
        console.warn(`[账户管理] 更新登录次数失败 - 用户不存在: ${userId || username}, 操作者: ${operatorUsername}, IP: ${ipAddress}`);
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }
      
      const oldLogins = user.remaining_logins;
      const oldPdfLimit = user.pdf_limit || 0;
      
      // 验证调整数值的合理性
      const MAX_SINGLE_OPERATION = 1000; // 单次最多调整1000次
      
      if (typeof addLogins !== 'number' || !Number.isInteger(addLogins)) {
        return res.status(400).json({
          success: false,
          error: '调整次数必须为整数'
        });
      }
      
      if (Math.abs(addLogins) > MAX_SINGLE_OPERATION) {
        console.warn(`[安全警告] 检测到异常大额资源调整 - 操作者: ${operatorUsername}, 调整量: ${addLogins}, IP: ${ipAddress}`);
        return res.status(400).json({
          success: false,
          error: `单次调整不能超过${MAX_SINGLE_OPERATION}次，如需更大调整请分批操作`
        });
      }
      
      // 计算新的登录次数并验证范围
      const newLogins = oldLogins + addLogins;
      
      if (newLogins < 0) {
        return res.status(400).json({
          success: false,
          error: `调整后登录次数不能为负数（当前${oldLogins}次，调整${addLogins}次）`
        });
      }
      
      if (newLogins > 999999) {
        return res.status(400).json({
          success: false,
          error: '调整后登录次数超过系统上限（999999次）'
        });
      }
      
      // 更新用户登录次数
      const [result] = await db.execute(
        'UPDATE users SET remaining_logins = ? WHERE id = ?',
        [newLogins, user.id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }
      
      // 记录详细的审计日志（safe级别）
      console.safe(`[审计日志] 管理员调整登录次数 - 
        ========== 操作详情 ==========
        操作类型: ${isad === true ? '管理员直接操作' : '普通用户操作'},
        操作者: ${operatorUsername}(ID:${operatorId}),
        目标用户: ${user.username}(ID:${user.id}),
        资源类型: 登录次数,
        ========== 变更详情 ==========
        变更前值: ${oldLogins},
        变更量: ${addLogins > 0 ? '+' + addLogins : addLogins},
        变更后值: ${newLogins},
        PDF积分: ${oldPdfLimit},
        ========== 请求信息 ==========
        IP地址: ${ipAddress},
        User-Agent: ${userAgent},
        时间戳: ${new Date().toISOString()},
        ==============================`);
      
      console.info(`[账户管理] 登录次数更新成功 - 操作者: ${operatorUsername}, 用户: ${user.username}, 原次数: ${oldLogins}, 增加: ${addLogins}, 新次数: ${newLogins}, IP: ${ipAddress}`);
      
      res.json({
        success: true,
        newLogins,
        oldLogins,
        added: addLogins
      });
    } catch (err) {
      console.error('[账户管理] 更新登录次数异常:', err.message, { 
        userId: req.body?.userId,
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
