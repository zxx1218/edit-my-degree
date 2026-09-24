/**
 * 测试MySQL LIMIT/OFFSET占位符支持
 */
require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    // 测试1: 直接使用数字（不使用占位符）
    console.log('🧪 测试1: 直接拼接数字');
    const [rows1] = await conn.execute('SELECT * FROM notification_history ORDER BY created_at DESC LIMIT 20 OFFSET 0');
    console.log('✅ 成功，返回', rows1.length, '条记录\n');
    
    // 测试2: 直接拼接数字（正确的方式）
    console.log('🧪 测试2: 直接拼接数字（不使用占位符）');
    const pageSize2 = 20;
    const offset2 = 0;
    const [rows2] = await conn.execute(`SELECT * FROM notification_history ORDER BY created_at DESC LIMIT ${pageSize2} OFFSET ${offset2}`);
    console.log('✅ 成功，返回', rows2.length, '条记录\n');
    
    // 测试3: 检查参数类型
    console.log('🧪 测试3: 检查参数类型');
    console.log('typeof 20:', typeof 20);
    console.log('typeof parseInt(20):', typeof parseInt(20));
    console.log('typeof Number(20):', typeof Number(20));
    
    const pageSizeStr = '20';
    const offset3 = 0;
    console.log('\n字符串pageSize:', typeof pageSizeStr, pageSizeStr);
    console.log('parseInt(pageSize):', typeof parseInt(pageSizeStr), parseInt(pageSizeStr));
    
    const [rows3] = await conn.execute(
      `SELECT * FROM notification_history ORDER BY created_at DESC LIMIT ${Number(pageSizeStr)} OFFSET ${Number(offset3)}`
    );
    console.log('✅ 使用Number()转换后成功，返回', rows3.length, '条记录\n');
    
    console.log('🎉 所有测试通过！');
    
  } catch (err) {
    console.error('❌ 失败:', err.message);
    console.error(err.stack);
  } finally {
    await conn.end();
  }
})();
