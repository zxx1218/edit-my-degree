const jwt = require('jsonwebtoken');

/**
 * 获取今日登录统计接口
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
      
      // 获取今天的开始和结束时间 (使用本地时间格式 YYYY-MM-DD)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 格式化为 YYYY-MM-DD 字符串
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const todayStr = formatDate(today);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatDate(tomorrow);

      // 查询今日登录总次数
      const [totalLoginsResult] = await db.execute(
        `SELECT COUNT(*) as total_logins 
         FROM login_logs 
         WHERE DATE(login_time) = ?`,
        [todayStr]
      );

      // 查询今日不同用户数
      const [distinctUsersResult] = await db.execute(
        `SELECT COUNT(DISTINCT user_id) as distinct_users 
         FROM login_logs 
         WHERE DATE(login_time) = ?`,
        [todayStr]
      );

      res.json({
        success: true,
        total_logins: totalLoginsResult[0].total_logins,
        distinct_users: distinctUsersResult[0].distinct_users
      });
    } catch (err) {
      console.error('获取今日登录统计失败:', err);
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