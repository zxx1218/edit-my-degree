/**
 * 减少用户登录次数接口（管理员操作）
 * @param {Object} db - 数据库连接实例
 */
const jwt = require('jsonwebtoken');
const cryptoUtils = require('./crypto-utils');
const { sendIllegalApiCallAlert } = require('./email-notifier');

function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    try {
      const { username, decreaseLogins, isad, adminToken } = req.body;

      // 验证管理员身份
      let operatorInfo;
      if (isad === true) {
        // 管理员操作，必须提供adminToken
        if (!adminToken) {
          console.error(`[安全错误] 登录次数减少管理员操作缺少adminToken - IP: ${ipAddress}, User-Agent: ${userAgent}`);
          
          // 发送非法调用告警邮件
          sendIllegalApiCallAlert({
            req,
            reason: '登录次数减少缺少adminToken',
            details: {
              action: 'decrease-user-logins',
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
          console.error(`[安全错误] 登录次数减少管理员Token验证失败 - 错误: ${error.message}, IP: ${ipAddress}, User-Agent: ${userAgent}`);
          
          // 发送非法调用告警邮件
          sendIllegalApiCallAlert({
            req,
            reason: '登录次数减少adminToken验证失败',
            details: {
              action: 'decrease-user-logins',
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

      if (!username) {
        return res.status(400).json({
          success: false,
          error: '用户名不能为空'
        });
      }

      if (typeof decreaseLogins !== 'number' || decreaseLogins <= 0) {
        return res.status(400).json({
          success: false,
          error: '减少次数必须为正整数'
        });
      }

      // 检查单次操作上限
      const MAX_DECREASE_PER_REQUEST = 1000;
      if (decreaseLogins > MAX_DECREASE_PER_REQUEST) {
        console.warn(`[安全警告] 检测到异常大额登录次数减少 - 操作者: ${operatorUsername}, 减少量: ${decreaseLogins}, IP: ${ipAddress}`);
        return res.status(400).json({
          success: false,
          error: `单次最多只能减少${MAX_DECREASE_PER_REQUEST}次登录次数`
        });
      }

      // 先查询用户当前的登录次数和PDF积分
      const [users] = await db.execute(
        'SELECT id, remaining_logins, pdf_limit FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        console.warn(`[账户管理] 减少登录次数失败 - 用户不存在: ${username}, IP: ${ipAddress}`);
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const user = users[0];

      // 检查用户是否有足够的登录次数
      if (user.remaining_logins <= 0) {
        console.warn(`[账户管理] 减少登录次数失败 - 登录次数不足: 用户=${username}, 当前剩余=${user.remaining_logins}, PDF积分=${user.pdf_limit}, IP: ${ipAddress}`);
        return res.status(400).json({
          success: false,
          error: `登录次数不足，当前剩余：${user.remaining_logins}次，请先充值后再访问`,
          message: '您的账号剩余可登录次数为 0 ，请购买或续费套餐后再登录！'
        });
      }

      // 计算新的登录次数，不能小于0
      const newLogins = Math.max(0, user.remaining_logins - decreaseLogins);
      const actualDecreased = user.remaining_logins - newLogins;

      // 更新用户的登录次数
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
      console.safe(`[审计日志] 管理员减少登录次数 - 
        ========== 操作详情 ==========
        操作类型: ${isad === true ? '管理员直接操作' : '普通用户操作'},
        操作者: ${operatorUsername}(ID:${operatorId}),
        目标用户: ${username}(ID:${user.id}),
        资源类型: 登录次数,
        ========== 变更详情 ==========
        变更前值: ${user.remaining_logins},
        变更量: -${actualDecreased},
        变更后值: ${newLogins},
        PDF积分: ${user.pdf_limit},
        ========== 请求信息 ==========
        IP地址: ${ipAddress},
        User-Agent: ${userAgent},
        时间戳: ${new Date().toISOString()},
        ==============================`);

      console.info(`[账户管理] 登录次数减少成功 - 操作者: ${operatorUsername}, 用户: ${username}, 原次数: ${user.remaining_logins}, PDF积分: ${user.pdf_limit}, 减少: ${actualDecreased}, 新次数: ${newLogins}, IP: ${ipAddress}`);

      res.json({
        success: true,
        newLogins,
        decreased: actualDecreased
      });
    } catch (err) {
      console.error('[账户管理] 减少登录次数异常:', err.message, { 
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
