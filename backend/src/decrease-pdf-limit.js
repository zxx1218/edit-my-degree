/**
 * 减少用户PDF积分接口（管理员操作）
 * @param {Object} db - 数据库连接实例
 * @param {string} jwtSecret - JWT密钥
 */
const cryptoUtils = require('./crypto-utils');
const { sendIllegalApiCallAlert } = require('./email-notifier');
const jwt = require('jsonwebtoken');

/**
 * 减少用户PDF积分接口（管理员操作）
 * @param {Object} db - 数据库连接实例
 * @param {string} jwtSecret - JWT密钥
 */
function initialize(db, jwtSecret) {
  return async (req, res) => {
    const operationLogger = require('./operation-logger');
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    const userAgent = req.headers['user-agent'] || '未知设备';
    
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
      
      const operatorUsername = decoded.username;
      const operatorId = decoded.id;
      
      const { username, decreaseAmount } = req.body;

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
        ========== 操作详情 ==========
        操作类型: 管理员直接操作,
        操作者: ${operatorUsername}(ID:${operatorId}),
        目标用户: ${username},
        资源类型: PDF积分,
        ========== 变更详情 ==========
        变更前值: ${oldPdfLimit},
        变更量: -${decreaseAmount},
        变更后值: ${newPdfLimit},
        登录次数: ${currentLogins},
        ========== 请求信息 ==========
        IP地址: ${ipAddress},
        User-Agent: ${userAgent},
        时间戳: ${new Date().toISOString()},
        ==============================`);

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
