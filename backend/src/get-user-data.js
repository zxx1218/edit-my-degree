/**
 * 获取用户数据接口
 * @param {Object} db - 数据库连接实例
 */
const jwt = require('jsonwebtoken');

function initialize(db, JWT_SECRET) {
  return async (req, res) => {
    try {
      const { userId } = req.body;

      // 验证身份：允许用户访问自己的数据，或管理员访问任意数据
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET || process.env.JWT_SECRET);
        const isAdmin = decoded.isAdmin || decoded.is_admin;
        if (!isAdmin && decoded.id !== userId) {
          return res.status(403).json({ success: false, error: '无权访问其他用户数据' });
        }
      }

      const tables = ['student_status', 'education', 'degree', 'exam'];
      const result = {};

      for (const table of tables) {
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