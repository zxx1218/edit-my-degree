/**
 * 获取范围登录统计接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    try {
      const { range } = req.body; // 'week' 或 'month'
      
      let startDate = new Date();
      if (range === 'week') {
        startDate.setDate(startDate.getDate() - 6); // 包括今天共7天
      } else if (range === 'month') {
        startDate.setDate(startDate.getDate() - 29); // 包括今天共30天
      } else {
        return res.status(400).json({
          success: false,
          error: '无效的范围参数，应为 "week" 或 "month"'
        });
      }
      
      // 格式化日期为 YYYY-MM-DD 字符串
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(new Date());
      
      // 查询日期范围内每天的登录统计数据
      const [dailyStatsResult] = await db.execute(`
        SELECT 
          DATE(login_time) as date,
          COUNT(*) as total_logins,
          COUNT(DISTINCT user_id) as unique_users
        FROM login_logs 
        WHERE DATE(login_time) BETWEEN ? AND ?
        GROUP BY DATE(login_time)
        ORDER BY date
      `, [startDateStr, endDateStr]);
      
      // 构建完整的日期数据数组
      const dailyStats = [];
      const currentDate = new Date(startDate);
      const finalEndDate = new Date(); // 今天
      
      // 将查询结果转换为Map方便查找
      const statsMap = new Map();
      dailyStatsResult.forEach(row => {
        // 处理日期格式，确保键是YYYY-MM-DD格式
        let dateKey = row.date;
        if (row.date instanceof Date) {
          dateKey = formatDate(row.date);
        } else if (typeof row.date === 'string' && row.date.includes('T')) {
          // 如果是ISO格式的日期字符串，提取日期部分
          dateKey = row.date.split('T')[0];
        }
        statsMap.set(dateKey, {
          totalLogins: row.total_logins,
          uniqueUsers: row.unique_users
        });
      });
      
      // 循环每一天，填充数据
      while (currentDate <= finalEndDate) {
        const dateStr = formatDate(currentDate);
        const dateData = statsMap.get(dateStr);
        
        dailyStats.push({
          date: dateStr,
          dateLabel: dateStr,
          totalLogins: dateData ? dateData.totalLogins : 0,
          uniqueUsers: dateData ? dateData.uniqueUsers : 0
        });
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 计算汇总统计
      const totalLogins = dailyStats.reduce((sum, day) => sum + day.totalLogins, 0);
      const totalUniqueUsers = dailyStats.reduce((sum, day) => sum + day.uniqueUsers, 0);
      const avgLogins = dailyStats.length > 0 ? Math.round(totalLogins / dailyStats.length) : 0;
      
      const summary = {
        totalLogins,
        avgLogins,
        totalUniqueUsers,
        days: dailyStats.length
      };
      
      res.json({
        success: true,
        dailyStats,
        summary
      });
    } catch (err) {
      console.error('获取范围登录统计失败:', err);
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