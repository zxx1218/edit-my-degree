/**
 * 专为家中服务器设计的数据库增量同步脚本
 * 
 * 增量同步SFTP文件到本地目录
 * 
 * 功能说明：
 * 1. 连接远程SFTP服务器，获取指定目录下的所有文件和目录信息（包括修改时间）。
 * 2. 获取本地目录下的所有文件和目录信息（包括修改时间）。
 * 3. 对比远程和本地文件列表，执行以下操作：
 *    - 如果远程文件/目录在本地不存在，下载/创建它。
 *    - 如果远程文件存在且修改时间更新，重新下载它。
 *    - 如果本地文件/目录在远程不存在，删除它。
 * 4. 下载大文件时显示进度条和文件大小。
 * 5. 错误处理：在连接、读取、写入过程中捕获并记录错误，确保程序稳定运行。
 * 6. 最后断开SFTP连接，确保资源释放。
 *
 * 注意事项：
 * - 请确保配置中的SFTP连接信息正确，并且本地目录具有适当的读写权限。
 * - 该脚本适用于Node.js环境，需安装ssh2-sftp-client库（npm install ssh2-sftp-client）。
 * - 运行前请备份重要数据，以防止误删除或覆盖。
 */

const Client = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// 配置信息
  const config = {
    host: 'cheerout.cn', // 远程服务器地址
    port: 2222,
    username: 'root', // 登录服务器的用户名
    password: '991218aa', // 登录服务器的密码
    remoteDir: '/home/databasesBackUp/database/mysql/crontab_backup/degree_management', // 要下载的远程数据库备份目录路径
    localDir: '/home/databasesBack' // 本地存储目录路径
  };

// 路径拼接工具函数
const resolvePath = (base, sub) => path.resolve(base, sub).replace(/\\/g, '/');

// 异步读取目录（递归）
const readDirRecursive = async (dir, fileList = [], relativeBase = dir) => {
  const files = await promisify(fs.readdir)(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = resolvePath(dir, file.name);
    const relativePath = fullPath.replace(relativeBase, '').replace(/^\//, '');
    
    if (file.isDirectory()) {
      fileList.push({
        path: relativePath,
        type: 'directory',
        mtime: (await promisify(fs.stat)(fullPath)).mtimeMs
      });
      await readDirRecursive(fullPath, fileList, relativeBase);
    } else {
      fileList.push({
        path: relativePath,
        type: 'file',
        mtime: (await promisify(fs.stat)(fullPath)).mtimeMs
      });
    }
  }
  return fileList;
};

// 主同步函数
const syncSftpFiles = async () => {
  
  const sftp = new Client();
  let remoteFiles = [];
  let localFiles = [];

  try {
    // 1. 连接SFTP服务器
    console.log('正在连接远程服务器...');
    await sftp.connect(config);
    console.log('服务器连接成功！');

    // 2. 创建本地目录（如果不存在）
    if (!fs.existsSync(config.localDir)) {
      fs.mkdirSync(config.localDir, { recursive: true });
    }

    // 3. 获取远程目录所有文件/目录信息
   console.log('正在获取远程文件列表...');
   const listRemoteFiles = async (remotePath, result = [], basePath = config.remoteDir) => {
     const items = await sftp.list(remotePath);
     for (const item of items) {
       const fullRemotePath = resolvePath(remotePath, item.name);
       const relativePath = fullRemotePath.replace(basePath, '').replace(/^\//, '');
        
        if (item.type === 'd') {
          // 处理 modifyTime - 可能是 Date 对象或时间戳
         let mtime = 0;
          if (item.mtime && typeof item.mtime === 'object' && item.mtime instanceof Date) {
            mtime = item.mtime.getTime();
          } else if (item.mtime && typeof item.mtime === 'number') {
            mtime = item.mtime;
          } else if (item.modifyTime) {
            mtime = typeof item.modifyTime === 'object' ? item.modifyTime.getTime() : item.modifyTime;
          }
          result.push({ path: relativePath, type: 'directory', mtime });
          await listRemoteFiles(fullRemotePath, result, basePath);
        } else if (item.type === '-') {
          // 处理文件的 modifyTime
         let mtime = 0;
          if (item.mtime && typeof item.mtime === 'object' && item.mtime instanceof Date) {
            mtime = item.mtime.getTime();
          } else if (item.mtime && typeof item.mtime === 'number') {
            mtime = item.mtime;
          } else if (item.modifyTime) {
            mtime = typeof item.modifyTime === 'object' ? item.modifyTime.getTime() : item.modifyTime;
          }
          result.push({ path: relativePath, type: 'file', mtime });
        }
      }
      return result;
    };
    remoteFiles = await listRemoteFiles(config.remoteDir);

    // 4. 获取本地目录所有文件/目录信息
    console.log('正在获取本地文件列表...');
    localFiles = await readDirRecursive(config.localDir);

    // 5. 增量同步逻辑
    // 5.1 处理需要下载/更新的文件/目录
    for (const remoteItem of remoteFiles) {
      const localItem = localFiles.find(item => item.path === remoteItem.path);
      const localFullPath = resolvePath(config.localDir, remoteItem.path);

      if (remoteItem.type === 'directory') {
        // 确保本地目录存在
        if (!fs.existsSync(localFullPath)) {
          console.log(`创建本地目录: ${localFullPath}`);
          fs.mkdirSync(localFullPath, { recursive: true });
        }
      } else if (remoteItem.type === 'file') {
        // 文件不存在 或 远程文件更新时间更新 → 下载
        if (!localItem || remoteItem.mtime > localItem.mtime) {
         console.log(`📥 下载文件：${remoteItem.path}`);
          
          // 获取文件大小用于显示进度
         const remotePath = resolvePath(config.remoteDir, remoteItem.path);
         const remoteFileInfo = await sftp.stat(remotePath);
         const totalSize = remoteFileInfo.size;
          
          // 格式化文件大小显示
         const formatSize = (bytes) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes/ 1024).toFixed(2) + ' KB';
            if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
          };
          
         console.log(`   文件大小：${formatSize(totalSize)}`);
          
         let downloadedBytes = 0;
         let lastProgressTime = Date.now();
          
          // 创建可读流并监听进度
          await new Promise((resolve, reject) => {
           const readStream = sftp.createReadStream(remotePath);
           const writeStream = fs.createWriteStream(localFullPath);
            
           const updateProgress = () => {
             const progress = ((downloadedBytes / totalSize) * 100).toFixed(1);
             const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
             // 使用 \r 回到行首，实现单行动态更新
             process.stdout.write(`\r   [${progressBar}] ${progress}% (${formatSize(downloadedBytes)}/${formatSize(totalSize)})`);
           };
            
            readStream.on('data', (chunk) => {
              downloadedBytes += chunk.length;
              
              // 限制更新频率，每 100ms 更新一次，避免过于频繁
             const now = Date.now();
              if (now - lastProgressTime >= 100) {
                updateProgress();
                lastProgressTime = now;
              }
            });
            
            readStream.on('error', (err) => {
             console.error(`\n❌ 下载失败：${remoteItem.path}`, { error: err.message });
              reject(err);
            });
            
            writeStream.on('error', (err) => {
             console.error(`\n❌ 写入失败：${remoteItem.path}`, { error: err.message });
              reject(err);
            });
            
            writeStream.on('finish', () => {
              // 确保最后一次进度更新到 100%
              updateProgress();
              // 换行，避免覆盖完成消息
              console.log('\n✅ 下载完成：' + remoteItem.path);
              // 更新本地文件的修改时间（保持和远程一致）
              fs.utimesSync(localFullPath, new Date(), new Date(remoteItem.mtime));
              resolve();
            });
            
            readStream.pipe(writeStream);
          });
        }
      }
    }

    // 5.2 处理需要删除的本地文件/目录（远程已删除）
    for (const localItem of localFiles) {
      const remoteItem = remoteFiles.find(item => item.path === localItem.path);
      const localFullPath = resolvePath(config.localDir, localItem.path);

      if (!remoteItem) {
        console.log(`删除本地${localItem.type === 'file' ? '文件' : '目录'}: ${localItem.path}`);
        if (localItem.type === 'file') {
          fs.unlinkSync(localFullPath);
        } else if (localItem.type === 'directory') {
          // 递归删除空目录（先删子文件，再删目录）
          const deleteDir = (dir) => {
            if (fs.existsSync(dir)) {
              fs.readdirSync(dir).forEach(file => {
                const curPath = resolvePath(dir, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                  deleteDir(curPath);
                } else {
                  fs.unlinkSync(curPath);
                }
              });
              fs.rmdirSync(dir);
            }
          };
          deleteDir(localFullPath);
        }
      }
    }

    console.log('✅ 增量同步完成！');

  } catch (err) {
   console.error('❌ 同步过程出错:', err.message);
    throw err;
  } finally {
    // 确保连接关闭 - ssh2-sftp-client 使用 end() 方法断开连接
    try {
      await sftp.end();
     console.log('已断开服务器连接');
    } catch (e) {
      // 忽略断开连接的错误
    }
  }
};

// 执行同步
syncSftpFiles().catch(err => {
  console.error('同步失败:', err);
  process.exit(1);
});