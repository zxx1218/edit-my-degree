const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');
const logger = require('../logger');
const minio = require('minio');

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
    const photoUrl = `http://${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${fileName}`;
    
    logger.info(`✅ 照片上传成功到 MinIO: ${fileName}`);
    logger.info(`🔗 照片访问 URL: ${photoUrl}`);
    
    return photoUrl;
  } catch (error) {
    logger.error(`❌ 上传照片到 MinIO 失败：${error.message}`);
    throw error;
  }
};

const generateStudentStatusPdf = async (req, res) => {
  try {
    logger.info('==========🚀 开始生成学籍在线验证报告 PDF...==========');
    // 从请求中获取数据
    const {
      name,
      gender,
      birthDate,
      nationality,
      school,
      degreeLevel,
      major,
      duration,
      educationType,
      studyType,
      branch,
      department,
      enrollmentDate,
      status,
      graduationDate,
      degreePhoto
    } = req.body;

    logger.info(`📝 接收到的数据：${JSON.stringify({
      name,
      gender,
      birthDate,
      nationality,
      school,
      degreeLevel,
      major,
      duration,
      educationType,
      studyType,
      branch,
      department,
      enrollmentDate,
      status,
      graduationDate,
      degreePhoto: degreePhoto ? '毕业照片数据已接收' : '无毕业照片数据'
    })}`);

    // 验证必要字段
    if (!name || !gender || !birthDate || !nationality || !school || 
        !degreeLevel || !major || !duration || !educationType ||
        !studyType || !enrollmentDate || 
        !status || !graduationDate) {
      logger.warn('⚠️ 缺少必要字段，无法生成PDF');
      return res.status(400).json({
        success: false,
        error: '缺少必要字段'
      });
    }

    // 模板路径
    const templatePath = path.join(__dirname, '../../assets', 'xueji_tmp.pdf');
    logger.info(`📁 PDF 模板路径：${templatePath}`);
    
    // 检查模板文件是否存在
    try {
      await fs.access(templatePath);
      logger.info('✅ PDF模板文件存在');
    } catch (error) {
      logger.error('❌ PDF模板文件不存在:', error.message);
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
      logger.info('🔍 尝试加载自定义中文字体...');
      const defaultFontPath = path.join(__dirname, '../../fonts', 'msyh.ttf');
      const sourceHanFontPath = path.join(__dirname, '../../fonts', 'SourceHanSansK-Regular.TTF');
      
      logger.info(`字体路径：defaultFontPath=${defaultFontPath}, sourceHanFontPath=${sourceHanFontPath}`);
      
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
      { content: currentDate, x: 285, y: 746, fontSize: 10, color: rgb(0.588, 0.588, 0.588), font: sourceHanFont, specialFont: true },
      { content: name, x: 179, y: 709, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: gender, x: 179, y: 680, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: birthDate, x: 179, y: 651.5, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: nationality, x: 179, y: 624, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: school, x: 179, y: 596.5, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: degreeLevel, x: 179, y: 569, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: major, x: 179, y: 541.5, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: duration, x: 179, y: 513, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: educationType, x: 179, y: 485, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: studyType, x: 179, y: 457, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: branch, x: 179, y: 431, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: department, x: 179, y: 403.5, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: enrollmentDate, x: 179, y: 373, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: status, x: 179, y: 345, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont },
      { content: graduationDate, x: 179, y: 317, fontSize: 11, color: rgb(0, 0, 0), font: defaultFont }
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

    // 添加毕业照片到 PDF（如果提供了照片）
    let uploadedPhotoUrl = null;
    if (degreePhoto) {
      try {
        logger.info('🔄 开始处理毕业照片...');
        
        // 上传照片到 MinIO
        try {
          uploadedPhotoUrl = await uploadPhotoToMinIO(degreePhoto, name);
          logger.info(`✅ 照片已上传到 MinIO: ${uploadedPhotoUrl}`);
        } catch (uploadError) {
          logger.error(`❌ 上传照片到 MinIO 失败，但继续生成 PDF: ${uploadError.message}`);
          // 上传失败不中断流程，继续使用本地处理
        }
        
        // 从 Base64 字符串中提取图片数据
        const base64Data = degreePhoto.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // 确定图片类型并嵌入到 PDF 中
        let photoImage;
        if (degreePhoto.startsWith('data:image/jpeg') || degreePhoto.startsWith('data:image/jpg')) {
          logger.info('📷 检测到 JPG 或者 JPEG 格式照片');
          photoImage = await pdfDoc.embedJpg(imageBuffer);
        } else if (degreePhoto.startsWith('data:image/png')) {
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
        logger.info(`✅ 已添加毕业证件照（位置：x=${x}, y=${y}，尺寸：${photoWidth}x${photoHeight}，无边框）`);
      } catch (photoError) {
        logger.error(`❌ 处理毕业照片时出错：${photoError.message || photoError}`);
        // 继续执行而不中断整个过程
      }
    } else {
      logger.info('📷 未提供毕业照片，跳过照片添加步骤');
    }

    // 生成并添加二维码
    try {
      logger.info('🔄 开始生成二维码...');

      /*
          样例 url - 学籍
          /verification-studentStatus?name=张三&gender=男&birthDate=1998 年 01 月 15 日&nationality=汉族&school=北京大学&degreeLevel=本科&major=计算机科学与技术&duration=四年&educationType=普通高等教育&studyType=普通全日制&branch=信息科学技术学院&department=计算机系&enrollmentDate=2016 年 09 月 01 日&status=注册学籍&graduationDate=2020 年 06 月 30 日&verificationCode=ABCD1234567890&updateDate=2024 年 11 月 27 日&photo=/backend/assets/demo.jpg
      */
      
      // 构建查询参数对象
      const t = '' // 如果没写就传空
      const queryParams = {
        name: name || t,
        gender: gender || t,
        birthDate: birthDate || t,
        nationality: nationality || t,
        school: school || t,
        degreeLevel: degreeLevel || t,
        major: major || t,
        duration: duration || t,
        educationType: educationType || t,
        studyType: studyType || t,
        branch: branch || t,
        department: department || t,
        enrollmentDate: enrollmentDate || t,
        status: status || t,
        graduationDate: graduationDate || t,
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
        // 生成正常验证二维码
        qrCodeConfig = {
          content: `${process.env.VERIFICATION_BASE_URL}/verification-studentStatus?${queryString}`, // 二维码内容
          x: 76.5,                           // 二维码 X 坐标
          y: 126,                            // 二维码 Y 坐标
          size: 68.5,                        // 二维码大小 (宽高)
          quality: 'L'                       // 容错级别：L(7%), M(15%), Q(25%), H(30%)
        };
        logger.info(`📱 [学籍 PDF] 使用 available 模式生成验证二维码`, {
          mode: qrCodeMode,
          verificationUrl: process.env.VERIFICATION_BASE_URL,
          position: { x: qrCodeConfig.x, y: qrCodeConfig.y },
          size: qrCodeConfig.size,
          errorCorrectionLevel: qrCodeConfig.quality
        });
      } else {
        // maintenance 模式：显示维护信息
        qrCodeConfig = {
          content: "403 Forbidden 模拟服务器正在维护中，请稍后再试", // 临时屏蔽二维码功能
          x: 76.5,                           // 二维码 X 坐标
          y: 126,                            // 二维码 Y 坐标
          size: 68.5,                        // 二维码大小 (宽高)
          quality: 'H'                       // 容错级别：L(7%), M(15%), Q(25%), H(30%)
        };
        logger.info(`📱 [学籍 PDF] 使用 maintenance 模式生成维护提示二维码`, {
          mode: qrCodeMode,
          content: qrCodeConfig.content,
          position: { x: qrCodeConfig.x, y: qrCodeConfig.y },
          size: qrCodeConfig.size,
          errorCorrectionLevel: qrCodeConfig.quality
        });
      }
      
      // 使用更高的分辨率生成二维码（10 倍于目标尺寸）
      const highResolution = qrCodeConfig.size * 10;
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeConfig.content, {
        width: highResolution,  // 提高分辨率
        margin: 0,
        errorCorrectionLevel: qrCodeConfig.quality,
        quality: 1,  // 质量 0-1.0
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
      logger.info(`✅ [学籍 PDF] 二维码已添加到 PDF`, {
        mode: qrCodeMode,
        position: { x: qrCodeConfig.x, y: qrCodeConfig.y },
        size: `${qrCodeConfig.size}x${qrCodeConfig.size}`,
        resolution: highResolution
      });
    } catch (qrError) {
      logger.error(`❌ [学籍 PDF] 生成或添加二维码时出错`, {
        error: qrError.message,
        stack: qrError.stack,
        mode: qrCodeMode
      });
    }

    // 保存 PDF
    logger.info('💾 [学籍 PDF] 正在保存 PDF 文档...');
    const pdfBytes = await pdfDoc.save();
    logger.info(`✅ 学籍在线验证报告 PDF 文档保存完成，大小：${pdfBytes.length} 字节`);

    // 生成文件名
    const fileName = `教育部学籍在线验证报告_${name}_${Date.now()}.pdf`;
    
    // 保存 PDF 到后端目录
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
      logger.info(`✅ 学籍在线验证报告 PDF 文件已在后端保存：${filePath}`);
    } catch (saveError) {
      logger.error(`❌ 保存学籍在线验证报告 PDF 到后端目录失败：${saveError.message}`);
      // 不中断流程，仍然发送给前端
    }

    // 设置响应头以触发浏览器下载
    res.setHeader('Content-Type', 'application/pdf');
    // 对文件名进行编码以避免特殊字符导致的错误
    const encodedFileName = encodeURIComponent(fileName);
    // 修复文件名显示问题，同时兼容不同浏览器
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
    // 添加额外的头部确保浏览器将响应视为附件而非内联内容
    res.setHeader('X-Content-Type-Options', 'nosniff');
    logger.info(`✅ 设置响应头完成，文件名：${fileName}`);

    // 发送 PDF 数据
    res.send(Buffer.from(pdfBytes));
    logger.info('✅ 学籍在线验证报告 PDF 文件发送成功');
  } catch (error) {
    logger.error(`❌ 学籍在线验证报告 PDF 生成错误：${error.message}`);
    res.status(500).json({
      success: false,
      error: '学籍在线验证报告 PDF 生成失败：' + error.message
    });
  }
};

module.exports = generateStudentStatusPdf;