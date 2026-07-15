const jwt = require('jsonwebtoken');

/**
 * 获取用户活跃度热力图数据接口
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
      
      // 查询过去7天每天的每小时登录数据
      const [heatmapData] = await db.execute(`
        SELECT 
          DAYOFWEEK(login_time) as day_of_week,
          HOUR(login_time) as hour,
          COUNT(*) as login_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM login_logs 
        WHERE login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DAYOFWEEK(login_time), HOUR(login_time)
        ORDER BY day_of_week, hour
      `);

      // 构建热力图数据结构：7天 × 24小时
      const daysOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const heatmap = [];
      
      for (let day = 1; day <= 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const dataPoint = heatmapData.find(
            row => row.day_of_week === day && row.hour === hour
          );
          
          heatmap.push({
            day: daysOfWeek[day - 1],
            dayIndex: day - 1,
            hour: hour,
            hourLabel: `${hour.toString().padStart(2, '0')}:00`,
            loginCount: dataPoint ? dataPoint.login_count : 0,
            uniqueUsers: dataPoint ? dataPoint.unique_users : 0
          });
        }
      }

      res.json({
        success: true,
        heatmap,
        daysOfWeek
      });
    } catch (err) {
      console.error('获取用户活跃度热力图失败:', err);
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