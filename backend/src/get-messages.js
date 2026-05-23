const { v4: uuidv4 } = require('uuid');

function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || '未知 IP';
    
    try {
      const { page = 1, pageSize = 10 } = req.body;
      
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
        `SELECT id, content, created_at FROM messages ORDER BY created_at DESC LIMIT ${pageSizeNum} OFFSET ${offset}`
      );
      
      console.info(`[留言板] 获取留言列表 - 页码: ${pageNum}, 每页: ${pageSizeNum}, 总数: ${total}, IP: ${ipAddress}`);
      
      res.json({
        success: true,
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at
        })),
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum)
      });
    } catch (error) {
      console.error('[留言板] 获取留言列表异常:', error.message, { 
        ip: ipAddress,
        stack: error.stack 
      });
      res.status(500).json({
        success: false,
        error: '获取留言列表失败'
      });
    }
  };
}

module.exports = { initialize };