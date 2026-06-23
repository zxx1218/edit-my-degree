#!/usr/bin/env node

/**
 * 数据库迁移执行器
 * 
 * 自动按顺序执行 migrations 目录下的所有迁移脚本
 */

const fs = require('fs');
// 加载环境变量
const path = require('path');
// migrations 目录在: backend/src/database/migrations/
// .env 文件在: project_root/.env
const envPath = path.resolve(__dirname, '../../../../.env');

console.log('加载环境变量文件:', envPath);
require('dotenv').config({ path: envPath });

// 添加 console.safe 的 polyfill（用于非 PM2 环境）
if (!console.safe) {
  console.safe = console.log;
}

async function runAllMigrations() {
  const migrationsDir = __dirname;
  
  // 获取所有迁移脚本文件
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js') && !file.includes('run-all'))
    .sort(); // 按文件名排序（时间戳顺序）
  
  if (files.length === 0) {
    console.log('没有找到迁移脚本');
    return;
  }
  
  console.log(`找到 ${files.length} 个迁移脚本\n`);
  
  // 依次执行每个迁移脚本
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`执行迁移: ${file}`);
    console.log('='.repeat(60));
    
    try {
      // 动态导入并执行迁移
      const migration = require(filePath);
      await migration();
      console.log(`✓ ${file} 执行成功\n`);
    } catch (error) {
      console.error(`✗ ${file} 执行失败:`, error.message);
      console.error('\n停止执行后续迁移');
      process.exit(1);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('所有迁移执行完成！');
  console.log('='.repeat(60));
}

// 执行
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      console.log('\n迁移流程结束');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n迁移流程出错:', error);
      process.exit(1);
    });
}

module.exports = runAllMigrations;
