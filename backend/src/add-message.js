const { v4: uuidv4 } = require('uuid');

function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    
    try {
      const { content, username } = req.body;
      
      // 验证留言内容
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '留言内容不能为空'
        });
      }
      
      // 限制留言长度（最多500字符）
      if (content.length > 500) {
        console.warn(`[留言板] 添加留言失败 - 内容过长: ${content.length}字符, IP: ${ipAddress}`);
        return res.status(400).json({
          success: false,
          error: '留言内容不能超过500个字符'
        });
      }
      
      // 验证用户名
      if (!username || typeof username !== 'string' || username.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '用户名不能为空'
        });
      }
      
      const id = uuidv4();
      
      // 插入留言（包含username字段）
      await db.execute(
        'INSERT INTO messages (id, username, content) VALUES (?, ?, ?)',
        [id, username.trim(), content.trim()]
      );
      
      console.info(`[留言板] 留言添加成功 - ID: ${id}, 用户: ${username}, 内容长度: ${content.length}字符, IP: ${ipAddress}`);
      
      res.json({
        success: true,
        message: '留言成功',
        messageId: id
      });
    } catch (error) {
      console.error('[留言板] 添加留言异常:', error.message, { 
        ip: ipAddress,
        stack: error.stack 
      });
      res.status(500).json({
        success: false,
        error: '添加留言失败'
      });
    }
  };
}

module.exports = { initialize };