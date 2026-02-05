const mysql = require('mysql2/promise');

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.monitorInterval = null;
  }

  /**
   * 初始化数据库连接池
   */
  async initializePool() {
    try {
      const poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'degree_management',
        port: process.env.DB_PORT || 3306,
        timezone: process.env.DB_TIMEZONE || '+08:00',
        waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true' || true,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
        connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000
        // 移除了 acquireTimeout 和 timeout，因为它们会产生警告
      };

      this.pool = mysql.createPool(poolConfig);
      
      // 测试连接
      const connection = await this.pool.getConnection();
      await connection.execute(`SET time_zone = '${process.env.DB_TIMEZONE || '+08:00'}'`);
      connection.release();
      
      this.isConnected = true;
      console.log('数据库连接池初始化成功');
      
      // 启动连接监控
      this.startConnectionMonitoring();
      
      return this.pool;
    } catch (err) {
      console.error('数据库连接池初始化失败:', err);
      throw err;
    }
  }

  /**
   * 获取数据库连接
   */
  async getConnection() {
    if (!this.pool || !this.isConnected) {
      await this.reconnect();
    }
    
    try {
      const connection = await this.pool.getConnection();
      // 设置时区
      await connection.execute(`SET time_zone = '${process.env.DB_TIMEZONE || '+08:00'}'`);
      return connection;
    } catch (err) {
      console.error('获取数据库连接失败:', err);
      // 尝试重新连接
      await this.reconnect();
      throw err;
    }
  }

  /**
   * 执行查询（自动管理连接）
   */
  async execute(query, params = []) {
    const connection = await this.getConnection();
    try {
      const result = await connection.execute(query, params);
      return result;
    } finally {
      connection.release();
    }
  }

  /**
   * 重新连接数据库
   */
  async reconnect() {
    console.log('正在尝试重新连接数据库...');
    try {
      if (this.pool) {
        await this.pool.end();
      }
      await this.initializePool();
      console.log('数据库重新连接成功');
    } catch (err) {
      console.error('数据库重新连接失败:', err);
      throw err;
    }
  }

  /**
   * 启动连接监控
   */
  startConnectionMonitoring() {
    // 从环境变量读取监控间隔，默认5小时
    const healthCheckInterval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL) || 18000000;
    
    this.monitorInterval = setInterval(async () => {
      try {
        if (this.pool) {
          const connection = await this.pool.getConnection();
          await connection.ping();
          connection.release();
          
          console.log('数据库连接池健康检查: 连接正常');
        }
      } catch (err) {
        console.warn('数据库连接检查失败，正在尝试重新连接...', err);
        await this.reconnect();
      }
    }, healthCheckInterval);
  }

  /**
   * 停止连接监控
   */
  stopConnectionMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log('数据库连接监控已停止');
    }
  }

  /**
   * 关闭连接池
   */
  async close() {
    this.stopConnectionMonitoring();
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('数据库连接池已关闭');
    }
  }

  /**
   * 获取连接池统计信息
   */
  getPoolStats() {
    if (this.pool) {
      return {
        isConnected: this.isConnected,
        config: {
          connectionLimit: this.pool.config?.connectionLimit || 'N/A',
          queueLimit: this.pool.config?.queueLimit || 'N/A',
          waitForConnections: this.pool.config?.waitForConnections || 'N/A'
        }
      };
    }
    return null;
  }
}

// 创建全局数据库管理器实例
const dbManager = new DatabaseManager();

module.exports = dbManager;