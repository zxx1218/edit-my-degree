const jwt = require('jsonwebtoken');

/**
 * 重置用户登录次数接口
 * @param {Object} db - 数据库连接实例
 * @param {string} jwtSecret - JWT密钥
 */
function initialize(db, jwtSecret) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    
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
      
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({
          success: false,
          error: '缺少用户名参数'
        });
      }
      
      // 先查询当前登录次数
      const [users] = await db.execute(
        'SELECT id, remaining_logins FROM users WHERE username = ?',
        [username]
      );
      
      if (users.length === 0) {
        console.warn(`[账户管理] 重置登录次数失败 - 用户不存在: ${username}, IP: ${ipAddress}`);
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }
      
      const oldLogins = users[0].remaining_logins;
      
      // 更新用户登录次数为0
      const [result] = await db.execute(
        'UPDATE users SET remaining_logins = 0 WHERE username = ?',
        [username]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }
      
      console.info(`[账户管理] 登录次数重置成功 - 用户: ${username}, 原次数: ${oldLogins}, 新次数: 0, 管理员: ${decoded.username}, IP: ${ipAddress}`);
      
      res.json({
        success: true,
        message: '登录次数已重置',
        oldRemainingLogins: oldLogins,
        newRemainingLogins: 0
      });
    } catch (err) {
      console.error('[账户管理] 重置登录次数异常:', err.message, { 
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