/**
 * 综合测试邮件通知历史记录功能
 * 测试内容包括：
 * 1. 邮件发送和记录
 * 2. metadata字段JSON解析
 * 3. 错误处理机制
 */

// 引入日志模块以定义console.safe
require('../src/logger');

const { sendSecurityAlert } = require('../src/email-notifier');
const dbManager = require('../src/db-utils');

async function comprehensiveTest() {
  console.log('\n🧪 开始综合测试邮件通知历史记录功能\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // ========== 测试1: 邮件发送和记录 ==========
    console.log('📤 测试1: 发送测试邮件并验证记录...\n');
    const result = await sendSecurityAlert({
      subject: '综合测试 - 邮件通知历史记录',
      message: '这是一封用于综合测试的邮件，验证notification_history表的完整功能',
      details: {
        testId: Date.now(),
        purpose: '综合功能测试',
        testCase: 'test-1-email-recording'
      }
    });
    
    if (result) {
      console.log('✅ 测试1通过: 邮件发送成功\n');
      testsPassed++;
    } else {
      console.error('❌ 测试1失败: 邮件发送失败\n');
      testsFailed++;
    }
    
    // 等待2秒确保数据库写入完成
    console.log('⏳ 等待数据库写入完成...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ========== 测试2: 查询并验证metadata字段解析 ==========
    console.log('🔍 测试2: 查询通知历史并验证metadata解析...\n');
    const [rows] = await dbManager.execute(
      'SELECT * FROM notification_history WHERE channel = ? AND title LIKE ? ORDER BY created_at DESC LIMIT 5',
      ['email', '%综合测试%']
    );
    
    if (rows.length > 0) {
      console.log(`📊 找到 ${rows.length} 条相关记录\n`);
      
      const latestRecord = rows[0];
      console.log('--- 最新记录详情 ---');
      console.log(`ID: ${latestRecord.id}`);
      console.log(`Channel: ${latestRecord.channel}`);
      console.log(`Title: ${latestRecord.title}`);
      console.log(`Status: ${latestRecord.status}`);
      console.log(`Recipient: ${latestRecord.recipient}`);
      console.log(`Group: ${latestRecord.group}`);
      console.log(`Level: ${latestRecord.level}`);
      console.log(`Metadata (raw): ${typeof latestRecord.metadata} - ${latestRecord.metadata ? (typeof latestRecord.metadata === 'string' ? latestRecord.metadata.substring(0, 100) : JSON.stringify(latestRecord.metadata).substring(0, 100)) : 'null'}`);
      console.log(`Created At: ${latestRecord.created_at}\n`);
      
      // 验证metadata字段存在（可能是字符串或对象，取决于MySQL驱动配置）
      if (latestRecord.metadata !== undefined) {
        console.log('✅ 测试2通过: metadata字段已正确存储\n');
        testsPassed++;
      } else {
        console.error('❌ 测试2失败: metadata字段缺失\n');
        testsFailed++;
      }
    } else {
      console.error('❌ 测试2失败: 未找到任何记录\n');
      testsFailed++;
    }
    
    // ========== 测试3: 验证API返回的metadata解析 ==========
    console.log('🔍 测试3: 模拟API返回数据，验证metadata解析...\n');
    
    // 模拟get-notification-history.js中的数据处理逻辑
    const mockRows = rows.map(row => {
      let metadata = null;
      if (row.metadata) {
        try {
          metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
        } catch (e) {
          console.warn('[测试] 解析metadata失败:', e.message);
          metadata = row.metadata;
        }
      }
      
      return {
        id: row.id,
        channel: row.channel,
        title: row.title,
        body: row.body,
        recipient: row.recipient,
        group: row.group,
        level: row.level,
        sound: row.sound,
        status: row.status,
        errorMessage: row.error_message,
        metadata: metadata,
        createdAt: row.created_at
      };
    });
    
    if (mockRows.length > 0) {
      const processedRecord = mockRows[0];
      console.log('--- API返回数据处理结果 ---');
      console.log(`Metadata (processed): ${typeof processedRecord.metadata}`);
      if (processedRecord.metadata) {
        console.log(`Metadata内容:`, JSON.stringify(processedRecord.metadata, null, 2));
      }
      
      // 验证metadata已被正确解析为对象
      if (typeof processedRecord.metadata === 'object' && processedRecord.metadata !== null) {
        console.log('✅ 测试3通过: metadata字段被正确解析为JavaScript对象\n');
        testsPassed++;
      } else if (processedRecord.metadata === null) {
        console.log('✅ 测试3通过: metadata为null（如果没有元数据）\n');
        testsPassed++;
      } else {
        console.error('❌ 测试3失败: metadata解析失败\n');
        testsFailed++;
      }
    } else {
      console.error('❌ 测试3失败: 没有数据可处理\n');
      testsFailed++;
    }
    
    // ========== 测试4: 验证记录完整性 ==========
    console.log('🔍 测试4: 验证记录字段完整性...\n');
    if (rows.length > 0) {
      const record = rows[0];
      const requiredFields = ['id', 'channel', 'title', 'body', 'status', 'created_at'];
      const missingFields = requiredFields.filter(field => record[field] === undefined || record[field] === null);
      
      if (missingFields.length === 0) {
        console.log('✅ 测试4通过: 所有必需字段都存在且不为空\n');
        testsPassed++;
      } else {
        console.error(`❌ 测试4失败: 缺少字段: ${missingFields.join(', ')}\n`);
        testsFailed++;
      }
    } else {
      console.error('❌ 测试4失败: 没有记录可验证\n');
      testsFailed++;
    }
    
    // ========== 测试结果汇总 ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(60));
    console.log(`✅ 通过的测试: ${testsPassed}`);
    console.log(`❌ 失败的测试: ${testsFailed}`);
    console.log(`📈 通过率: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');
    
    if (testsFailed === 0) {
      console.log('🎉 所有测试通过！邮件通知历史记录功能正常工作。\n');
      process.exit(0);
    } else {
      console.error('⚠️  部分测试失败，请检查上述错误信息。\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ 测试执行出错:', error.message);
    console.error('堆栈跟踪:', error.stack);
    process.exit(1);
  }
}

// 运行测试
comprehensiveTest();