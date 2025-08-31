'use client'
import imageCompression from 'browser-image-compression';
import type { PlacedImage } from "@/types/canvas";
import { AiAppRef } from '@/components/application/ai-multi-generator-canva';

interface ProcessCanvasImageOptions {
  // 压缩选项
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: 'image/jpeg' | 'image/png' | 'image/webp';
  // 是否启用压缩
  enableCompression?: boolean;
}

interface ProcessedImageResult {
  file: File;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  processedWidth: number;
  processedHeight: number;
}

/**
 * 处理画布中选中的图片，将其转换为File对象并可选地进行压缩
 * @param images 所有图片数组
 * @param selectedIds 选中的图片ID数组
 * @param options 处理选项
 * @returns 处理后的图片结果数组
 */
export async function processSelectedCanvasImages(
  images: PlacedImage[],
  selectedIds: string[],
  options: ProcessCanvasImageOptions = {}
): Promise<ProcessedImageResult[]> {
  const {
    maxSizeMB = 2,
    maxWidthOrHeight = 1024,
    useWebWorker = true,
    fileType = 'image/jpeg',
    enableCompression = true
  } = options;

  // 筛选选中的图片
  const selectedImages = images.filter((img) => selectedIds.includes(img.id));
  
  if (selectedImages.length === 0) {
    return [];
  }

  const results: ProcessedImageResult[] = [];

  for (const img of selectedImages) {
    try {
      // 获取裁剪参数
      const cropX = img.cropX || 0;
      const cropY = img.cropY || 0;
      const cropWidth = img.cropWidth || 1;
      const cropHeight = img.cropHeight || 1;

      // 加载图片
      const imgElement = new window.Image();
      imgElement.crossOrigin = "anonymous"; // Enable CORS
      imgElement.src = img.src;
      
      await new Promise((resolve, reject) => {
        imgElement.onload = resolve;
        imgElement.onerror = reject;
      });

      // 创建画布用于图片处理
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // 计算考虑裁剪后的有效原始尺寸
      let effectiveWidth = imgElement.naturalWidth;
      let effectiveHeight = imgElement.naturalHeight;

      if (cropWidth !== 1 || cropHeight !== 1) {
        effectiveWidth = cropWidth * imgElement.naturalWidth;
        effectiveHeight = cropHeight * imgElement.naturalHeight;
      }

      // 设置画布尺寸为原始分辨率（非显示尺寸）
      canvas.width = effectiveWidth;
      canvas.height = effectiveHeight;

      // 使用裁剪参数绘制图片（如果未设置则默认为完整图片）
      ctx.drawImage(
        imgElement,
        cropX * imgElement.naturalWidth,
        cropY * imgElement.naturalHeight,
        cropWidth * imgElement.naturalWidth,
        cropHeight * imgElement.naturalHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      // 转换为 blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        }, fileType);
      });

      // 创建 File 对象
      let file = new File([blob], `processed-image-${img.id}.${fileType.split('/')[1]}`, {
        type: fileType
      });

      // 可选压缩
      if (enableCompression) {
        const compressionOptions = {
          maxSizeMB,
          maxWidthOrHeight,
          useWebWorker,
          fileType: fileType as any
        };
        file = await imageCompression(file, compressionOptions);
      }

      // 生成 dataUrl
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error("Failed to read file as data URL"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      results.push({
        file,
        dataUrl,
        originalWidth: imgElement.naturalWidth,
        originalHeight: imgElement.naturalHeight,
        processedWidth: canvas.width,
        processedHeight: canvas.height
      });

    } catch (error) {
      console.error(`Error processing image ${img.id}:`, error);
      // 继续处理下一个图片，不中断整个流程
      throw error; // 或者可以选择收集错误而不是抛出
    }
  }

  return results;
}


export const sendImageToAiApp = async (
  selectedImages: PlacedImage[], 
  aiImageRef: React.RefObject<AiAppRef | null>
) => {
  if (!aiImageRef || !aiImageRef.current) {
    console.warn('No AI image ref found');
    return;
  }

  if (selectedImages.length === 0) {
    console.warn('No images selected for AI processing');
    return;
  }
  // console.log('selectedImages', selectedImages)
  // max images to send to ai app
  const maxImages = 2;
  const limitedImages = selectedImages.slice(0, maxImages);
  const limitedImageIds = limitedImages.map(img => img.id);

  try {
      const results = await processSelectedCanvasImages(selectedImages, limitedImageIds, {
        enableCompression: false,
      });

    // send processed images to ai app
    const fileResults = results.map(result => result.file);
    aiImageRef.current?.setValue('control_images', fileResults);
    
    console.log(`Successfully sent ${fileResults.length} images to AI app`);
  } catch (error) {
    console.error('Error processing images for AI app:', error);
  }
}