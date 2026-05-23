const { v4: uuidv4 } = require('uuid');
const { logOperation } = require('./operation-logger');

/**
 * 更新数据接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                      req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';

    try {
      const { table, action, data, id, userId } = req.body;
      
      // 验证表名
      const allowedTables = ['student_status', 'education', 'degree', 'exam'];
      if (!allowedTables.includes(table)) {
        return res.status(400).json({
          success: false,
          error: '无效的表名'
        });
      }
      
      // 验证必要参数
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: '缺少用户ID'
        });
      }
      
      if ((action === 'update' || action === 'delete') && !id) {
        return res.status(400).json({
          success: false,
          error: '缺少记录ID'
        });
      }
      
      // 获取用户名
      let username = 'unknown';
      try {
        const [userResult] = await db.execute(
          'SELECT username FROM users WHERE id = ?',
          [userId]
        );
        if (userResult.length > 0) {
          username = userResult[0].username;
        }
      } catch (err) {
        console.error('[数据操作] 获取用户名失败:', err.message, { userId });
      }
      
      let result;
      
      // 处理数据中的undefined值，将其转换为null
      const sanitizeData = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const sanitized = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = obj[key] === undefined ? null : obj[key];
          }
        }
        return sanitized;
      };
      
      const sanitizedData = sanitizeData(data);
      
      switch (action) {
        case 'insert':
          // 生成UUID作为记录ID
          const recordId = uuidv4();
          
          // 构造插入语句
          const insertData = { id: recordId, ...sanitizedData, user_id: userId };
          
          const columns = Object.keys(insertData).join(', ');
          const placeholders = Object.keys(insertData).map(() => '?').join(', ');
          const values = Object.values(insertData);
          
          await db.execute(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
            values
          );
          
          // 记录操作日志
          logOperation(userId, username, 'insert', table, { id: recordId, ...sanitizedData }, ipAddress, userAgent, 'success');
          
          // 返回完整的数据对象
          const responseData = insertData;
          res.json({ success: true, data: [responseData] }); // 包装成数组以匹配supabase格式
          return;
          
        case 'update':
          // 构造更新语句
          const updates = Object.keys(sanitizedData).map(key => `${key} = ?`).join(', ');
          const updateValues = Object.values(sanitizedData);
          updateValues.push(id, userId); // 添加 id 和 userId 用于 WHERE 条件
          
          await db.execute(
            `UPDATE ${table} SET ${updates} WHERE id = ? AND user_id = ?`,
            updateValues
          );
          
          // 记录操作日志
          logOperation(userId, username, 'update', table, { id, data: sanitizedData }, ipAddress, userAgent, 'success');
          
          result = { id };
          break;
          
        case 'delete':
          // 获取要删除的记录数据用于日志
          let deletedData = {};
          try {
            const [recordResult] = await db.execute(
              `SELECT * FROM ${table} WHERE id = ? AND user_id = ?`,
              [id, userId]
            );
            if (recordResult.length > 0) {
              deletedData = recordResult[0];
            }
          } catch (err) {
            console.error('[数据操作] 获取删除记录数据失败:', err.message, { id, userId });
          }
          
          await db.execute(
            `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
            [id, userId].map(value => value === undefined ? null : value)
          );
          
          // 记录操作日志
          logOperation(userId, username, 'delete', table, { id, data: deletedData }, ipAddress, userAgent, 'success');
          
          result = { id };
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: '无效的操作类型'
          });
      }
      
      res.json({ success: true, result });
    } catch (err) {
      console.error('[数据操作] 操作异常:', err.message, { 
        table: req.body?.table,
        action: req.body?.action,
        userId: req.body?.userId,
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