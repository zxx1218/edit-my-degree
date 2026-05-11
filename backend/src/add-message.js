const { v4: uuidv4 } = require('uuid');

function initialize(db) {
  return async (req, res) => {
    try {
      const { content } = req.body;
      
      // 验证留言内容
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '留言内容不能为空'
        });
      }
      
      // 限制留言长度（最多500字符）
      if (content.length > 500) {
        return res.status(400).json({
          success: false,
          error: '留言内容不能超过500个字符'
        });
      }
      
      const id = uuidv4();
      
      // 插入留言
      await db.execute(
        'INSERT INTO messages (id, content) VALUES (?, ?)',
        [id, content.trim()]
      );
      
      res.json({
        success: true,
        message: '留言成功'
      });
    } catch (error) {
      console.error('添加留言失败:', error);
      res.status(500).json({
        success: false,
        error: '添加留言失败'
      });
    }
  };
}

module.exports = { initialize };
