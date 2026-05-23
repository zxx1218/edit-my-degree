/**
 * IP黑名单管理脚本
 * 用于手动添加、删除和查看IP黑名单
 * 
 * 使用方法:
 * node manage-ip-blacklist.js add <ip_address> [reason] [days]
 * node manage-ip-blacklist.js remove <ip_address>
 * node manage-ip-blacklist.js list
 * node manage-ip-blacklist.js reload
 */

const dbManager = require('./src/db-utils');
const { loadManualBlacklist } = require('./src/ip-blacklist');

// 初始化数据库连接
async function initialize() {
  try {
    await dbManager.initializePool();
    console.log('数据库连接已建立');
  } catch (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
}

/**
 * 添加IP到黑名单
 */
async function addIp(ipAddress, reason = '手动添加', days = 7) {
  try {
    const blockedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    // 检查是否已存在
    const [existing] = await dbManager.execute(
      'SELECT id FROM ip_blacklist WHERE ip_address = ?',
      [ipAddress]
    );
    
    if (existing.length > 0) {
      console.warn(`IP ${ipAddress} 已在黑名单中，将更新封禁时间`);
      await dbManager.execute(
        'UPDATE ip_blacklist SET reason = ?, blocked_until = ? WHERE ip_address = ?',
        [reason, blockedUntil, ipAddress]
      );
    } else {
      await dbManager.execute(
        'INSERT INTO ip_blacklist (id, ip_address, reason, blocked_until) VALUES (UUID(), ?, ?, ?)',
        [ipAddress, reason, blockedUntil]
      );
    }
    
    console.log(`✓ IP ${ipAddress} 已成功加入黑名单`);
    console.log(`  原因: ${reason}`);
    console.log(`  封禁时长: ${days} 天`);
    console.log(`  解封时间: ${blockedUntil.toISOString()}`);
  } catch (err) {
    console.error('添加IP到黑名单失败:', err);
  }
}

/**
 * 从黑名单中移除IP
 */
async function removeIp(ipAddress) {
  try {
    const [result] = await dbManager.execute(
      'DELETE FROM ip_blacklist WHERE ip_address = ?',
      [ipAddress]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✓ IP ${ipAddress} 已从黑名单中移除`);
    } else {
      console.log(`IP ${ipAddress} 不在黑名单中`);
    }
  } catch (err) {
    console.error('移除IP失败:', err);
  }
}

/**
 * 列出所有黑名单IP
 */
async function listBlacklist() {
  try {
    const [rows] = await dbManager.execute(
      'SELECT ip_address, reason, blocked_until, created_at, TIMESTAMPDIFF(HOUR, NOW(), blocked_until) as hours_remaining FROM ip_blacklist WHERE blocked_until > NOW() ORDER BY blocked_until DESC'
    );
    
    if (rows.length === 0) {
      console.log('当前没有活跃的黑名单IP');
      return;
    }
    
    console.log(`\n=== IP黑名单列表 (${rows.length} 个IP) ===\n`);
    
    rows.forEach((row, index) => {
      console.log(`${index + 1}. IP地址: ${row.ip_address}`);
      console.log(`   原因: ${row.reason}`);
      console.log(`   创建时间: ${row.created_at}`);
      console.log(`   解封时间: ${row.blocked_until}`);
      console.log(`   剩余时间: ${Math.floor(row.hours_remaining / 24)} 天 ${row.hours_remaining % 24} 小时`);
      console.log('');
    });
  } catch (err) {
    console.error('查询黑名单列表失败:', err);
  }
}

/**
 * 重新加载手动配置的黑名单
 */
async function reloadManualBlacklist() {
  console.log('正在重新加载手动配置的黑名单...');
  await loadManualBlacklist();
  console.log('重新加载完成');
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
IP黑名单管理工具

用法:
  node manage-ip-blacklist.js <command> [options]

命令:
  add <ip> [reason] [days]   添加IP到黑名单
                              reason: 封禁原因（默认: "手动添加"）
                              days: 封禁天数（默认: 7）
  
  remove <ip>                从黑名单中移除IP
  
  list                       列出所有活跃的黑名单IP
  
  reload                     重新加载.env中的手动黑名单配置
  
  help                       显示此帮助信息

示例:
  node manage-ip-blacklist.js add 192.168.1.100 "暴力破解" 30
  node manage-ip-blacklist.js remove 192.168.1.100
  node manage-ip-blacklist.js list
  node manage-ip-blacklist.js reload
  `);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    showHelp();
    process.exit(0);
  }
  
  await initialize();
  
  switch (command) {
    case 'add':
      if (!args[1]) {
        console.error('错误: 请提供IP地址');
        console.error('用法: node manage-ip-blacklist.js add <ip_address> [reason] [days]');
        process.exit(1);
      }
      await addIp(args[1], args[2] || '手动添加', parseInt(args[3]) || 7);
      break;
      
    case 'remove':
      if (!args[1]) {
        console.error('错误: 请提供IP地址');
        console.error('用法: node manage-ip-blacklist.js remove <ip_address>');
        process.exit(1);
      }
      await removeIp(args[1]);
      break;
      
    case 'list':
      await listBlacklist();
      break;
      
    case 'reload':
      await reloadManualBlacklist();
      break;
      
    default:
      console.error(`未知命令: ${command}`);
      showHelp();
      process.exit(1);
  }
  
  // 关闭数据库连接
  await dbManager.close();
  process.exit(0);
}

main().catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});
