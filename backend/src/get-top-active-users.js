const jwt = require('jsonwebtoken');

/**
 * 获取Top活跃用户排行榜接口
 * @param {Object} db - 数据库连接实例
 * @param {string} jwtSecret - JWT密钥
 */
function initialize(db, jwtSecret) {
  return async (req, res) => {
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
      
      const { limit = 20, days = 30 } = req.body;
      
      // 计算时间范围
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // 验证并转换limit为整数，防止SQL注入
      const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
      
      // 查询指定时间内登录次数最多的用户（排除admin、zxx和test用户）
      const [topUsers] = await db.execute(`
        SELECT 
          u.id,
          u.username,
          COUNT(l.id) as total_logins,
          COUNT(DISTINCT DATE(l.login_time)) as active_days,
          MAX(l.login_time) as last_login,
          MIN(l.login_time) as first_login_in_period
        FROM users u
        LEFT JOIN login_logs l ON u.id = l.user_id 
          AND l.login_time >= ?
        WHERE u.username NOT IN ('admin', 'zxx', 'test')
        GROUP BY u.id, u.username
        HAVING total_logins > 0
        ORDER BY total_logins DESC
        LIMIT ${safeLimit}
      `, [startDate]);

      // 格式化数据
      const formattedUsers = topUsers.map(user => ({
        id: user.id,
        username: user.username,
        totalLogins: user.total_logins,
        activeDays: user.active_days,
        lastLogin: user.last_login,
        firstLoginInPeriod: user.first_login_in_period,
        avgLoginsPerDay: user.active_days > 0 
          ? (user.total_logins / user.active_days).toFixed(1) 
          : 0
      }));

      res.json({
        success: true,
        users: formattedUsers,
        period: {
          days,
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      });
    } catch (err) {
      console.error('获取Top活跃用户失败:', err);
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