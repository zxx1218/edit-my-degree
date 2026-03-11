const mysql = require('mysql2/promise');

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.monitorInterval = null;
    // 判断是否为日志进程（只在进程 0 中记录日志）
    this.isLogProcess = process.env.NODE_APP_INSTANCE === '0' || !process.env.NODE_APP_INSTANCE;
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
      
      // 只在日志进程中打印初始化日志
      if (this.isLogProcess) {
        console.log('数据库连接池初始化成功');
      }
      
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
   * 执行非查询命令（用于不支持预编译语句的命令，如事务控制）
   */
  async executeNonQuery(query) {
    const connection = await this.getConnection();
    try {
      // 使用query方法而不是execute，因为某些命令不支持预编译语句
      const result = await connection.query(query);
      return result;
    } finally {
      connection.release();
    }
  }

  /**
   * 重新连接数据库
   */
  async reconnect() {
    if (this.isLogProcess) {
      console.log('正在尝试重新连接数据库...');
    }
    try {
      if (this.pool) {
        await this.pool.end();
      }
      await this.initializePool();
      if (this.isLogProcess) {
        console.log('数据库重新连接成功');
      }
    } catch (err) {
      console.error('数据库重新连接失败:', err);
      throw err;
    }
  }

  /**
   * 启动连接监控
   */
  startConnectionMonitoring() {
    // 从环境变量读取监控间隔，默认 5 小时
    const healthCheckInterval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL) || 18000000;
    
    // 只在日志进程中进行健康检查和打印日志
    if (!this.isLogProcess) {
      return;
    }
    
    this.monitorInterval = setInterval(async () => {
      try {
        if (this.pool) {
          const connection = await this.pool.getConnection();
          await connection.ping();
          connection.release();
          
          console.log('数据库连接池健康检查：连接正常');
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
      if (this.isLogProcess) {
        console.log('数据库连接监控已停止');
      }
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
      if (this.isLogProcess) {
        console.log('数据库连接池已关闭');
      }
    }
  }

  /**
   * 获取连接池统计信息
   */
  getPoolStats() {
    if (this.pool) {
      // mysql2 的 Pool 对象将实际配置存储在 pool.pool.config 中
      const internalPool = this.pool.pool;
      const poolConfig = internalPool?.config || {};
      
      return {
        isConnected: this.isConnected,
        config: {
          connectionLimit: poolConfig.connectionLimit || 'N/A',
          queueLimit: poolConfig.queueLimit || 'N/A',
          waitForConnections: poolConfig.waitForConnections || 'N/A',
          connectTimeout: poolConfig.connectTimeout || poolConfig.timeout || 'N/A',
          idleTimeout: poolConfig.idleTimeout || 'N/A',
          acquireTimeout: poolConfig.acquireTimeout || 'N/A'
        },
        // 添加更多统计信息
        activeConnections: internalPool?._allConnections ? internalPool._allConnections.length : 'N/A',
        freeConnections: internalPool?._freeConnections ? internalPool._freeConnections.length : 'N/A',
        queuedRequests: internalPool?._connectionQueue ? internalPool._connectionQueue.length : 'N/A'
      };
    }
    return null;
  }
}

// 创建全局数据库管理器实例
const dbManager = new DatabaseManager();

module.exports = dbManager;