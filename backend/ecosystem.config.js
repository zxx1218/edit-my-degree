/**
 * PM2 应用程序生态系统配置文件
 * 用于管理 edit_my_degree_backend 应用的部署和运行
 * 启动方法：
 * pm2 start ecosystem.config.js --env production  在生产环境下启动
 * pm2 save   保存当前进程列表
 * pm2 startup systemd -u $USER --hp /home/$USER  生成启动脚本
 * pm2 save   保存当前进程列表以便开机自启
 */
module.exports = {
  /**
   * 定义要运行的应用程序数组
   */
  apps: [
    {
      /**
       * 应用程序名称，用于在 PM2 控制台中标识此应用程序
       */
      name: 'edit_my_degree_backend',
      
      /**
       * 应用程序的主入口文件路径
       */
      script: './server.js',
      
      /**
       * 实例数量 - 设置为 "max" 表示自动匹配 CPU 核心数
       */
      instances: "max",
      
      /**
       * 集群模式 - 启用多进程集群
       */
      exec_mode: "cluster",
      
      /**
       * 自动重启 - 当应用崩溃时自动重启
       */
      autorestart: true,
      
      /**
       * 文件监听 - 监听文件变化并自动重启应用
       * 生产环境建议设为 false，开发环境可设为 true
       */
      watch: false,
      
      /**
       * 内存限制重启 - 当应用内存超过指定值时自动重启
       * 32G 内存服务器，每个实例限制 800M，40 个实例约占用 32G
       */
      max_memory_restart: '800M',
      
      /**
       * Node.js 选项 - 设置 V8 引擎最大内存
       * 与 max_memory_restart 配合使用，防止内存溢出
       */
      node_args: '--max-old-space-size=768',
      
      /**
       * 默认环境变量配置
       */
      env: {
        /**
         * 节点环境 - 指定运行环境
         */
        NODE_ENV: 'production',
        
        /**
         * 应用监听端口（所有实例共享同一端口）
         */
        PORT: 20000,
        
        /**
         * 数据库连接池配置 - 根据实例数调整
         * 40 个实例，每个实例 2-4 个连接，总共 80-160 个连接
         */
        DB_CONNECTION_LIMIT: '4',
        
        /**
         * 等待连接队列限制
         */
        DB_QUEUE_LIMIT: '100',
        
        /**
         * 数据库连接超时时间（毫秒）
         */
        DB_CONNECT_TIMEOUT: '5000'
      },
      
      /**
       * 生产环境变量配置
       */
      env_production: {
        /**
         * 生产环境标识
         */
        NODE_ENV: 'production',
        
        /**
         * 生产环境运行端口
         */
        PORT: 20000,
        
        /**
         * 生产环境数据库连接池大小
         */
        DB_CONNECTION_LIMIT: '4',
        
        /**
         * 生产环境队列限制
         */
        DB_QUEUE_LIMIT: '100'
      },
      
      /**
       * 开发环境变量配置
       */
      env_development: {
        /**
         * 开发环境标识
         */
        NODE_ENV: 'development',
        
        /**
         * 开发环境运行端口
         */
        PORT: 20002,
        
        /**
         * 开发环境数据库连接池大小（单实例可设置较大）
         */
        DB_CONNECTION_LIMIT: '10'
      }
    }
  ]
};