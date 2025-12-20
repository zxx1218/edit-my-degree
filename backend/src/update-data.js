const { v4: uuidv4 } = require('uuid');

/**
 * 更新数据接口
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  return async (req, res) => {
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
          
          result = { id };
          break;
          
        case 'delete':
          await db.execute(
            `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
            [id, userId].map(value => value === undefined ? null : value)
          );
          
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
      console.error(err);
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