const jwt = require('jsonwebtoken');

/**
 * 增加用户PDF积分接口（管理员操作）
 * @param {Object} db - 数据库连接实例
 * @param {string} jwtSecret - JWT密钥
 */
function initialize(db, jwtSecret) {
  return async (req, res) => {
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
      
      const { username, increaseAmount } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: '用户名不能为空'
        });
      }

      if (typeof increaseAmount !== 'number' || increaseAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: '增加数量必须为正整数'
        });
      }

      // 先查询用户
      const [users] = await db.execute(
        'SELECT id, pdf_limit, remaining_logins FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        console.warn(`[PDF管理] 增加PDF积分失败 - 用户不存在: ${username}, 操作者: ${operatorUsername}, IP: ${ipAddress}`);
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const user = users[0];
      const oldPdfLimit = user.pdf_limit || 0;
      const currentLogins = user.remaining_logins || 0;

      // 验证调整数值的合理性
      const MAX_SINGLE_OPERATION = 500; // PDF积分单次最多调整500分
      
      if (increaseAmount > MAX_SINGLE_OPERATION) {
        console.warn(`[安全警告] 检测到异常大额PDF积分调整 - 操作者: ${operatorUsername}, 调整量: ${increaseAmount}, IP: ${ipAddress}`);
        return res.status(400).json({
          success: false,
          error: `单次调整不能超过${MAX_SINGLE_OPERATION}分，如需更大调整请分批操作`
        });
      }

      // 计算新的PDF积分
      const newPdfLimit = oldPdfLimit + increaseAmount;
      
      // 验证上限
      if (newPdfLimit > 999999) {
        return res.status(400).json({
          success: false,
          error: 'PDF积分超过系统上限（999999分）'
        });
      }

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
      console.safe(`[审计日志] 管理员增加PDF积分 - 
        ========== 操作详情 ==========
        操作类型: 管理员直接操作,
        操作者: ${operatorUsername}(ID:${operatorId}),
        目标用户: ${username},
        资源类型: PDF积分,
        ========== 变更详情 ==========
        变更前值: ${oldPdfLimit},
        变更量: +${increaseAmount},
        变更后值: ${newPdfLimit},
        登录次数: ${currentLogins},
        ========== 请求信息 ==========
        IP地址: ${ipAddress},
        User-Agent: ${userAgent},
        时间戳: ${new Date().toISOString()},
        ==============================`);

      console.info(`[PDF管理] PDF积分增加成功 - 操作者: ${operatorUsername}, 用户: ${username}, 原积分: ${oldPdfLimit}, 增加: ${increaseAmount}, 新积分: ${newPdfLimit}, IP: ${ipAddress}`);

      res.json({
        success: true,
        newPdfLimit,
        increased: increaseAmount
      });
    } catch (err) {
      console.error('[PDF管理] 增加PDF积分异常:', err.message, { 
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
