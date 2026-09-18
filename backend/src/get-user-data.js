/**
 * 获取用户数据接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    try {
      const { userId } = req.body;
      
      // 查询各表数据，限制每个表的返回数量以防止数据过大
      const tables = ['student_status', 'education', 'degree', 'exam'];
      const result = {};
      
      for (const table of tables) {
        // 限制每个表最多返回100条记录，避免JSON序列化超出字符串长度限制
        const [rows] = await db.execute(
          `SELECT * FROM ${table} WHERE user_id = ? LIMIT 100`,
          [userId]
        );
        result[table] = rows;
      }
      
      res.json(result);
    } catch (err) {
      console.error(err);
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