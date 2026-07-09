/**
 * 查找剩余登录次数异常的用户
 * 
 * 功能说明：
 * 1. 从指定日期开始检索users表内所有有登录次数的用户（remaining_logins > 0）
 * 2. 检索每个用户使用过的登录次数充值卡（type='login'且used=TRUE）
 * 3. 计算用户所有使用过的登录次数充值卡的总充值数量
 * 4. 筛选出：用户当前剩余登录次数 >= 使用过的充值卡总数量 且 剩余次数 > 0 的用户
 * 5. 输出这些用户的详细信息（用户名、剩余次数、充值卡总数等）
 * 
 * 业务逻辑：
 * - 正常情况下，用户使用的充值卡总数应该等于或大于当前剩余次数
 * - 如果剩余次数 >= 充值卡总数，说明可能存在数据异常（如手动修改数据库）
 * - 此脚本用于排查这类异常情况
 * 
 * 使用方法：
 * cd /home/ctkj/edit-my-degree/backend
 * node batch_task/findAbnormalLoginUsers.js [起始日期]
 * 
 * 参数说明：
 * - 起始日期格式：YYYY-MM-DD（可选，默认为今天）
 * - 示例：node batch_task/findAbnormalLoginUsers.js 2024-01-01
 * 
 * 注意事项：
 * - 确保.env文件中数据库配置正确
 * - 只读操作，不会修改任何数据
 * - 结果会输出到控制台并保存到CSV文件
 */

require('dotenv').config({ path: '../../.env' });

// 兼容性处理：非PM2环境下添加console.safe polyfill
if (!console.safe) {
  console.safe = console.log;
}

const dbManager = require('../src/db-utils');
const fs = require('fs');
const path = require('path');

// 配置参数
const CONFIG = {
  OUTPUT_DIR: './batch_task/output',  // 输出目录
  BATCH_SIZE: 1000,                   // 每批查询的用户数
};

// 统计信息
const stats = {
  totalUsersWithLogins: 0,    // 有登录次数的用户总数
  abnormalUsers: 0,           // 异常用户数
  normalUsers: 0,             // 正常用户数
  startTime: null             // 开始时间
};

/**
 * 格式化时间
 */
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟${seconds % 60}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

/**
 * 解析命令行参数获取起始日期
 */
function parseStartDate() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const dateStr = args[0];
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      console.error(`错误：无效的日期格式 "${dateStr}"，请使用 YYYY-MM-DD 格式`);
      process.exit(1);
    }
    
    console.safe(`使用指定的起始日期：${dateStr}`);
    return date;
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().split('T')[0];
    console.safe(`未指定日期，使用今天作为起始日期：${dateStr}`);
    return today;
  }
}

/**
 * 查询有登录次数的用户列表
 */
async function getUsersWithLogins(startDate) {
  console.safe('\n📊 正在查询有登录次数的用户...');
  
  const query = `
    SELECT id, username, remaining_logins, pdf_limit, created_at, updated_at
    FROM users
    WHERE remaining_logins > 0
    AND DATE(created_at) <= ?
    ORDER BY remaining_logins DESC
  `;
  
  const [users] = await dbManager.execute(query, [startDate.toISOString().split('T')[0]]);
  
  console.safe(`✅ 找到 ${users.length} 个有登录次数的用户\n`);
  return users;
}

/**
 * 查询用户使用过的登录充值卡总数
 */
async function getUserLoginCardTotal(userId) {
  const query = `
    SELECT COALESCE(SUM(c.values), 0) as total_login_cards
    FROM cards c
    WHERE c.used_by = ?
    AND c.type = 'login'
    AND c.used = TRUE
  `;
  
  const [result] = await dbManager.execute(query, [userId]);
  return result[0].total_login_cards;
}

/**
 * 检查用户是否为异常用户
 */
async function checkUserAbnormality(user) {
  const totalLoginCards = await getUserLoginCardTotal(user.id);
  
  // 判断条件：剩余登录次数 >= 使用过的充值卡总数 且 剩余次数 > 0
  const isAbnormal = user.remaining_logins >= totalLoginCards && user.remaining_logins > 0;
  
  return {
    ...user,
    total_login_cards: totalLoginCards,
    is_abnormal: isAbnormal,
    difference: user.remaining_logins - totalLoginCards  // 差值
  };
}

/**
 * 将结果保存为CSV文件
 */
function saveToCSV(abnormalUsers, startDate) {
  try {
    // 创建输出目录
    const outputDir = path.resolve(__dirname, CONFIG.OUTPUT_DIR);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const dateStr = startDate.toISOString().split('T')[0];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `abnormal_users_${dateStr}_${timestamp}.csv`;
    const filepath = path.join(outputDir, filename);
    
    // CSV头部
    const headers = [
      '用户名',
      '剩余登录次数',
      'PDF积分',
      '使用过的充值卡总数',
      '差值(剩余-充值)',
      '创建时间',
      '更新时间',
      '是否异常'
    ];
    
    // 构建CSV内容
    let csvContent = headers.join(',') + '\n';
    
    abnormalUsers.forEach(user => {
      const row = [
        user.username,
        user.remaining_logins,
        user.pdf_limit,
        user.total_login_cards,
        user.difference,
        user.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '',
        user.updated_at ? new Date(user.updated_at).toLocaleString('zh-CN') : '',
        user.is_abnormal ? '是' : '否'
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // 写入文件
    fs.writeFileSync(filepath, '\uFEFF' + csvContent, 'utf8'); // 添加BOM以支持Excel中文显示
    
    console.safe(`\n💾 结果已保存到：${filepath}`);
    return filepath;
  } catch (error) {
    console.error('保存CSV文件失败:', error);
  }
}

/**
 * 主函数
 */
async function main() {
  stats.startTime = Date.now();
  
  console.safe('='.repeat(80));
  console.safe('🔍 开始查找剩余登录次数异常的用户');
  console.safe('='.repeat(80));
  
  try {
    // 初始化数据库连接池
    console.safe('\n🔌 正在初始化数据库连接...');
    await dbManager.initializePool();
    console.safe('✅ 数据库连接成功\n');
    
    // 解析起始日期
    const startDate = parseStartDate();
    
    // 查询有登录次数的用户
    const users = await getUsersWithLogins(startDate);
    stats.totalUsersWithLogins = users.length;
    
    if (users.length === 0) {
      console.safe('⚠️  没有找到符合条件的用户，程序退出');
      await dbManager.close();
      return;
    }
    
    // 逐个检查用户
    console.safe('🔎 正在检查每个用户的充值卡使用情况...\n');
    const allResults = [];
    let processedCount = 0;
    
    for (const user of users) {
      processedCount++;
      
      // 显示进度
      if (processedCount % 100 === 0 || processedCount === users.length) {
        const progress = ((processedCount / users.length) * 100).toFixed(2);
        const elapsed = Date.now() - stats.startTime;
        const estimatedTotal = (elapsed / processedCount) * users.length;
        const remaining = estimatedTotal - elapsed;
        
        console.safe(`进度：${processedCount}/${users.length} (${progress}%) | 已用时：${formatTime(elapsed)} | 预计剩余：${formatTime(remaining)}`);
      }
      
      const result = await checkUserAbnormality(user);
      allResults.push(result);
      
      if (result.is_abnormal) {
        stats.abnormalUsers++;
      } else {
        stats.normalUsers++;
      }
    }
    
    // 筛选出异常用户
    const abnormalUsers = allResults.filter(u => u.is_abnormal);
    
    // 输出统计信息
    const elapsedTime = Date.now() - stats.startTime;
    console.safe('\n' + '='.repeat(80));
    console.safe('📈 检查完成！统计信息：');
    console.safe('='.repeat(80));
    console.safe(`总用户数（有登录次数）：${stats.totalUsersWithLogins}`);
    console.safe(`异常用户数：${stats.abnormalUsers}`);
    console.safe(`正常用户数：${stats.normalUsers}`);
    console.safe(`总用时：${formatTime(elapsedTime)}`);
    console.safe('='.repeat(80));
    
    // 输出异常用户详情
    if (abnormalUsers.length > 0) {
      console.safe('\n🚨 异常用户列表：');
      console.safe('-'.repeat(80));
      console.safe(
        '用户名'.padEnd(20) +
        '剩余次数'.padEnd(12) +
        '充值卡总数'.padEnd(12) +
        '差值'.padEnd(10) +
        '创建时间'
      );
      console.safe('-'.repeat(80));
      
      abnormalUsers.forEach(user => {
        const createTime = user.created_at 
          ? new Date(user.created_at).toLocaleDateString('zh-CN')
          : '未知';
        
        console.safe(
          user.username.padEnd(20) +
          String(user.remaining_logins).padEnd(12) +
          String(user.total_login_cards).padEnd(12) +
          String(user.difference).padEnd(10) +
          createTime
        );
      });
      
      console.safe('-'.repeat(80));
      
      // 保存CSV文件
      saveToCSV(abnormalUsers, startDate);
    } else {
      console.safe('\n✅ 未发现异常用户，所有用户数据正常！');
    }
    
    console.safe('\n✨ 程序执行完毕');
    
  } catch (error) {
    console.error('\n❌ 程序执行出错:', error);
  } finally {
    // 关闭数据库连接池
    console.safe('\n🔌 正在关闭数据库连接...');
    await dbManager.close();
    console.safe('✅ 数据库连接已关闭\n');
  }
}

// 执行主函数
main().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
