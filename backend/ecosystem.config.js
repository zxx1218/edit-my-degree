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
       * 实例数量 - 设置为 1 表示只运行一个实例
       * 如果需要集群模式，可以设置为 "max" 或具体数字
       */
      instances: 1,
      
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
       * 内存限制重启 - 当应用内存使用超过指定值时自动重启
       * 防止内存泄漏导致服务器性能下降
       */
      max_memory_restart: '4G',
      
      /**
       * 默认环境变量配置
       */
      env: {
        /**
         * 节点环境 - 指定运行环境
         */
        NODE_ENV: 'production',
        
        /**
         * 应用监听端口
         */
        PORT: 20000
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
        PORT: 20000
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
        PORT: 20002
      }
    }
  ]
};