/**
 * Bark 通知使用示例
 * 
 * 本文件展示了如何在不同场景中使用 Bark 通知功能
 */

const barkNotifier = require('./bark-notifier');

// ============================================
// 示例1: 用户注册成功通知
// ============================================
function notifyUserRegistration(username, ip) {
  if (!barkNotifier.isEnabled()) return;
  
  barkNotifier.sendNotification({
    title: '👤 新用户注册',
    body: `用户 ${username} 已成功注册\n注册IP: ${ip}`,
    subtitle: `注册时间: ${new Date().toLocaleString('zh-CN')}`,
    level: 'active'
  });
}

// ============================================
// 示例2: 异常登录告警
// ============================================
function notifyAbnormalLogin(username, ip, location) {
  if (!barkNotifier.isEnabled()) return;
  
  barkNotifier.sendNotification({
    title: '⚠️ 异常登录告警',
    body: `用户 ${username} 在异常地点登录\nIP: ${ip}\n位置: ${location}`,
    subtitle: '请立即检查账户安全',
    level: 'critical',  // 重要警告级别
    sound: 'alarm'      // 使用警报铃声
  });
}

// ============================================
// 示例3: PDF生成完成通知
// ============================================
function notifyPdfGenerated(username, pdfType) {
  if (!barkNotifier.isEnabled()) return;
  
  const typeMap = {
    degree: '学位验证报告',
    education: '学历验证报告',
    student_status: '学籍验证报告'
  };
  
  barkNotifier.sendNotification({
    title: '📄 PDF生成完成',
    body: `用户 ${username} 的${typeMap[pdfType] || '验证报告'}已生成`,
    subtitle: `生成时间: ${new Date().toLocaleString('zh-CN')}`,
    url: 'http://cheerout.cn:9092/superadd'  // 点击跳转到管理页面
  });
}

// ============================================
// 示例4: 系统维护通知
// ============================================
function notifySystemMaintenance(startTime, endTime, reason) {
  if (!barkNotifier.isEnabled()) return;
  
  barkNotifier.sendNotification({
    title: '🔧 系统维护通知',
    body: `系统将于 ${startTime} 至 ${endTime} 进行维护\n原因: ${reason}`,
    subtitle: '请提前做好准备',
    level: 'timeSensitive',  // 时效性通知
    group: '系统通知'
  });
}

// ============================================
// 示例5: 批量操作完成通知
// ============================================
function notifyBatchOperationComplete(operation, count, duration) {
  if (!barkNotifier.isEnabled()) return;
  
  barkNotifier.sendNotification({
    title: '✅ 批量操作完成',
    body: `${operation} 已完成\n处理数量: ${count} 条\n耗时: ${duration} 秒`,
    subtitle: `完成时间: ${new Date().toLocaleString('zh-CN')}`,
    level: 'passive'  // 仅添加到通知列表，不亮屏
  });
}

// ============================================
// 示例6: 自定义高级通知（带图标和分组）
// ============================================
function notifyWithCustomIcon(title, body, iconUrl, group) {
  if (!barkNotifier.isEnabled()) return;
  
  barkNotifier.sendNotification({
    title: title,
    body: body,
    icon: iconUrl || 'https://picsum.photos/id/237/400/300',
    group: group || '自定义通知',
    sound: 'minuet'
  });
}

// ============================================
// 导出示例函数（供其他模块参考）
// ============================================
module.exports = {
  notifyUserRegistration,
  notifyAbnormalLogin,
  notifyPdfGenerated,
  notifySystemMaintenance,
  notifyBatchOperationComplete,
  notifyWithCustomIcon
};
