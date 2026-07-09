const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');
const logger = require('../logger');
const minio = require('minio');
const qrCodeManager = require('../qr-code-manager');

// 初始化 MinIO 客户端
const minioClient = new minio.Client({
  endPoint: (process.env.MINIO_ENDPOINT || 'cheerot.cn:19000').split(':')[0], // 提取主机名
  port: parseInt((process.env.MINIO_ENDPOINT || 'cheerot.cn:19000').split(':')[1]) || 19000, // 提取端口号
  useSSL: process.env.MINIO_USE_SSL === 'true' || false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'editmydegree';

// 上传照片到 MinIO
const uploadPhotoToMinIO = async (base64Data, studentName) => {
  try {
    logger.info(`🔄 开始上传照片到 MinIO...`);
    
    // 从 Base64 字符串中提取图片数据
    const imageBuffer= Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    
    // 确定图片类型
    let imageType = 'jpeg';
    if (base64Data.startsWith('data:image/png')) {
      imageType = 'png';
    } else if (base64Data.startsWith('data:image/jpeg') || base64Data.startsWith('data:image/jpg')) {
      imageType = 'jpeg';
    }
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `photos/${studentName}_${timestamp}_${randomString}.${imageType}`;
    
    logger.info(`📁 MinIO 文件路径：${fileName}`);
    
    // 检查 bucket 是否存在，不存在则创建
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      logger.info(`🪣 Bucket 不存在，正在创建：${BUCKET_NAME}`);
      await minioClient.makeBucket(BUCKET_NAME);
      logger.info(`✅ Bucket 创建成功：${BUCKET_NAME}`);
    } else {
      logger.info(`✅ Bucket 已存在：${BUCKET_NAME}`);
    }
    
    // 上传文件到 MinIO
    await minioClient.putObject(BUCKET_NAME, fileName, imageBuffer, {
      'Content-Type': `image/${imageType}`,
      'x-amz-acl': 'public-read'
    });
    
    // 构建可访问的 URL - 在上传成功后才构建和打印日志
    // 注意：这里假设使用 HTTP 访问，如果需要 HTTPS 请相应修改
    const photoUrl = `http://${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${fileName}`;
    
    logger.info(`✅ 照片上传成功到 MinIO: ${fileName}`);
    logger.info(`🔗 照片访问 URL: ${photoUrl}`);
    
    return photoUrl;
  } catch (error) {
    logger.error(`❌ 上传照片到 MinIO 失败：${error.message}`);
    throw error;
  }
};

const generateEducationPdf = async (req, res) => {
  try {
    logger.info('==========🚀 开始生成学历在线验证报告 PDF...==========');
    
    // 从请求中获取数据库连接（由中间件注入）
    const db = req.app.locals.db;
    if (!db) {
      logger.error('❌ 数据库连接不可用');
      return res.status(500).json({
        success: false,
        error: '服务器配置错误'
      });
    }
    
    // 初始化二维码管理器
    const qrManager = qrCodeManager.initialize(db);
    
    // 从请求中获取数据
    const {
      name,
      gender,
      birthDate,
      enrollmentDate,
      graduationDate,
      school,
      major,
      duration,
      degreeLevel,
      educationType,
      studyType,
      graduationStatus,
      certificateNumber,
      principalName,
      photo
    } = req.body;

    logger.info(`📝 接收到的数据：${JSON.stringify({
      name,
      gender,
      birthDate,
      enrollmentDate,
      graduationDate,
      school,
      major,
      duration,
      degreeLevel,
      educationType,
      studyType,
      graduationStatus,
      certificateNumber,
      principalName,
      photo: photo ? '照片数据已接收' : '无照片数据'
    })}`);

    // 验证必要字段
    if (!name || !gender || !birthDate || !enrollmentDate || !graduationDate || 
        !school || !major || !duration || !degreeLevel || !educationType || 
        !studyType || !graduationStatus || !certificateNumber || !principalName) {
      logger.warn('⚠️ 缺少必要字段，无法生成 PDF', { 
        missingFields: { 
          name, gender, birthDate, enrollmentDate, graduationDate, 
          school, major, duration, degreeLevel, educationType, 
          studyType, graduationStatus, certificateNumber, principalName 
        } 
      });
      return res.status(400).json({
        success: false,
        error: '缺少必要字段'
      });
    }

    // 模板路径
    const templatePath = path.join(__dirname, '../../assets', 'xueli_tmp.pdf');
    logger.info(`📁 PDF 模板路径：${templatePath}`);
    
    // 检查模板文件是否存在
    try {
      await fs.access(templatePath);
      logger.info('✅ PDF 模板文件存在');
    } catch (error) {
      logger.error('❌ PDF 模板文件不存在：', error.message);
      return res.status(500).json({
        success: false,
        error: 'PDF模板文件不存在'
      });
    }

    // 读取模板文件
    logger.info('📖 正在读取 PDF 模板文件...');
    const templateBytes = await fs.readFile(templatePath);
    if (!templateBytes) {
      throw new Error('无法读取 PDF 模板文件');
    }
    logger.info(`✅ PDF 模板文件读取完成，大小：${templateBytes.length} 字节`);
    
    // 加载 PDF 模板并注册 fontkit
    logger.info('🔄 正在加载 PDF 文档...');
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    logger.info('✅ PDF 文档加载完成');
    
    // 尝试加载中文字体（如果存在）
    let defaultFont, sourceHanFont;
    try {
      logger.info('🔄 尝试加载自定义中文字体...');
      const defaultFontPath = path.join(__dirname, '../../fonts', 'msyh.ttf');
      const sourceHanFontPath = path.join(__dirname, '../../fonts', 'SourceHanSansK-Regular.TTF');
      
      logger.info(`📁 字体路径：defaultFontPath=${defaultFontPath}, sourceHanFontPath=${sourceHanFontPath}`);
      
      // 检查字体文件是否存在
      await fs.access(defaultFontPath);
      await fs.access(sourceHanFontPath);
      logger.info('✅ 字体文件存在');
      
      // 加载字体文件
      logger.info('🔄 正在加载字体文件...');
      const defaultFontBytes = await fs.readFile(defaultFontPath);
      const sourceHanFontBytes = await fs.readFile(sourceHanFontPath);
      
      defaultFont = await pdfDoc.embedFont(defaultFontBytes);
      sourceHanFont = await pdfDoc.embedFont(sourceHanFontBytes);
      logger.info('✅ 自定义字体加载成功');
    } catch (error) {
      logger.warn(`⚠️ 无法加载自定义字体，使用默认字体：${error.message}`);
      // 使用默认字体
      defaultFont = await pdfDoc.embedStandardFont('Helvetica');
      sourceHanFont = defaultFont; // 如果无法加载 SourceHan 字体，使用默认字体
    }

    // 获取当前日期（中文格式）
    const now = new Date();
    const currentDate = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日`;
    logger.info(`📅 当前日期：${currentDate}`);

    // 获取第一页
    const page = pdfDoc.getPage(0);
    logger.info('✅ 获取 PDF 页面成功');
    
    // 定义文本内容配置
    const texts = [
      { content: currentDate, x: 285, y: 748, fontSize: 10, color: rgb(0.588, 0.588, 0.588), font: sourceHanFont, specialFont: true },
      { content: name, x: 179, y: 713, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: gender, x: 179, y: 687, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: birthDate, x: 179, y: 661, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: enrollmentDate, x: 179, y: 635, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: graduationDate, x: 179, y: 609, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: school, x: 179, y: 583, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: major, x: 179, y: 557, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: duration, x: 179, y: 531, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: degreeLevel, x: 179, y: 505, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: educationType, x: 179, y: 479, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: studyType, x: 179, y: 453, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: graduationStatus, x: 179, y: 427, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: certificateNumber, x: 179, y: 401, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: principalName, x: 179, y: 375, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont }
    ];

    // 添加文本到 PDF
    logger.info('🔄 开始向 PDF 添加文本内容...');
    for (const text of texts) {
      page.drawText(text.content, {
        x: text.x,
        y: text.y,
        size: text.fontSize,
        font: text.specialFont ? text.font : defaultFont,
        color: text.color,
      });
    }
    logger.info('✅ 文本内容添加完成');

    // 添加照片到 PDF（如果提供了照片）
    let uploadedPhotoUrl = null;
    if (photo) {
      try {
        logger.info('🔄 开始处理照片...');
        
        // 上传照片到 MinIO
        try {
          uploadedPhotoUrl = await uploadPhotoToMinIO(photo, name);
          logger.info(`✅ 照片已上传到 MinIO: ${uploadedPhotoUrl}`);
        } catch (uploadError) {
          logger.error(`❌ 上传照片到 MinIO 失败，但继续生成 PDF: ${uploadError.message}`);
          // 上传失败不中断流程，继续使用本地处理
        }
        
        // 从 Base64 字符串中提取图片数据
        const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer= Buffer.from(base64Data, 'base64');
        
        // 确定图片类型并嵌入到 PDF 中
        let photoImage;
        if (photo.startsWith('data:image/jpeg') || photo.startsWith('data:image/jpg')) {
          logger.info('📷 检测到 JPG 或者 JPEG 格式照片');
          photoImage = await pdfDoc.embedJpg(imageBuffer);
        } else if (photo.startsWith('data:image/png')) {
          logger.info('📷 检测到 PNG 格式照片');
          try {
            photoImage = await pdfDoc.embedPng(imageBuffer);
          } catch (pngError) {
            logger.warn(`⚠️ PNG 解析失败，尝试用 JPG 解析：${pngError}`);
            // 如果 PNG 解析失败，尝试用 JPG 解析
            try {
              photoImage = await pdfDoc.embedJpg(imageBuffer);
              logger.info('✅ 使用 JPG 解析成功');
            } catch (jpgError) {
              logger.warn(`⚠️ JPG 解析也失败了，使用默认 PNG 解析：${jpgError}`);
              // 如果都失败了，默认再试一次 PNG
              photoImage = await pdfDoc.embedPng(imageBuffer);
            }
          }
        } else {
          // 尝试自动检测图片类型
          logger.info('📷 无法确定照片格式，尝试自动检测');
          try {
            photoImage = await pdfDoc.embedPng(imageBuffer);
            logger.info('✅ 自动检测为 PNG 格式');
          } catch (pngError) {
            logger.warn(`⚠️ PNG 解析失败，尝试 JPG 解析：${pngError.message}`);
            try {
              photoImage = await pdfDoc.embedJpg(imageBuffer);
              logger.info('✅ 自动检测为 JPG 格式');
            } catch (jpgError) {
              logger.error(`❌ 无法解析图片数据：${jpgError.message}`);
              throw new Error('无法识别的图片格式');
            }
          }
        }
        
        // 证件照配置
        const photoConfig = { 
          x: 455.5, // 右侧X坐标（根据PDF宽度调整）
          y: 627.5, // Y坐标（与文字区域对齐）
          width: 79.5, // 证件照宽度
          height: 106, // 证件照高度（保持1:1.33的标准证件照比例）
          borderWidth: 0, // 边框宽度设为0，去掉黑色边框
          borderColor: rgb(0, 0, 0) // 边框颜色（黑色，此时已无效）
        };

        // 添加证件照（无边框）
        const { x, y, width: photoWidth, height: photoHeight } = photoConfig;
        page.drawImage(photoImage, { 
          x: x, 
          y: y, 
          width: photoWidth, 
          height: photoHeight, 
          fit: 'contain', 
          align: 'center', 
          valign: 'center' 
        });
        logger.info(`✅ 已添加证件照（位置：x=${x}, y=${y}，尺寸：${photoWidth}x${photoHeight}，无边框）`);
      } catch (photoError) {
        logger.error(`❌ 处理照片时出错：${photoError.message}`);
        // 继续执行而不中断整个过程
      }
    } else {
      logger.info('📸 未提供照片，跳过照片添加步骤');
    }

    // 生成并添加二维码
    try {
      logger.info('🔄 开始生成二维码...');

      /*
        二维码路由
        /verification?name=张三&gender=男&birthDate=1998-05-15&enrollmentDate=2016-09-01&graduationDate=2020-06-30&school=北京大学&major=计算机科学与技术&duration=4 年&level=本科&educationType=普通高等教育&studyType=全日制&graduationStatus=毕业&certificateNumber=123456789&principalName=李四&verificationCode=ABC123XYZ&updateDate=2024-01-15&photo=/backend/assets/demo.jpg
      */
      
      // 构建查询参数对象
      const t = '' // 如果没写就传空值
      const queryParams = {
        name: name || t,
        gender: gender || t,
        birthDate: birthDate || t,
        enrollmentDate: enrollmentDate || t,
        graduationDate: graduationDate || t,
        school: school || t,
        major: major || t,
        duration: duration || t,
        level: degreeLevel || t,
        educationType: educationType || t,
        studyType: studyType || t,
        graduationStatus: graduationStatus || t,
        certificateNumber: certificateNumber || t,
        principalName: principalName || t,
        verificationCode: 'K5K4DUHTN44J8927', // 在线验证码，目前先写死
        updateDate: currentDate,
        photo: uploadedPhotoUrl || '/demo.jpg' // 使用 MinIO 存储的照片 URL，如果上传失败则使用默认值
      };

      // 构建查询字符串并对所有值进行编码
      const queryString = Object.keys(queryParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');

      // 二维码配置 - 根据环境变量动态选择模式
      const qrCodeMode = process.env.PDF_QR_CODE_MODE || 'maintenance';
      
      let qrCodeConfig;
      if (qrCodeMode === 'available') {
        // 生成完整URL
        const fullUrl = `${process.env.VERIFICATION_BASE_URL}/verification-education?${queryString}`;
        
        // 使用短码替代完整URL（有效期从环境变量QR_CODE_EXPIRES_IN_DAYS读取，默认3天）
        try {
          const shortCode = await qrManager.saveUrlWithShortCode(fullUrl, 'education');
          
          // 生成短码URL（更简洁）
          const shortUrl = `${process.env.VERIFICATION_BASE_URL}/qr/${shortCode}`;
          
          qrCodeConfig = {
            content: shortUrl, // 使用短码URL，大幅减少二维码密度
            x: 76.5,                           // 二维码 X 坐标
            y: 126,                            // 二维码 Y 坐标
            size: 69.5,                          // 二维码大小 (宽高) - 增大尺寸提升清晰度
            quality: 'M'                       // 容错级别：L(7%), M(15%), Q(25%), H(30%) - 使用M级平衡清晰度和可靠性
          };
          
          logger.info(`📱 [学历 PDF] 使用 available 模式生成验证二维码（短码优化）`, {
            mode: qrCodeMode,
            shortCode: shortCode,
            shortUrl: shortUrl,
            originalLength: fullUrl.length,
            optimizedLength: shortUrl.length,
            reduction: `${((1 - shortUrl.length / fullUrl.length) * 100).toFixed(1)}%`,
            position: { x: qrCodeConfig.x, y: qrCodeConfig.y },
            size: qrCodeConfig.size,
            errorCorrectionLevel: qrCodeConfig.quality
          });
        } catch (shortCodeError) {
          logger.error(`❌ 生成短码失败，回退到完整URL: ${shortCodeError.message}`);
          // 如果短码生成失败，回退到原始方式
          qrCodeConfig = {
            content: fullUrl,
            x: 76.5,
            y: 126,
            size: 69.5,
            quality: 'L'
          };
        }
      } else {
        // maintenance 模式：显示维护信息
        qrCodeConfig = {
          content: "403 Forbidden 模拟服务器正在维护中，请稍后再试", // 临时屏蔽二维码功能
          x: 76.5,                           // 二维码 X 坐标
          y: 126,                            // 二维码 Y 坐标
          size: 69.5,                        // 二维码大小 (宽高)
          quality: 'H'                       // 容错级别：L(7%), M(15%), Q(25%), H(30%)
        };
        logger.info(`📱 [学历 PDF] 使用 maintenance 模式生成维护提示二维码`, {
          mode: qrCodeMode,
          content: qrCodeConfig.content,
          position: { x: qrCodeConfig.x, y: qrCodeConfig.y },
          size: qrCodeConfig.size,
          errorCorrectionLevel: qrCodeConfig.quality
        });
      }
      
      // 使用更高的分辨率生成二维码（12 倍于目标尺寸，提升清晰度）
      const highResolution = qrCodeConfig.size * 12;
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeConfig.content, {
        width: highResolution,  // 提高分辨率
        margin: 1,              // 添加边距提升视觉效果
        errorCorrectionLevel: qrCodeConfig.quality,
        quality: 0.9,           // 高质量 (0-1.0)
        scale: 4,               // 缩放倍数提升图像质量
        type: 'image/png'
      });

      // 将数据 URL 转换为 Buffer
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      const qrCodeImage = await pdfDoc.embedPng(qrCodeBuffer);

      // 绘制二维码到 PDF
      page.drawImage(qrCodeImage, {
        x: qrCodeConfig.x,
        y: qrCodeConfig.y,
        width: qrCodeConfig.size,
        height: qrCodeConfig.size
      });
      logger.info(`✅ [学历 PDF] 二维码已添加到 PDF`, {
        mode: qrCodeMode,
        position: { x: qrCodeConfig.x, y: qrCodeConfig.y },
        size: `${qrCodeConfig.size}x${qrCodeConfig.size}`,
        resolution: highResolution
      });
    } catch (qrError) {
      logger.error(`❌ [学历 PDF] 生成或添加二维码时出错`, {
        error: qrError.message,
        stack: qrError.stack,
        mode: qrCodeMode
      });
    }

    // 保存 PDF
    logger.info('💾 [学历 PDF] 正在保存 PDF 文档...');
    const pdfBytes = await pdfDoc.save();
    logger.info(`✅ 学历在线验证报告 PDF 文档保存完成，大小：${pdfBytes.length} 字节`);

    // 生成文件名
    const fileName = `中国高等教育学历在线验证报告_${name}_${Date.now()}.pdf`;
    
    // 保存 PDF 到 MinIO（优先）和本地目录（备份）
    let downloadUrl = null;
    try {
      // 首先尝试上传到 MinIO
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      // 所有报告统一存放在 reports/ 目录下，与 photos/ 目录区分
      const minioFileName = `reports/${fileName.replace(/\.pdf$/, '')}_${timestamp}_${randomString}.pdf`;
      
      logger.info(`📁 准备上传 PDF 到 MinIO: ${minioFileName}`);
      
      // 检查 bucket 是否存在，不存在则创建
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
      if (!bucketExists) {
        logger.info(`🪣 Bucket 不存在，正在创建：${BUCKET_NAME}`);
        await minioClient.makeBucket(BUCKET_NAME);
        logger.info(`✅ Bucket 创建成功：${BUCKET_NAME}`);
      }
      
      // 上传 PDF 到 MinIO
      await minioClient.putObject(BUCKET_NAME, minioFileName, Buffer.from(pdfBytes), {
        'Content-Type': 'application/pdf',
        'x-amz-acl': 'public-read'
      });
      
      // 构建下载 URL
      downloadUrl = `http://${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${minioFileName}`;
      logger.info(`✅ PDF 已上传到 MinIO，下载 URL: ${downloadUrl}`);
    } catch (minioError) {
      logger.error(`❌ 上传 PDF 到 MinIO 失败：${minioError.message}，将保存到本地目录`);
    }
    
    // 同时保存到本地目录作为备份
    try {
      const reportDir = path.join(__dirname, '../report_records');
      
      // 检查目录是否存在，不存在则创建
      try {
        await fs.access(reportDir);
        logger.info(`✅ report_records 目录已存在`);
      } catch (dirError) {
        logger.info(`📁 report_records 目录不存在，正在创建...`);
        await fs.mkdir(reportDir, { recursive: true });
        logger.info(`✅ report_records 目录创建成功`);
      }
      
      const filePath = path.join(reportDir, fileName);
      await fs.writeFile(filePath, pdfBytes);
      logger.info(`✅ 学历在线验证报告 PDF 文件已在后端保存：${filePath}`);
    } catch (saveError) {
      logger.error(`❌ 保存学历在线验证报告 PDF 到后端目录失败：${saveError.message}`);
    }

    // 返回 JSON 响应，包含下载 URL（如果 MinIO 上传成功）或 PDF 数据
    if (downloadUrl) {
      // 如果 MinIO 上传成功，返回下载链接
      logger.info(`✅ 返回 MinIO 下载链接`);
      res.json({
        success: true,
        downloadUrl: downloadUrl,
        fileName: fileName,
        message: 'PDF 生成成功'
      });
    } else {
      // 如果 MinIO 上传失败，回退到传统方式发送 PDF
      logger.info(`⚠️ MinIO 上传失败，回退到直接发送 PDF 数据`);
      res.setHeader('Content-Type', 'application/pdf');
      const encodedFileName = encodeURIComponent(fileName);
      res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(Buffer.from(pdfBytes));
    }
    
    logger.info('==========✅ 学历在线验证报告 PDF 处理完成==========');
  } catch (error) {
    logger.error(`❌ 学位在线验证报告 PDF 生成错误：${error.message}`);
    res.status(500).json({
      success: false,
      error: 'PDF 生成失败：' + error.message
    });
  }
};

module.exports = generateEducationPdf;