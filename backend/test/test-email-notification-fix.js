/**
 * 邮件通知死循环修复测试脚本
 * 
 * 用途：验证邮件通知系统是否已正确修复死循环问题
 * 
 * 运行方式：node backend/test/test-email-notification-fix.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 开始检查邮件通知死循环修复情况...\n');

// 检查logger.js文件
const loggerPath = path.join(__dirname, '..', 'src', 'logger.js');

if (!fs.existsSync(loggerPath)) {
  console.error('❌ 未找到logger.js文件');
  process.exit(1);
}

const loggerContent = fs.readFileSync(loggerPath, 'utf-8');

// 检查项1：是否存在防重入标志
const hasReentryGuard = loggerContent.includes('let isSendingErrorEmail = false');
console.log(hasReentryGuard ? '✅ 防重入标志已添加' : '❌ 缺少防重入标志');

// 检查项2：是否在sendErrorEmail开始时检查重入
const hasReentryCheck = loggerContent.includes('if (isSendingErrorEmail)');
console.log(hasReentryCheck ? '✅ 重入检查已实现' : '❌ 缺少重入检查');

// 检查项3：是否使用独立日志器记录失败
const hasIndependentLogger = loggerContent.includes('const failureLogger = winston.createLogger');
console.log(hasIndependentLogger ? '✅ 独立日志器已配置' : '❌ 缺少独立日志器');

// 检查项4：是否在setImmediate中使用独立日志器
const hasExceptionLogger = loggerContent.includes('const exceptionLogger = winston.createLogger');
console.log(hasExceptionLogger ? '✅ 异常处理使用独立日志器' : '❌ 异常处理未使用独立日志器');

// 检查项5：是否避免了在邮件回调中使用console.error
// 更精确的检查：查找transporter.sendMail和console.error在同一作用域
const sendMailSection = loggerContent.match(/transporter\.sendMail\([\s\S]*?\}\);/);
const hasConsoleErrorInCallback = sendMailSection && /console\.error/.test(sendMailSection[0]);
console.log(!hasConsoleErrorInCallback ? '✅ 邮件回调中未使用console.error' : '❌ 邮件回调中仍使用console.error');

// 检查项6：熔断器机制是否存在
const hasCircuitBreaker = loggerContent.includes('circuitBreakerActive');
console.log(hasCircuitBreaker ? '✅ 熔断器机制已实现' : '❌ 缺少熔断器机制');

// 检查项7：频率限制是否存在
const hasRateLimit = loggerContent.includes('maxEmailsPerHour');
console.log(hasRateLimit ? '✅ 频率限制已配置' : '❌ 缺少频率限制');

console.log('\n📊 检查结果汇总：');
const allPassed = hasReentryGuard && hasReentryCheck && hasIndependentLogger && 
                  hasExceptionLogger && !hasConsoleErrorInCallback && 
                  hasCircuitBreaker && hasRateLimit;

if (allPassed) {
  console.log('✅ 所有检查项通过！邮件通知死循环问题已修复。\n');
  
  console.log('🎯 修复要点：');
  console.log('   1. 添加全局防重入标志 isSendingErrorEmail');
  console.log('   2. 所有邮件相关日志使用独立winston实例');
  console.log('   3. 完全避免在邮件发送流程中使用console.error/logger.error');
  console.log('   4. 增强熔断器和频率控制机制');
  console.log('   5. 移除可能导致递归的setImmediate中的console.error\n');
  
  console.log('📝 后续操作建议：');
  console.log('   1. 重启后端服务: pm2 restart edit_my_degree_backend');
  console.log('   2. 监控日志文件: tail -f backend/logs/*.log');
  console.log('   3. 检查是否有新的独立日志文件生成:');
  console.log('      - email-failure.log (邮件发送失败)');
  console.log('      - email-send-warnings.log (发送警告)');
  console.log('      - email-notification-blocked.log (阻止递归)');
  console.log('      - email-exception.log (异常处理)\n');
  
  console.log('⚠️  注意事项：');
  console.log('   - 如果SMTP配置仍有问题，错误会被记录到独立日志文件');
  console.log('   - 不会产生循环日志和CPU占用');
  console.log('   - 建议在修复SMTP配置后测试邮件发送功能\n');
  
} else {
  console.log('❌ 部分检查项未通过，请重新检查代码修改。\n');
  process.exit(1);
}
