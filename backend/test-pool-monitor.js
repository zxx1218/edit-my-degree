require('dotenv').config({ path: '../.env' });

const dbManager = require('./src/db-utils');

async function testPoolMonitor() {
  console.log('开始测试数据库连接池监控...');
  console.log('数据库配置:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });
  
  try {
    // 初始化连接池
    await dbManager.initializePool();
    console.log('连接池初始化完成');
    
    // 调试连接池对象结构
    console.log('连接池对象结构:');
    console.log('- _allConnections:', typeof dbManager.pool._allConnections);
    console.log('- _freeConnections:', typeof dbManager.pool._freeConnections);
    console.log('- _connectionQueue:', typeof dbManager.pool._connectionQueue);
    
    // 显示初始状态
    console.log('初始连接池状态:', dbManager.getPoolStats());
    
    // 模拟一些数据库操作
    console.log('\n执行数据库查询测试...');
    for (let i = 0; i < 3; i++) {
      try {
        const result = await dbManager.execute('SELECT 1 as test');
        console.log(`查询 ${i + 1} 结果:`, result[0][0]);
      } catch (err) {
        console.error(`查询 ${i + 1} 失败:`, err.message);
      }
    }
    
    // 显示操作后的状态
    console.log('\n操作后连接池状态:', dbManager.getPoolStats());
    
    // 等待监控周期
    console.log('\n等待监控检查...');
    setTimeout(() => {
      console.log('最终连接池状态:', dbManager.getPoolStats());
      console.log('测试完成');
      
      // 关闭连接池
      dbManager.close();
    }, 15000); // 等待15秒让监控运行
    
  } catch (err) {
    console.error('测试过程中发生错误:', err);
  }
}

// 运行测试
testPoolMonitor();