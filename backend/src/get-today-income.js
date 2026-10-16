const jwt = require('jsonwebtoken');

const PRICE_MAP = {
  'login_5': parseFloat(process.env.PRICE_LOGIN_5) || 9,
  'login_50': parseFloat(process.env.PRICE_LOGIN_50) || 29,
  'login_permanent': parseFloat(process.env.PRICE_LOGIN_PERMANENT) || 99,
  'pdf_30': parseFloat(process.env.PRICE_PDF_30) || 30,
};

const LABEL_MAP = {
  'login_5': '5次登录卡',
  'login_50': '50次登录卡',
  'login_permanent': '永久卡',
  'pdf_30': '30积分PDF卡',
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

function initialize(db, jwtSecret) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: '未提供访问令牌' });
      }
      const token = authHeader.substring(7);

      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret || process.env.JWT_SECRET || 'default_jwt_secret');
      } catch (err) {
        return res.status(401).json({ success: false, error: '无效的访问令牌' });
      }

      if (!decoded.is_admin && !decoded.isAdmin) {
        return res.status(403).json({ success: false, error: '权限不足' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [rows] = await db.execute(
        `SELECT type, \`values\`, COUNT(*) AS count
         FROM cards
         WHERE used = TRUE AND used_at >= ? AND used_at < ?
         GROUP BY type, \`values\``,
        [today, tomorrow]
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
          key,
          label: LABEL_MAP[key] || key,
          count: row.count,
          unitPrice,
          subtotal,
        });
      }

      const totalCards = breakdown.reduce((sum, b) => sum + b.count, 0);

      res.json({
        success: true,
        date: today.toISOString().slice(0, 10),
        totalCards,
        totalIncome,
        breakdown,
        priceConfig: {
          login_5: PRICE_MAP.login_5,
          login_50: PRICE_MAP.login_50,
          login_permanent: PRICE_MAP.login_permanent,
          pdf_30: PRICE_MAP.pdf_30,
        }
      });
    } catch (err) {
      console.error('获取今日收入统计失败:', err);
      res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  };
}

module.exports = { initialize };
