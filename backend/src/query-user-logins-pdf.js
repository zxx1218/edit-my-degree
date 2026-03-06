/**
 * 查询用户登录次数和 PDF 积分接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    const operationLogger = require('./operation-logger');
    
    try {
      const { username, password } = req.body;
      
      // 获取客户端信息
      const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
      const userAgent = req.headers['user-agent'] || '未知设备';
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: '缺少用户名或密码参数'
        });
      }
      
      // 验证用户名和密码
      const [users] = await db.execute(
        'SELECT id, username, password, remaining_logins, pdf_limit FROM users WHERE username = ?',
        [username]
      );
      
      if (users.length === 0) {
        // 记录查询失败 - 用户不存在
        operationLogger.logQueryUserLogins('未知', username, ipAddress, userAgent, '失败 - 用户不存在');
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }
      
      const user = users[0];
      
      // 验证密码
      if (user.password !== password) {
        // 记录查询失败 - 密码错误
        operationLogger.logQueryUserLogins(user.id.toString(), user.username, ipAddress, userAgent, '失败 - 密码错误');
        return res.status(401).json({
          success: false,
          error: '密码错误'
        });
      }
      
      // 准备查询数据
      const queryData = {
        remaining_logins: user.remaining_logins,
        pdf_limit: user.pdf_limit
      };
      
      // 记录查询成功
      operationLogger.logQueryUserLogins(user.id.toString(), user.username, ipAddress, userAgent, '成功', queryData);
      
      res.json({
        success: true,
        user: {
          id: user.id.toString(),
          username: user.username,
          remaining_logins: user.remaining_logins,
          pdf_limit: user.pdf_limit
        }
      });
    } catch (err) {
      console.error('查询用户登录信息错误:', err);
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