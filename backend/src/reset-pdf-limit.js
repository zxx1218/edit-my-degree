/**
 * 重置用户PDF积分接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({
          success: false,
          error: '缺少用户名参数'
        });
      }
      
      // 先查询当前PDF积分
      const [users] = await db.execute(
        'SELECT id, pdf_limit FROM users WHERE username = ?',
        [username]
      );
      
      if (users.length === 0) {
        console.warn(`[PDF管理] 重置PDF积分失败 - 用户不存在: ${username}, IP: ${ipAddress}`);
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }
      
      const oldPdfLimit = users[0].pdf_limit;
      
      // 更新用户PDF积分为0
      const [result] = await db.execute(
        'UPDATE users SET pdf_limit = 0 WHERE username = ?',
        [username]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }
      
      console.info(`[PDF管理] PDF积分重置成功 - 用户: ${username}, 原积分: ${oldPdfLimit}, 新积分: 0, IP: ${ipAddress}`);
      
      res.json({
        success: true,
        message: 'PDF积分已重置',
        oldPdfLimit,
        newPdfLimit: 0
      });
    } catch (err) {
      console.error('[PDF管理] 重置PDF积分异常:', err.message, { 
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