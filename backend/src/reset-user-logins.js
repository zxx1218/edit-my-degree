/**
 * 重置用户登录次数接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({
          success: false,
          error: '缺少用户名参数'
        });
      }
      
      // 更新用户登录次数为0
      const [result] = await db.execute(
        'UPDATE users SET remaining_logins = 0 WHERE username = ?',
        [username]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }
      
      res.json({
        success: true,
        message: '登录次数已重置'
      });
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