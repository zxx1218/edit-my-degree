/**
 * 增加用户PDF积分接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    const userAgent = req.headers['user-agent'] || '未知设备';
    
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
        console.warn(`[PDF管理] 增加PDF积分失败 - 用户不存在: ${username}, IP: ${ipAddress}`);
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

      console.info(`[PDF管理] PDF积分增加成功 - 用户: ${username}, 原积分: ${user.pdf_limit}, 增加: ${increaseAmount}, 新积分: ${newPdfLimit}, IP: ${ipAddress}`);

      res.json({
        success: true,
        newPdfLimit,
        increased: increaseAmount
      });
    } catch (err) {
      console.error('[PDF管理] 增加PDF积分异常:', err.message, { 
        username: req.body?.username,
        ip: ipAddress,
        stack: err.stack 
      });
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