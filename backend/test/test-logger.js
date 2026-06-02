/**
 * 日志系统测试脚本
 * 
 * 使用方法：
 * node test-logger.js
 * 
 * 此脚本用于测试日志级别分流是否正确工作
 */

const logger = require('../src/logger');

console.log('========== 日志系统测试 ==========\n');

console.log('🧪 开始测试不同级别的日志输出...\n');

// 测试 info 级别
logger.info('这是一条 INFO 级别的日志消息');
console.info('这是通过 console.info 输出的消息');

// 测试 http 级别
logger.http('这是一条 HTTP 级别的日志消息');

// 测试 warn 级别
logger.warn('这是一条 WARN 级别的警告消息');
console.warn('这是通过 console.warn 输出的警告');

// 测试 error 级别
logger.error('这是一条 ERROR 级别的错误消息');
console.error('这是通过 console.error 输出的错误');

// 测试 safe 级别
logger.safe('这是一条 SAFE 级别的安全防护日志');
console.safe('这是通过 console.safe 输出的安全日志');

console.log('\n===========================================');
console.log('✅ 测试完成！请检查以下日志文件：');
console.log('===========================================\n');
console.log('📄 application-YYYY-MM-DD.log   - 应该包含 INFO 和 HTTP 级别的日志');
console.log('📄 application-YYYY-MM-DD.warn  - 应该只包含 WARN 级别的日志');
console.log('📄 application-YYYY-MM-DD.error - 应该只包含 ERROR 级别的日志');
console.log('📄 application-YYYY-MM-DD.safe  - 应该只包含 SAFE 级别的日志\n');

console.log('💡 验证要点:');
console.log('  1. .log 文件中不应该出现 SAFE、WARN、ERROR 级别的日志');
console.log('  2. .warn 文件中应该只有 WARN 级别的日志');
console.log('  3. .error 文件中应该只有 ERROR 级别的日志');
console.log('  4. .safe 文件中应该只有 SAFE 级别的日志');
console.log('  5. 所有日志格式应该是 [INFO]、[WARN]、[ERROR]、[SAFE]，没有多余空格\n');
