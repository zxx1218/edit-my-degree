/**
 * 增加用户PDF积分接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    try {
      const { username, increaseAmount } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: '用户名不能为空'
        });
      }

      if (typeof increaseAmount !== 'number' || increaseAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: '增加数量必须为正整数'
        });
      }

      // 先查询用户
      const [users] = await db.execute(
        'SELECT id, pdf_limit FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const user = users[0];

      // 计算新的PDF积分
      const newPdfLimit = user.pdf_limit + increaseAmount;

      // 更新用户的PDF积分
      const [result] = await db.execute(
        'UPDATE users SET pdf_limit = ? WHERE id = ?',
        [newPdfLimit, user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }

      res.json({
        success: true,
        newPdfLimit,
        increased: increaseAmount
      });
    } catch (err) {
      console.error('Unexpected error:', err);
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