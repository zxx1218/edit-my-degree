/**
 * 减少用户PDF积分接口（管理员操作）
 * @param {Object} db - 数据库连接实例
 */
const cryptoUtils = require('./crypto-utils');

function initialize(db) {
  return async (req, res) => {
    const operationLogger = require('./operation-logger');
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    const userAgent = req.headers['user-agent'] || '未知设备';
    
    try {
      const { username, decreaseAmount, isad, adminToken } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: '用户名不能为空'
        });
      }

      if (typeof decreaseAmount !== 'number' || decreaseAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: '减少数量必须为正整数'
        });
      }
      
      // 验证管理员身份
      let operatorInfo;
      if (isad === true) {
        // 管理员操作，必须提供adminToken
        if (!adminToken) {
          console.warn(`[安全警告] PDF积分减少管理员操作缺少adminToken - IP: ${ipAddress}`);
          return res.status(401).json({
            success: false,
            error: '管理员操作需要提供有效的adminToken'
          });
        }
        
        try {
          operatorInfo = cryptoUtils.verifyAdminToken(adminToken);
        } catch (error) {
          console.warn(`[安全警告] PDF积分减少管理员Token验证失败 - 错误: ${error.message}, IP: ${ipAddress}`);
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

      // 先查询用户当前的PDF积分和登录次数
      const [users] = await db.execute(
        'SELECT id, pdf_limit, remaining_logins FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        console.warn(`[PDF管理] 减少PDF积分失败 - 用户不存在: ${username}, 操作者: ${operatorUsername}, IP: ${ipAddress}`);
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const user = users[0];
      const oldPdfLimit = user.pdf_limit || 0;
      const currentLogins = user.remaining_logins || 0;

      // 检查是否有足够的PDF积分
      if (oldPdfLimit < decreaseAmount) {
        console.warn(`[PDF管理] 减少PDF积分失败 - 积分不足: 用户=${username}, 当前=${oldPdfLimit}, 需要=${decreaseAmount}, 操作者: ${operatorUsername}, IP: ${ipAddress}`);
        return res.status(400).json({
          success: false,
          error: `PDF下载积分不足，当前积分：${oldPdfLimit}，需要：${decreaseAmount}`
        });
      }
      
      // 验证调整数值的合理性
      const MAX_SINGLE_OPERATION = 500; // PDF积分单次最多调整500分
      
      if (decreaseAmount > MAX_SINGLE_OPERATION) {
        console.warn(`[安全警告] 检测到异常大额PDF积分减少 - 操作者: ${operatorUsername}, 调整量: ${decreaseAmount}, IP: ${ipAddress}`);
        return res.status(400).json({
          success: false,
          error: `单次调整不能超过${MAX_SINGLE_OPERATION}分，如需更大调整请分批操作`
        });
      }

      // 计算新的PDF积分
      const newPdfLimit = oldPdfLimit - decreaseAmount;

      // 更新用户的PDF积分
      const [result] = await db.execute(
        'UPDATE users SET pdf_limit = ? WHERE id = ?',
        [newPdfLimit, user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }

      // 记录详细的审计日志（safe级别）
      console.safe(`[审计日志] 管理员减少PDF积分 - 
        操作类型: ${isad === true ? '管理员直接操作' : '普通用户操作'},
        操作者: ${operatorUsername}(ID:${operatorId}),
        目标用户: ${username},
        资源类型: PDF积分,
        变更前值: ${oldPdfLimit},
        变更量: -${decreaseAmount},
        变更后值: ${newPdfLimit},
        登录次数: ${currentLogins},
        IP地址: ${ipAddress},
        User-Agent: ${userAgent},
        时间戳: ${new Date().toISOString()}`);

      console.info(`[PDF管理] PDF积分减少成功 - 操作者: ${operatorUsername}, 用户: ${username}, 原积分: ${oldPdfLimit}, 减少: ${decreaseAmount}, 新积分: ${newPdfLimit}, IP: ${ipAddress}`);

      res.json({
        success: true,
        newPdfLimit,
        decreased: decreaseAmount
      });
    } catch (err) {
      console.error('[PDF管理] 减少PDF积分异常:', err.message, { 
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
