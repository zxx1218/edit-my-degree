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

        console.log(`[DEBUG] getMessages - page: ${page}, pageSize: ${pageSize}, offset: ${offset}`);

        // 查询总记录数
        const [countResult] = await db.execute(
          'SELECT COUNT(*) as total FROM messages'
        );
        const total = countResult[0].total;

        // 查询分页数据（按优先级和时间排序）
        // 排序规则：
        // 1. priority有值的留言优先展示（按priority升序）
        // 2. priority为NULL的留言按created_at降序排在后面
        const [messages] = await db.execute(
          `SELECT id, username, content, reply_content, replied_at, priority, created_at 
           FROM messages 
           ORDER BY 
             CASE WHEN priority IS NOT NULL THEN 0 ELSE 1 END,
             priority ASC,
             created_at DESC 
           LIMIT ? OFFSET ?`,
          [parseInt(pageSize), parseInt(offset)]
        );

        console.log(`[DEBUG] getMessages - 返回 ${messages.length} 条留言`);
        if (messages.length > 0) {
          console.log(`[DEBUG] 第一条留言:`, {
            id: messages[0].id,
            username: messages[0].username,
            priority: messages[0].priority,
            priorityType: typeof messages[0].priority
          });
        }

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
          'INSERT INTO messages (username, content) VALUES (?, ?)',
          [username, content]
        );

        return res.json({
          success: true,
          message: '留言成功'
        });
      }

      // 回复留言
      if (action === 'replyMessage') {
        const { messageId, replyContent } = req.body;

        // 验证参数
        if (!messageId || !replyContent) {
          return res.status(400).json({
            success: false,
            error: '留言ID和回复内容不能为空'
          });
        }

        // 限制回复长度
        if (replyContent.length > 1000) {
          return res.status(400).json({
            success: false,
            error: '回复内容不能超过1000个字符'
          });
        }

        // 检查留言是否存在
        const [existingMessages] = await db.execute(
          'SELECT id FROM messages WHERE id = ?',
          [messageId]
        );

        if (existingMessages.length === 0) {
          return res.status(404).json({
            success: false,
            error: '留言不存在'
          });
        }

        // 更新留言，添加回复
        await db.execute(
          'UPDATE messages SET reply_content = ?, replied_at = NOW() WHERE id = ?',
          [replyContent, messageId]
        );

        return res.json({
          success: true,
          message: '回复成功'
        });
      }

      // 删除留言
      if (action === 'deleteMessage') {
        const { messageId } = req.body;

        // 验证参数
        if (!messageId) {
          return res.status(400).json({
            success: false,
            error: '留言ID不能为空'
          });
        }

        // 删除留言
        const [result] = await db.execute(
          'DELETE FROM messages WHERE id = ?',
          [messageId]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            error: '留言不存在'
          });
        }

        return res.json({
          success: true,
          message: '删除成功'
        });
      }

      // 设置留言优先级
      if (action === 'setPriority') {
        const { messageId, priority } = req.body;

        // 验证参数
        if (!messageId) {
          return res.status(400).json({
            success: false,
            error: '留言ID不能为空'
          });
        }

        // priority可以为null（清除优先级）或正整数
        if (priority !== null && (typeof priority !== 'number' || priority < 1)) {
          return res.status(400).json({
            success: false,
            error: '优先级必须为正整数或null'
          });
        }

        // 检查留言是否存在
        const [existingMessages] = await db.execute(
          'SELECT id FROM messages WHERE id = ?',
          [messageId]
        );

        if (existingMessages.length === 0) {
          return res.status(404).json({
            success: false,
            error: '留言不存在'
          });
        }

        // 更新留言优先级
        await db.execute(
          'UPDATE messages SET priority = ? WHERE id = ?',
          [priority, messageId]
        );

        return res.json({
          success: true,
          message: '优先级设置成功'
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
