const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function testPdfGenerationManagement() {
  console.log('========== 开始测试PDF生成管理功能 ==========\n');
  
  let connection;
  
  try {
    // 1. 建立数据库连接
    console.log('📡 步骤1: 连接数据库...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '991218aa',
      database: process.env.DB_NAME || 'degree_management'
    });
    console.log('✅ 数据库连接成功\n');
    
    // 2. 查询所有PDF生成记录
    console.log('🔍 步骤2: 查询所有PDF生成记录...');
    const [records] = await connection.execute(
      `SELECT 
        qr.id,
        qr.short_code,
        qr.full_url,
        qr.pdf_type,
        qr.created_at,
        qr.expires_at,
        qr.scan_count,
        qr.last_scanned_at
      FROM qr_code_urls qr
      ORDER BY qr.created_at DESC
      LIMIT 5`
    );
    
    console.log(`✅ 找到 ${records.length} 条记录:\n`);
    
    if (records.length === 0) {
      console.log('⚠️ 数据库中暂无PDF生成记录');
      console.log('💡 提示：需要先生成PDF才会产生记录\n');
    } else {
      records.forEach((record, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log(`  ID: ${record.id}`);
        console.log(`  短码: ${record.short_code}`);
        console.log(`  类型: ${record.pdf_type}`);
        console.log(`  创建时间: ${record.created_at}`);
        console.log(`  过期时间: ${record.expires_at}`);
        console.log(`  扫描次数: ${record.scan_count}`);
        console.log(`  最后扫描: ${record.last_scanned_at || '未扫描'}`);
        console.log('');
      });
      
      // 3. 测试更新过期时间
      if (records.length > 0) {
        console.log('🔄 步骤3: 测试更新二维码过期时间...');
        const testRecord = records[0];
        
        // 计算新的过期时间（当前时间 + 30天）
        const now = new Date();
        const newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        // 格式化日期为 MySQL 兼容的格式
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };
        
        const formattedDate = formatDate(newExpiresAt);
        
        console.log(`  原过期时间: ${testRecord.expires_at}`);
        console.log(`  新过期时间: ${formattedDate}`);
        
        await connection.execute(
          'UPDATE qr_code_urls SET expires_at = ? WHERE id = ?',
          [formattedDate, testRecord.id]
        );
        
        console.log('✅ 更新成功\n');
        
        // 验证更新
        const [updated] = await connection.execute(
          'SELECT expires_at FROM qr_code_urls WHERE id = ?',
          [testRecord.id]
        );
        
        console.log(`  验证结果: ${updated[0].expires_at}`);
        console.log('');
      }
    }
    
    // 4. 统计信息
    console.log('📊 步骤4: 统计信息...');
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN pdf_type = 'degree' THEN 1 ELSE 0 END) as degree_count,
        SUM(CASE WHEN pdf_type = 'education' THEN 1 ELSE 0 END) as education_count,
        SUM(CASE WHEN pdf_type = 'student_status' THEN 1 ELSE 0 END) as student_status_count,
        SUM(scan_count) as total_scans
      FROM qr_code_urls`
    );
    
    console.log(`  总记录数: ${stats[0].total}`);
    console.log(`  学位验证: ${stats[0].degree_count}`);
    console.log(`  学历验证: ${stats[0].education_count}`);
    console.log(`  学籍验证: ${stats[0].student_status_count}`);
    console.log(`  总扫描次数: ${stats[0].total_scans || 0}`);
    console.log('');
    
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

testPdfGenerationManagement();
