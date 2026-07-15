const jwt = require('jsonwebtoken');

/**
 * 更新用户登录次数接口（管理员操作）
 * @param {Object} db - 数据库连接实例
 * @param {string} jwtSecret - JWT密钥
 */
function initialize(db, jwtSecret) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
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
      
      const operatorUsername = decoded.username;
      const operatorId = decoded.id;
      
      const { userId, username, addLogins } = req.body; // 支持通过userId或username
      
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
        操作类型: 管理员直接操作,
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