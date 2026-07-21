/**
 * 测试留言优先级功能
 * 验证priority字段的排序逻辑和置顶效果
 */

// 加载环境变量
const path = require('path');
const envPath = path.resolve(__dirname, '../../.env');
const result = require('dotenv').config({ path: envPath });

if (result.error) {
  console.error('加载 .env 文件失败:', result.error);
} else {
  console.log('✓ 环境变量加载成功');
}

// 添加 console.safe 的 polyfill（用于非 PM2 环境）
if (!console.safe) {
  console.safe = console.log;
}

const dbManager = require('../src/db-utils');

async function testPriorityFeature() {
  let pool;
  
  try {
    console.log('\n========== 开始测试留言优先级功能 ==========\n');
    
    // 初始化数据库连接池
    pool = await dbManager.initializePool();
    
    // 1. 检查priority字段是否存在
    console.log('1. 检查priority字段...');
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'priority'"
    );
    
    if (columns.length === 0) {
      console.error('✗ priority字段不存在！');
      return;
    }
    
    console.log('✓ priority字段存在');
    console.log(`   - 数据类型: ${columns[0].DATA_TYPE}`);
    console.log(`   - 允许NULL: ${columns[0].IS_NULLABLE}`);
    console.log(`   - 默认值: ${columns[0].COLUMN_DEFAULT || 'NULL'}`);
    console.log(`   - 注释: ${columns[0].COLUMN_COMMENT || '无'}`);
    
    // 2. 查看当前留言数据分布
    console.log('\n2. 查看留言数据统计...');
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN priority IS NOT NULL THEN 1 ELSE 0 END) as with_priority,
        SUM(CASE WHEN priority IS NULL THEN 1 ELSE 0 END) as without_priority,
        SUM(CASE WHEN priority = 1 THEN 1 ELSE 0 END) as pinned_count
      FROM messages
    `);
    
    console.log(`   - 总留言数: ${stats[0].total}`);
    console.log(`   - 有优先级的留言: ${stats[0].with_priority}`);
    console.log(`   - 无优先级的留言: ${stats[0].without_priority}`);
    console.log(`   - 置顶留言(priority=1): ${stats[0].pinned_count}`);
    
    // 3. 测试排序逻辑
    console.log('\n3. 测试排序逻辑...');
    const [sortedMessages] = await pool.execute(`
      SELECT id, username, content, priority, created_at 
      FROM messages 
      ORDER BY 
        CASE WHEN priority IS NOT NULL THEN 0 ELSE 1 END,
        priority ASC,
        created_at DESC 
      LIMIT 10
    `);
    
    console.log('   前10条留言的排序结果：');
    sortedMessages.forEach((msg, index) => {
      const priorityDisplay = msg.priority !== null ? `优先级${msg.priority}${msg.priority === 1 ? ' (置顶)' : ''}` : '无优先级';
      const dateStr = new Date(msg.created_at).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log(`   ${index + 1}. [${priorityDisplay}] ${msg.username} - ${dateStr}`);
      console.log(`      内容: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
    });
    
    // 4. 验证排序规则
    console.log('\n4. 验证排序规则...');
    let hasPriorityMessages = false;
    let hasNonPriorityMessages = false;
    let lastPriority = 0;
    let isOrderCorrect = true;
    
    for (let i = 0; i < sortedMessages.length; i++) {
      const msg = sortedMessages[i];
      
      if (msg.priority !== null) {
        hasPriorityMessages = true;
        if (i > 0 && sortedMessages[i-1].priority === null) {
          console.error('   ✗ 排序错误：有优先级的留言出现在无优先级留言之后');
          isOrderCorrect = false;
        }
        if (lastPriority > 0 && msg.priority < lastPriority) {
          console.error(`   ✗ 排序错误：优先级${msg.priority}出现在优先级${lastPriority}之后`);
          isOrderCorrect = false;
        }
        lastPriority = msg.priority;
      } else {
        hasNonPriorityMessages = true;
      }
    }
    
    if (isOrderCorrect) {
      console.log('   ✓ 排序规则正确');
      console.log('     - 有优先级的留言排在前面');
      console.log('     - 按优先级数字从小到大排序');
      console.log('     - 无优先级的留言按时间倒序排在后面');
    }
    
    // 5. 检查置顶留言的特殊标识
    if (stats[0].pinned_count > 0) {
      console.log('\n5. 置顶留言详情...');
      const [pinnedMessages] = await pool.execute(`
        SELECT id, username, content, created_at 
        FROM messages 
        WHERE priority = 1 
        ORDER BY created_at DESC
      `);
      
      pinnedMessages.forEach((msg, index) => {
        const dateStr = new Date(msg.created_at).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`   ${index + 1}. ${msg.username} - ${dateStr}`);
        console.log(`      内容: ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`);
      });
    }
    
    console.log('\n========== 测试完成 ==========\n');
  } catch (err) {
    console.error('✗ 测试失败:', err);
    throw err;
  } finally {
    // 关闭数据库连接
    if (pool) {
      await pool.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testPriorityFeature()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('测试失败:', err);
      process.exit(1);
    });
}

module.exports = { testPriorityFeature };
