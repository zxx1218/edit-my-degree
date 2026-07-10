/**
 * 减少用户登录次数接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    
    try {
      const { username, decreaseLogins } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: '用户名不能为空'
        });
      }

      if (typeof decreaseLogins !== 'number' || decreaseLogins <= 0) {
        return res.status(400).json({
          success: false,
          error: '减少次数必须为正整数'
        });
      }

      // 先查询用户当前的登录次数和PDF积分
      const [users] = await db.execute(
        'SELECT id, remaining_logins, pdf_limit FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        console.warn(`[账户管理] 减少登录次数失败 - 用户不存在: ${username}, IP: ${ipAddress}`);
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      const user = users[0];

      // 检查用户是否有足够的登录次数
      if (user.remaining_logins <= 0) {
        console.warn(`[账户管理] 减少登录次数失败 - 登录次数不足: 用户=${username}, 当前剩余=${user.remaining_logins}, PDF积分=${user.pdf_limit}, IP: ${ipAddress}`);
        return res.status(400).json({
          success: false,
          error: `登录次数不足，当前剩余：${user.remaining_logins}次，请先充值后再访问`,
          message: '您的账号剩余可登录次数为 0 ，请购买或续费套餐后再登录！'
        });
      }

      // 计算新的登录次数，不能小于0
      const newLogins = Math.max(0, user.remaining_logins - decreaseLogins);
      const actualDecreased = user.remaining_logins - newLogins;

      // 更新用户的登录次数
      const [result] = await db.execute(
        'UPDATE users SET remaining_logins = ? WHERE id = ?',
        [newLogins, user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: '用户未找到'
        });
      }

      console.info(`[账户管理] 登录次数减少成功 - 用户: ${username}, 原次数: ${user.remaining_logins}, PDF积分: ${user.pdf_limit}, 减少: ${actualDecreased}, 新次数: ${newLogins}, IP: ${ipAddress}`);

      res.json({
        success: true,
        newLogins,
        decreased: actualDecreased
      });
    } catch (err) {
      console.error('[账户管理] 减少登录次数异常:', err.message, { 
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