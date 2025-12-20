/**
 * 获取用户数据接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    try {
      const { userId } = req.body;
      
      // 查询各表数据
      const tables = ['student_status', 'education', 'degree', 'exam'];
      const result = {};
      
      for (const table of tables) {
        const [rows] = await db.execute(
          `SELECT * FROM ${table} WHERE user_id = ?`,
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