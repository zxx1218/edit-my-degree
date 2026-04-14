/**
 * 获取异常登录检测数据接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    try {
      const { days = 7 } = req.body;
      
      // 计算时间范围
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 1. 检测短时间内频繁登录（1小时内登录超过5次）
      const [frequentLogins] = await db.execute(`
        SELECT 
          u.username,
          DATE(l.login_time) as login_date,
          HOUR(l.login_time) as hour,
          COUNT(*) as login_count,
          GROUP_CONCAT(DISTINCT l.id) as log_ids
        FROM login_logs l
        JOIN users u ON l.user_id = u.id
        WHERE l.login_time >= ?
        GROUP BY u.id, DATE(l.login_time), HOUR(l.login_time)
        HAVING login_count > 5
        ORDER BY login_count DESC
      `, [startDate]);

      // 2. 检测异常时间段登录（凌晨0-5点）
      const [abnormalTimeLogins] = await db.execute(`
        SELECT 
          u.username,
          l.login_time,
          HOUR(l.login_time) as hour,
          DATE(l.login_time) as login_date
        FROM login_logs l
        JOIN users u ON l.user_id = u.id
        WHERE l.login_time >= ?
          AND HOUR(l.login_time) >= 0 
          AND HOUR(l.login_time) < 5
        ORDER BY l.login_time DESC
        LIMIT 50
      `, [startDate]);

      // 3. 检测单日登录次数异常（单日超过20次）
      const [dailyAnomalies] = await db.execute(`
        SELECT 
          u.username,
          DATE(l.login_time) as login_date,
          COUNT(*) as daily_logins
        FROM login_logs l
        JOIN users u ON l.user_id = u.id
        WHERE l.login_time >= ?
        GROUP BY u.id, DATE(l.login_time)
        HAVING daily_logins > 20
        ORDER BY daily_logins DESC
      `, [startDate]);

      // 4. 统计总体异常情况
      const totalFrequentLoginUsers = new Set(frequentLogins.map(r => r.username)).size;
      const totalAbnormalTimeLogins = abnormalTimeLogins.length;
      const totalDailyAnomalyUsers = new Set(dailyAnomalies.map(r => r.username)).size;

      res.json({
        success: true,
        anomalies: {
          frequentLogins: frequentLogins.map(record => ({
            username: record.username,
            date: record.login_date,
            hour: `${record.hour.toString().padStart(2, '0')}:00`,
            loginCount: record.login_count
          })),
          abnormalTimeLogins: abnormalTimeLogins.map(record => ({
            username: record.username,
            loginTime: record.login_time,
            hour: `${record.hour.toString().padStart(2, '0')}:00`,
            date: record.login_date
          })),
          dailyAnomalies: dailyAnomalies.map(record => ({
            username: record.username,
            date: record.login_date,
            dailyLogins: record.daily_logins
          }))
        },
        summary: {
          totalFrequentLoginUsers,
          totalAbnormalTimeLogins,
          totalDailyAnomalyUsers,
          period: {
            days,
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
          }
        }
      });
    } catch (err) {
      console.error('获取异常登录检测数据失败:', err);
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
