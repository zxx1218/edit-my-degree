import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 如果图片大小超过指定限制则压缩图片
 * @param file 输入的图片文件
 * @param maxFileSize 最大文件大小（字节），默认为2MB
 * @param quality 压缩质量，默认为0.8
 * @returns Promise，返回压缩后的base64数据URL
 */
export const compressImage = (file: File, maxFileSize: number = 2 * 1024 * 1024, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 记录原始文件大小
    console.log(`用户上传照片大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    // 如果文件小于最大限制，则直接使用原图
    if (file.size <= maxFileSize) {
      console.log(`照片大小未超过限制(${(maxFileSize / 1024 / 1024).toFixed(2)} MB)，无需压缩`);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    console.log(`照片大小超过限制(${(maxFileSize / 1024 / 1024).toFixed(2)} MB)，开始压缩`);
    
    // 文件太大，需要压缩
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('无法获取canvas上下文'));
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // 计算新的尺寸，保持宽高比
      let { width, height } = img;
      
      // 将图片缩放到1024x1024以内，同时保持宽高比
      const maxSize = 1024;
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 在canvas上绘制图片
      ctx.drawImage(img, 0, 0, width, height);
      
      // 使用初始质量开始压缩
      let compressedQuality = quality;
      let compressedDataUrl = canvas.toDataURL('image/jpeg', compressedQuality);
      
      // 重复降低质量直到文件大小在限制范围内
      const compressAndCheck = () => {
        if (compressedDataUrl.length < maxFileSize || compressedQuality < 0.2) {
          // 计算最终大小
          const finalSize = compressedDataUrl.length;
          const originalSize = file.size;
          const reduction = ((originalSize - finalSize) / originalSize) * 100;
          
          console.log(`照片压缩完成: 原始 ${(originalSize / 1024 / 1024).toFixed(2)} MB -> 压缩后 ${(finalSize / 1024 / 1024).toFixed(2)} MB，减少了 ${reduction.toFixed(2)}%`);
          
          // 清理对象URL
          URL.revokeObjectURL(img.src);
          resolve(compressedDataUrl);
          return;
        }
        
        // 降低质量并重试
        compressedQuality -= 0.1;
        compressedDataUrl = canvas.toDataURL('image/jpeg', compressedQuality);
        requestAnimationFrame(compressAndCheck);
      };
      
      compressAndCheck();
    };
    
    img.onerror = (error) => {
      reject(error);
    };
  });
};
