/**
 * 测试通知历史API的SQL查询
 */
require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function testQuery() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'degree_management'
  });

  try {
    console.log('🧪 测试1: 无筛选条件的查询');
    const whereClause = '';
    const queryParams = [];
    const pageSize = 20;
    const offset = 0;
    
    const dataQueryParams = [...queryParams, parseInt(pageSize), parseInt(offset)];
    console.log('参数数组:', dataQueryParams);
    
    // 动态构建SQL避免多余空格
    let dataQuery = 'SELECT * FROM notification_history';
    if (whereClause) {
      dataQuery += ' ' + whereClause;
    }
    dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    
    console.log('SQL查询:', dataQuery);
    
    const [rows] = await connection.execute(dataQuery, dataQueryParams);
    console.log(`✅ 查询成功，返回 ${rows.length} 条记录\n`);
    
    console.log('🧪 测试2: 带筛选条件的查询');
    const whereConditions = ['channel = ?'];
    const queryParams2 = ['bark'];
    const whereClause2 = `WHERE ${whereConditions.join(' AND ')}`;
    const dataQueryParams2 = [...queryParams2, parseInt(pageSize), parseInt(offset)];
    
    let dataQuery2 = 'SELECT * FROM notification_history';
    if (whereClause2) {
      dataQuery2 += ' ' + whereClause2;
    }
    dataQuery2 += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    
    console.log('SQL查询:', dataQuery2);
    console.log('参数数组:', dataQueryParams2);
    
    const [rows2] = await connection.execute(dataQuery2, dataQueryParams2);
    console.log(`✅ 查询成功，返回 ${rows2.length} 条Bark通知记录\n`);
    
    console.log('🎉 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await connection.end();
  }
}

testQuery();
