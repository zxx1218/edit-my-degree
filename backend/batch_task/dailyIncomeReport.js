/**
 * 每日收入统计 Bark 推送任务
 *
 * 功能说明：
 * 1. 查询当天使用的卡密记录
 * 2. 根据价格配置计算收入总额
 * 3. 通过 Bark 推送收入日报
 *
 * 价格映射规则：
 * - login 类型 values=5   → PRICE_LOGIN_5
 * - login 类型 values=50  → PRICE_LOGIN_50
 * - login 类型 values=9999999（永久卡）→ PRICE_LOGIN_PERMANENT
 * - pdf 类型 values=30    → PRICE_PDF_30
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// 导入winston日志系统（与主后端共享日志格式和轮转策略）
require('../src/logger');

const dbManager = require('../src/db-utils');
const barkNotifier = require('../src/bark-notifier');
const { getDailyIncomeReport } = require('../src/notifications/templates');

const PRICE_MAP = {
  'login_5': parseFloat(process.env.PRICE_LOGIN_5) || 9,
  'login_50': parseFloat(process.env.PRICE_LOGIN_50) || 29,
  'login_permanent': parseFloat(process.env.PRICE_LOGIN_PERMANENT) || 99,
  'pdf_30': parseFloat(process.env.PRICE_PDF_30) || 30,
};

function getPriceKey(type, values) {
  if (type === 'login') {
    if (values >= 9999999) return 'login_permanent';
    if (values === 50) return 'login_50';
    if (values === 5) return 'login_5';
  } else if (type === 'pdf') {
    if (values === 30) return 'pdf_30';
  }
  return null;
}

function getLabel(key) {
  const labels = {
    login_5: '5次登录卡(9元)',
    login_50: '50次登录卡(29元)',
    login_permanent: '永久卡(99元)',
    pdf_30: '30积分PDF卡(30元)',
  };
  return labels[key] || key;
}

async function main() {
  const startTime = Date.now();

  try {
    await dbManager.initializePool();
    barkNotifier.setDatabase(dbManager);
    await barkNotifier.initialize();

    // 检查每日报告开关
    const isDailyReportEnabled = await barkNotifier.isDailyReportEnabled();
    if (!isDailyReportEnabled) {
      console.log('📊 每日收入统计推送已关闭，跳过执行');
      await dbManager.close();
      return {
        success: true,
        message: '每日收入统计推送已关闭',
        skipped: true,
      };
    }

    // 查询前一天的数据（任务在 0 点运行，统计的是昨天的收入）
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    const todayStr = yesterday.toISOString().slice(0, 10);

    const [rows] = await dbManager.execute(
      `SELECT type, \`values\`, COUNT(*) AS count
       FROM cards
       WHERE used = TRUE AND used_at >= ? AND used_at < ?
       GROUP BY type, \`values\``,
      [yesterday, today]
    );

    let totalIncome = 0;
    const breakdown = [];

    for (const row of rows) {
      const key = getPriceKey(row.type, row.values);
      if (!key) continue;

      const unitPrice = PRICE_MAP[key];
      const subtotal = unitPrice * row.count;
      totalIncome += subtotal;

      breakdown.push({
        label: getLabel(key),
        count: row.count,
        unitPrice,
        subtotal,
      });
    }

    const totalCards = breakdown.reduce((sum, b) => sum + b.count, 0);

    console.log(`📊 ${todayStr} 收入统计:`);
    console.log(`   总卡密使用数: ${totalCards}`);
    console.log(`   总收入: ¥${totalIncome}`);
    breakdown.forEach(b => {
      console.log(`   - ${b.label}: ${b.count}张, 小计 ¥${b.subtotal}`);
    });

    if (totalCards > 0) {
      const notification = getDailyIncomeReport({
        date: todayStr,
        totalCards,
        totalIncome,
        breakdown,
      });

      const result = await barkNotifier.sendNotification(notification);

      console.log(`   Bark推送结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    } else {
      console.log('   今日无卡密使用记录，跳过推送');
    }

    const duration = Date.now() - startTime;
    await dbManager.close();

    return {
      success: true,
      message: '每日收入统计完成',
      stats: { date: todayStr, totalCards, totalIncome, breakdown, duration },
    };

  } catch (error) {
    console.error('❌ 每日收入统计失败:', error.message);
    try { await dbManager.close(); } catch (_) {}
    return {
      success: false,
      message: error.message,
      error: error.stack,
    };
  }
}

module.exports = { main };
