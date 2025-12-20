const { v4: uuidv4 } = require('uuid');

/**
 * 初始化注册模块
 * @param {Object} db - 数据库连接实例
 */
function initialize(db) {
  /**
   * 用户注册
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async function register(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: '用户名和密码不能为空'
        });
      }

      // 检查用户名是否已存在
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          error: '用户名已存在，请选择其他用户名'
        });
      }

      // 生成UUID作为用户ID
      const userId = uuidv4();

      // 插入新用户，初始登录次数为0
      await db.execute(
        'INSERT INTO users (id, username, password, remaining_logins) VALUES (?, ?, ?, ?)',
        [userId, username, password, 0]
      );

      // 为新用户创建默认的学生状态记录
      const studentStatusId = uuidv4();
      await db.execute(
        `INSERT INTO student_status (id, user_id, name, school, major, study_type, degree_level) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [studentStatusId, userId, '新用户', '清华大学', '汉语言文学', '全日制', '本科']
      );

      // 获取新创建的用户信息
      const [newUsers] = await db.execute(
        'SELECT id, username, remaining_logins FROM users WHERE id = ?',
        [userId]
      );

      const newUser = newUsers[0];

      res.status(200).json({
        success: true,
        user: newUser
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({
        success: false,
        error: '注册失败，请重试'
      });
    }
  }

  return {
    register
  };
}

module.exports = {
  initialize
};