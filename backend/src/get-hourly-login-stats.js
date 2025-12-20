/**
 * 获取每小时登录统计接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    try {
      // 获取请求中的日期或者使用今天
      const { date } = req.body;
      let targetDate;
      
      if (date) {
        targetDate = new Date(date);
      } else {
        targetDate = new Date();
      }
      
      targetDate.setHours(0, 0, 0, 0);
      
      // 格式化为 YYYY-MM-DD 字符串
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const targetDateStr = formatDate(targetDate);
      
      // 查询指定日期每小时登录统计数据
      const [hourlyStatsResult] = await db.execute(`
        SELECT 
          HOUR(login_time) as hour,
          COUNT(*) as total_logins,
          COUNT(DISTINCT user_id) as unique_users
        FROM login_logs 
        WHERE DATE(login_time) = ?
        GROUP BY HOUR(login_time)
        ORDER BY hour
      `, [targetDateStr]);

      // 构建24小时的数据数组，确保每个小时都有数据点
      const hourlyStats = [];
      for (let hour = 0; hour < 24; hour++) {
        const hourData = hourlyStatsResult.find(row => row.hour === hour);
        hourlyStats.push({
          hour: hour,
          hourLabel: `${hour.toString().padStart(2, '0')}:00`,
          totalLogins: hourData ? hourData.total_logins : 0,
          uniqueUsers: hourData ? hourData.unique_users : 0
        });
      }

      res.json({
        success: true,
        hourlyStats
      });
    } catch (err) {
      console.error('获取每小时登录统计失败:', err);
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