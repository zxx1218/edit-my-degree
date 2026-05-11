const dbManager = require('./db-utils');

/**
 * 初始化留言板模块
 * @param {Object} db - 数据库连接对象
 * @returns {Function} Express 路由处理函数
 */
function initializeMessageBoard(db) {
  return async (req, res) => {
    try {
      const { action } = req.body;

      // 获取留言列表
      if (action === 'getMessages') {
        const { page = 1, pageSize = 5 } = req.body;
        const offset = (page - 1) * pageSize;

        // 查询总记录数
        const [countResult] = await db.execute(
          'SELECT COUNT(*) as total FROM message_board'
        );
        const total = countResult[0].total;

        // 查询分页数据（按时间倒序）
        const [messages] = await db.execute(
          'SELECT id, username, content, created_at FROM message_board ORDER BY created_at DESC LIMIT ? OFFSET ?',
          [parseInt(pageSize), parseInt(offset)]
        );

        return res.json({
          success: true,
          data: messages,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        });
      }

      // 添加新留言
      if (action === 'addMessage') {
        const { username, content } = req.body;

        // 验证参数
        if (!username || !content) {
          return res.status(400).json({
            success: false,
            error: '用户名和留言内容不能为空'
          });
        }

        // 限制留言长度
        if (content.length > 500) {
          return res.status(400).json({
            success: false,
            error: '留言内容不能超过500个字符'
          });
        }

        // 插入新留言
        await db.execute(
          'INSERT INTO message_board (username, content) VALUES (?, ?)',
          [username, content]
        );

        return res.json({
          success: true,
          message: '留言成功'
        });
      }

      // 未知操作
      return res.status(400).json({
        success: false,
        error: '未知的操作类型'
      });

    } catch (error) {
      console.error('留言板接口错误:', error);
      return res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  };
}

module.exports = {
  initializeMessageBoard
};
