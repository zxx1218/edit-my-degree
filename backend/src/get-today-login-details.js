const jwt = require('jsonwebtoken');

/**
 * 获取今日登录详情接口
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
      
      // 获取今天的日期字符串（本地时间）
      const today = new Date();
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const todayStr = formatDate(today);

      // 查询今日所有登录记录，包含用户名和登录时间
      const [loginDetails] = await db.execute(`
        SELECT 
          u.username,
          l.login_time
        FROM login_logs l
        JOIN users u ON l.user_id = u.id
        WHERE DATE(l.login_time) = ?
        ORDER BY l.login_time DESC
      `, [todayStr]);

      // 按用户聚合登录记录
      const userMap = new Map();
      loginDetails.forEach(record => {
        if (!userMap.has(record.username)) {
          userMap.set(record.username, {
            username: record.username,
            loginTimes: []
          });
        }
        userMap.get(record.username).loginTimes.push(record.login_time);
      });

      // 转换为数组格式
      const aggregatedData = Array.from(userMap.values()).map(user => ({
        username: user.username,
        loginCount: user.loginTimes.length,
        loginTimes: user.loginTimes.map(time => {
          const date = new Date(time);
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${hours}:${minutes}:${seconds}`;
        })
      }));

      res.json({
        success: true,
        loginDetails: aggregatedData
      });
    } catch (err) {
      console.error('获取今日登录详情失败:', err);
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