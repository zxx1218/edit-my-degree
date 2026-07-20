const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

/**
 * 从URL中提取用户名和姓名（与后端相同的逻辑）
 */
function extractUserInfoFromUrl(fullUrl) {
  try {
    const urlObj = new URL(fullUrl);
    const username = urlObj.searchParams.get('username');
    const name = urlObj.searchParams.get('name');
    
    return { 
      username: username || null, 
      name: name || username || '未知用户' 
    };
  } catch (error) {
    // 如果URL解析失败，尝试正则匹配
    const usernameMatch = fullUrl.match(/username=([^&]+)/);
    const nameMatch = fullUrl.match(/[?&]name=([^&]+)/);
    
    const username = usernameMatch ? usernameMatch[1] : null;
    const name = nameMatch ? decodeURIComponent(nameMatch[1]) : (username || '未知用户');
    
    return { username, name };
  }
}

async function testPdfNameExtraction() {
  console.log('========== 测试PDF生成记录中的姓名提取 ==========\n');
  
  let connection;
  
  try {
    // 建立数据库连接
    console.log('📡 步骤1: 连接数据库...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '991218aa',
      database: process.env.DB_NAME || 'degree_management'
    });
    console.log('✅ 数据库连接成功\n');
    
    // 查询所有PDF生成记录
    console.log('🔍 步骤2: 查询并解析PDF记录中的姓名信息...\n');
    const [records] = await connection.execute(
      `SELECT 
        qr.id,
        qr.short_code,
        qr.full_url,
        qr.pdf_type,
        qr.created_at,
        qr.scan_count
      FROM qr_code_urls qr
      ORDER BY qr.created_at DESC
      LIMIT 10`
    );
    
    if (records.length === 0) {
      console.log('⚠️ 数据库中暂无PDF生成记录');
    } else {
      console.log(`✅ 找到 ${records.length} 条记录:\n`);
      
      records.forEach((record, index) => {
        const userInfo = extractUserInfoFromUrl(record.full_url);
        
        console.log(`记录 ${index + 1}:`);
        console.log(`  短码: ${record.short_code}`);
        console.log(`  类型: ${record.pdf_type}`);
        console.log(`  用户名: ${userInfo.username || '无'}`);
        console.log(`  姓名: ${userInfo.name}`);
        console.log(`  扫描次数: ${record.scan_count}`);
        console.log(`  创建时间: ${record.created_at}`);
        console.log('');
      });
      
      // 统计有姓名的记录
      const withName = records.filter(r => {
        const info = extractUserInfoFromUrl(r.full_url);
        return info.name && info.name !== '未知用户';
      });
      
      console.log('📊 统计信息:');
      console.log(`  总记录数: ${records.length}`);
      console.log(`  包含姓名的记录: ${withName.length}`);
      console.log(`  缺少姓名的记录: ${records.length - withName.length}`);
      console.log('');
    }
    
    console.log('✅ 测试完成！\n');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 数据库连接已关闭\n');
    }
  }
}

testPdfNameExtraction();
