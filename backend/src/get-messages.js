const { v4: uuidv4 } = require('uuid');

function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    
    try {
      const { action, page = 1, pageSize = 10, messageId, replyContent, content, username } = req.body;
      
      // 回复留言
      if (action === 'replyMessage') {
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

        console.info(`[留言板] 回复留言 - ID: ${messageId}, IP: ${ipAddress}`);

        return res.json({
          success: true,
          message: '回复成功'
        });
      }

      // 删除留言
      if (action === 'deleteMessage') {
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

        console.info(`[留言板] 删除留言 - ID: ${messageId}, IP: ${ipAddress}`);

        return res.json({
          success: true,
          message: '删除成功'
        });
      }

      // 默认：获取留言列表
      // 验证分页参数 - 严格的类型转换和安全验证
      const pageNum = Math.max(1, parseInt(page) || 1);
      const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize) || 10));
      const offset = (pageNum - 1) * pageSizeNum;
      
      // 查询留言总数
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM messages'
      );
      const total = countResult[0].total;
      
      // 查询留言列表（按时间倒序）
      // 注意：MySQL预处理语句不支持在LIMIT和OFFSET中使用?占位符
      // 采用字符串拼接方式，但必须经过严格的类型转换和范围验证以防止SQL注入
      const [messages] = await db.execute(
        `SELECT id, username, content, reply_content, replied_at, created_at FROM messages ORDER BY created_at DESC LIMIT ${pageSizeNum} OFFSET ${offset}`
      );
      
      console.info(`[留言板] 获取留言列表 - 页码: ${pageNum}, 每页: ${pageSizeNum}, 总数: ${total}, IP: ${ipAddress}`);
      
      res.json({
        success: true,
        messages: messages.map(msg => ({
          id: msg.id,
          username: msg.username || '匿名用户',
          content: msg.content,
          reply_content: msg.reply_content,
          replied_at: msg.replied_at,
          created_at: msg.created_at
        })),
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum)
      });
    } catch (error) {
      console.error('[留言板] 操作异常:', error.message, { 
        ip: ipAddress,
        stack: error.stack 
      });
      res.status(500).json({
        success: false,
        error: '操作失败，请稍后重试'
      });
    }
  };
}

module.exports = { initialize };