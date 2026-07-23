/**
 * 批量任务模块测试脚本
 * 
 * 功能说明：
 * 1. 测试配置文件加载
 * 2. 测试数据库连接
 * 3. 测试IP地理位置更新任务（单次执行）
 * 4. 验证定时任务调度器配置
 * 
 * 使用方法：
 * cd /home/ctkj/edit-my-degree/backend/batch_task
 * node test-batch-task.js
 */

require('dotenv').config({ path: './.env' });

// 兼容性处理
if (!console.safe) {
  console.safe = console.log;
}

const dbManager = require('../src/db-utils');

// 颜色定义
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function printSeparator(title) {
  const width = 70;
  console.log('\n' + '═'.repeat(width));
  if (title) {
    console.log(`  ${title}`);
    console.log('═'.repeat(width));
  }
}

/**
 * 测试1: 配置文件加载
 */
async function testConfigLoading() {
  printSeparator('测试1: 配置文件加载');
  
  const requiredConfigs = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_PORT',
    'UPDATE_IP_LOCATION_CRON_1',
    'UPDATE_IP_LOCATION_CRON_2',
    'UPDATE_IP_LOCATION_CRON_3',
    'CRON_TIMEZONE'
  ];
  
  let allLoaded = true;
  
  requiredConfigs.forEach(config => {
    const value = process.env[config];
    if (value) {
      log(colors.green, `✅ ${config}: ${value}`);
    } else {
      log(colors.red, `❌ ${config}: 未配置`);
      allLoaded = false;
    }
  });
  
  if (allLoaded) {
    log(colors.green, '\n✅ 所有必需配置项已加载');
  } else {
    log(colors.red, '\n❌ 部分配置项缺失，请检查 .env 文件');
  }
  
  return allLoaded;
}

/**
 * 测试2: 数据库连接
 */
async function testDatabaseConnection() {
  printSeparator('测试2: 数据库连接');
  
  try {
    log(colors.blue, '🔌 正在连接数据库...');
    await dbManager.initializePool();
    log(colors.green, '✅ 数据库连接成功');
    
    // 测试查询
    const [result] = await dbManager.execute('SELECT 1 as test');
    log(colors.green, `✅ 数据库查询测试通过: ${JSON.stringify(result)}`);
    
    await dbManager.close();
    log(colors.green, '✅ 数据库连接已关闭');
    
    return true;
  } catch (error) {
    log(colors.red, `❌ 数据库连接失败: ${error.message}`);
    log(colors.red, error.stack);
    return false;
  }
}

/**
 * 测试3: IP地理位置更新任务（小规模测试）
 */
async function testUpdateIPLocationTask() {
  printSeparator('测试3: IP地理位置更新任务（预览模式）');
  
  try {
    log(colors.blue, '🔍 正在查询需要更新的记录...');
    await dbManager.initializePool();
    
    const query = `
      SELECT DISTINCT login_ip, ip_location
      FROM login_logs
      WHERE login_ip IS NOT NULL 
        AND login_ip != '' 
        AND login_ip != '::1'
        AND (ip_location LIKE '%未知%' OR ip_location LIKE '%X%')
      LIMIT 5
    `;
    
    const [rows] = await dbManager.execute(query);
    
    if (rows.length === 0) {
      log(colors.yellow, '⚠️  没有需要更新的记录');
      await dbManager.close();
      return true;
    }
    
    log(colors.green, `✅ 找到 ${rows.length} 个需要更新的IP（仅显示前5个）:\n`);
    
    rows.forEach((row, index) => {
      log(colors.cyan, `   ${index + 1}. IP: ${row.login_ip.padEnd(18)} | 当前位置: ${row.ip_location}`);
    });
    
    log(colors.yellow, '\n💡 提示: 这是预览模式，不会实际执行更新操作');
    log(colors.yellow, '   如需执行完整更新，请运行: node updateIPLocation.js\n');
    
    await dbManager.close();
    return true;
    
  } catch (error) {
    log(colors.red, `❌ 测试失败: ${error.message}`);
    log(colors.red, error.stack);
    return false;
  }
}

/**
 * 测试4: 定时任务配置验证
 */
async function testCronConfiguration() {
  printSeparator('测试4: 定时任务配置验证');
  
  const cron = require('node-cron');
  
  const schedules = [
    { name: '凌晨0:30', cron: process.env.UPDATE_IP_LOCATION_CRON_1 },
    { name: '中午12:30', cron: process.env.UPDATE_IP_LOCATION_CRON_2 },
    { name: '下午17:30', cron: process.env.UPDATE_IP_LOCATION_CRON_3 }
  ];
  
  let allValid = true;
  
  schedules.forEach(schedule => {
    try {
      const isValid = cron.validate(schedule.cron);
      if (isValid) {
        log(colors.green, `✅ ${schedule.name}: ${schedule.cron} (有效)`);
        
        // 计算下次执行时间（使用正确的API）
        const task = cron.schedule(schedule.cron, () => {}, { 
          scheduled: false,
          timezone: process.env.CRON_TIMEZONE || 'Asia/Shanghai'
        });
        
        // node-cron v3+ 使用 nextRun() 方法
        if (typeof task.nextRun === 'function') {
          const nextRun = task.nextRun();
          if (nextRun) {
            log(colors.cyan, `   下次执行: ${nextRun.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
          }
        }
      } else {
        log(colors.red, `❌ ${schedule.name}: ${schedule.cron} (无效)`);
        allValid = false;
      }
    } catch (error) {
      log(colors.red, `❌ ${schedule.name}: 验证失败 - ${error.message}`);
      allValid = false;
    }
  });
  
  log(colors.cyan, `\n🌍 时区设置: ${process.env.CRON_TIMEZONE || 'Asia/Shanghai'}`);
  
  if (allValid) {
    log(colors.green, '\n✅ 所有定时任务配置有效');
  } else {
    log(colors.red, '\n❌ 部分定时任务配置无效，请检查 .env 文件');
  }
  
  return allValid;
}

/**
 * 主测试函数
 */
async function main() {
  printSeparator('批量任务模块测试套件');
  
  log(colors.blue, '🧪 开始执行批量任务模块测试...\n');
  
  const results = {
    configLoading: false,
    databaseConnection: false,
    ipLocationTask: false,
    cronConfiguration: false
  };
  
  // 执行测试
  results.configLoading = await testConfigLoading();
  results.databaseConnection = await testDatabaseConnection();
  results.ipLocationTask = await testUpdateIPLocationTask();
  results.cronConfiguration = await testCronConfiguration();
  
  // 输出测试结果
  printSeparator('测试结果汇总');
  
  const tests = [
    { name: '配置文件加载', result: results.configLoading },
    { name: '数据库连接', result: results.databaseConnection },
    { name: 'IP地理位置更新任务', result: results.ipLocationTask },
    { name: '定时任务配置', result: results.cronConfiguration }
  ];
  
  let passedCount = 0;
  let failedCount = 0;
  
  tests.forEach(test => {
    if (test.result) {
      log(colors.green, `✅ ${test.name}`);
      passedCount++;
    } else {
      log(colors.red, `❌ ${test.name}`);
      failedCount++;
    }
  });
  
  printSeparator('测试完成');
  
  log(colors.blue, `📊 测试结果: ${passedCount} 通过, ${failedCount} 失败`);
  
  if (failedCount === 0) {
    log(colors.green, '\n🎉 所有测试通过！批量任务模块配置正确。');
    log(colors.green, '\n💡 下一步:');
    log(colors.cyan, '   1. 启动调度器: ./start.sh');
    log(colors.cyan, '   2. 查看状态: pm2 status');
    log(colors.cyan, '   3. 查看日志: pm2 logs batch-task-scheduler\n');
  } else {
    log(colors.red, '\n⚠️  部分测试失败，请检查错误信息并修复配置。');
    log(colors.red, '\n💡 常见问题:');
    log(colors.yellow, '   1. 检查 .env 文件是否存在且配置正确');
    log(colors.yellow, '   2. 确认数据库服务正在运行');
    log(colors.yellow, '   3. 验证依赖包已安装: npm install node-cron\n');
  }
}

// 执行测试
main().catch(error => {
  log(colors.red, '❌ 测试执行失败:', error.message);
  console.error(error.stack);
  process.exit(1);
});
