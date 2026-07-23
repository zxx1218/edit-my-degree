/**
 * 批量更新login_logs表中IP地理位置信息
 * 
 * 功能说明：
 * 1. 查询所有需要更新的登录记录（ip_location包含"未知"或"X"字符）
 * 2. 调用更精确的IP归属地API进行查询
 * 3. 批量更新数据库中的ip_location字段
 * 4. 提供详细的处理进度和统计信息
 * 
 * 筛选条件：
 * - login_ip有值且不为空
 * - login_ip不是"::1"（本地IPv6地址）
 * - ip_location包含"未知"或含有"X"字符
 * 
 * 使用方法：
 * # 手动执行
 * cd /home/ctkj/edit-my-degree/backend/batch_task
 * node updateIPLocation.js
 * 
 * # 定时执行（通过 scheduler.js）
 * cd /home/ctkj/edit-my-degree/backend/batch_task
 * node scheduler.js
 * 
 * 注意事项：
 * - 确保.env文件中数据库配置正确
 * - 利用现有的24小时IP缓存机制，避免重复查询
 * - 采用分批处理，每批100条记录，避免API限流
 * - 支持断点续传，可多次执行
 */

// 加载配置文件（从当前目录加载）
require('dotenv').config({ path: './.env' });

// 兼容性处理：非PM2环境下添加console.safe polyfill
if (!console.safe) {
  console.safe = console.log;
}

const dbManager = require('../src/db-utils');
const { queryIPLocation } = require('../src/ip-location');

// 配置参数（优先从环境变量读取，否则使用默认值）
const CONFIG = {
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE) || 100,              // 每批处理的记录数
  DELAY_BETWEEN_BATCHES: parseInt(process.env.DELAY_BETWEEN_BATCHES) || 200,   // 批次间延迟（毫秒）
  DELAY_BETWEEN_IPS: parseInt(process.env.DELAY_BETWEEN_IPS) || 50         // 单个IP查询间的延迟（毫秒）
};

// 统计信息
const stats = {
  total: 0,           // 总记录数
  processed: 0,       // 已处理数
  success: 0,         // 成功更新数
  failed: 0,          // 失败数
  skipped: 0,         // 跳过数（已有有效数据）
  startTime: null     // 开始时间
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
 * 计算预计剩余时间
 */
function estimateRemainingTime(processed, total, elapsed) {
  if (processed === 0) return '计算中...';
  
  const avgTimePerRecord = elapsed / processed;
  const remaining = total - processed;
  const estimatedMs = avgTimePerRecord * remaining;
  
  return formatTime(estimatedMs);
}

/**
 * 获取需要更新的记录列表
 */
async function getRecordsToUpdate() {
  console.log('\n🔍 正在查询需要更新的记录...');
  
  const query = `
    SELECT DISTINCT login_ip, ip_location
    FROM login_logs
    WHERE login_ip IS NOT NULL 
      AND login_ip != '' 
      AND login_ip != '::1'
      AND (ip_location LIKE '%未知%' OR ip_location LIKE '%X%')
    ORDER BY login_ip
  `;
  
  try {
    const [rows] = await dbManager.execute(query);
    console.log(`✅ 找到 ${rows.length} 个需要更新的唯一IP地址\n`);
    return rows;
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    throw error;
  }
}

/**
 * 更新指定IP的所有记录的地理位置
 */
async function updateRecordsForIP(ip, newLocation) {
  const query = `
    UPDATE login_logs 
    SET ip_location = ?
    WHERE login_ip = ?
  `;
  
  try {
    const [result] = await dbManager.execute(query, [newLocation, ip]);
    return result.affectedRows || 0;
  } catch (error) {
    console.error(`   ❌ 更新IP ${ip} 的记录失败:`, error.message);
    throw error;
  }
}

/**
 * 处理单个IP地址
 */
async function processSingleIP(record, index, total) {
  const { login_ip: ip, ip_location: oldLocation } = record;
  
  try {
    // 显示进度
    const progress = ((index + 1) / total * 100).toFixed(1);
    const elapsed = Date.now() - stats.startTime;
    const eta = estimateRemainingTime(index + 1, total, elapsed);
    
    console.log(`[${progress}%] (${index + 1}/${total}) 处理IP: ${ip.padEnd(18)} | 原位置: ${oldLocation.substring(0, 30).padEnd(30)}`);
    
    // 查询新的地理位置
    let newLocation;
    try {
      newLocation = await queryIPLocation(ip);
      
      // 添加延迟，避免API限流
      if (index < total - 1) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_IPS));
      }
    } catch (error) {
      console.warn(`   ⚠️  IP查询失败: ${error.message}`);
      newLocation = '未知';
    }
    
    // 如果查询结果仍然是"未知"，则跳过更新
    if (newLocation === '未知' || newLocation === oldLocation) {
      console.log(`   ⏭️  跳过更新（新位置: ${newLocation}）`);
      stats.skipped++;
      stats.processed++;
      return;
    }
    
    // 更新数据库中该IP的所有记录
    const affectedRows = await updateRecordsForIP(ip, newLocation);
    
    console.log(`   ✅ 更新成功: ${newLocation} (影响 ${affectedRows} 条记录)`);
    stats.success += affectedRows;
    stats.processed++;
    
  } catch (error) {
    console.error(`   ❌ 处理失败: ${error.message}`);
    stats.failed++;
    stats.processed++;
  }
}

/**
 * 主函数 - 执行IP地理位置更新任务
 * 可以被直接调用或被定时任务调度
 */
async function main() {
  stats.startTime = Date.now();
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         批量更新 login_logs 表 IP 地理位置信息            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`⏰ 任务启动时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);
  
  try {
    // 初始化数据库连接
    console.log('🔌 正在连接数据库...');
    await dbManager.initializePool();
    console.log('✅ 数据库连接成功\n');
    
    // 获取需要更新的记录
    const records = await getRecordsToUpdate();
    stats.total = records.length;
    
    if (stats.total === 0) {
      console.log('ℹ️  没有需要更新的记录，任务结束。');
      await dbManager.shutdown();
      return { success: true, message: '没有需要更新的记录', stats };
    }
    
    console.log('📊 处理配置:');
    console.log(`   - 批次大小: ${CONFIG.BATCH_SIZE} 条`);
    console.log(`   - IP查询间隔: ${CONFIG.DELAY_BETWEEN_IPS}ms`);
    console.log(`   - 批次间隔: ${CONFIG.DELAY_BETWEEN_BATCHES}ms\n`);
    
    console.log('🚀 开始处理...\n');
    
    // 逐个处理每个IP
    for (let i = 0; i < records.length; i++) {
      await processSingleIP(records[i], i, records.length);
      
      // 每处理完一批，添加延迟
      if ((i + 1) % CONFIG.BATCH_SIZE === 0 && i < records.length - 1) {
        console.log(`\n⏸️  批次完成，等待 ${CONFIG.DELAY_BETWEEN_BATCHES}ms...\n`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
      }
    }
    
    // 输出最终统计
    const totalTime = Date.now() - stats.startTime;
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                      处理完成统计                         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log(`📈 统计信息:`);
    console.log(`   - 总唯一IP数: ${stats.total}`);
    console.log(`   - 已处理: ${stats.processed}`);
    console.log(`   - ✅ 成功更新记录数: ${stats.success}`);
    console.log(`   - ⏭️  跳过数: ${stats.skipped}`);
    console.log(`   - ❌ 失败数: ${stats.failed}`);
    console.log(`   - ⏱️  总耗时: ${formatTime(totalTime)}`);
    console.log(`   - 📊 平均速度: ${(stats.total / (totalTime / 1000)).toFixed(2)} IP/秒\n`);
    console.log(`⏰ 任务完成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);
    
    if (stats.failed > 0) {
      console.warn('⚠️  有部分IP处理失败，请检查日志了解详情');
    }
    
    return { 
      success: true, 
      message: '任务执行完成', 
      stats: { ...stats, totalTime },
      duration: totalTime
    };
    
  } catch (error) {
    console.error('\n❌ 任务执行失败:', error.message);
    console.error(error.stack);
    return { 
      success: false, 
      message: error.message, 
      stats,
      error: error.stack
    };
  } finally {
    // 关闭数据库连接
    console.log('\n🔌 正在关闭数据库连接...');
    await dbManager.close();
    console.log('✅ 数据库连接已关闭\n');
  }
}

// 导出主函数，供定时任务调度器调用
module.exports = {
  main,
  formatTime,
  CONFIG,
  stats
};

// 如果是直接运行此脚本（而非被导入），则执行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
}
