/**
 * Extract file extension from various input formats
 * @param input - Input string (blob URL, regular URL, base64 data URL)
 * @param fallbackMimeType - Optional MIME type for blob URLs when extension can't be determined
 * @returns File extension (without dot) or 'png' as fallback
 */
export async function extractFileExtension(input: string, fallbackMimeType?: string): Promise<string> {
  // Handle blob URLs (blob:...)
  if (input.startsWith('blob:')) {
      try {
          // Fetch the blob content to get its MIME type
          const response = await fetch(input);
          const blob = await response.blob();
          
          if (blob.type) {
              const mimeType = blob.type.toLowerCase();
              const mimeToExt: Record<string, string> = {
                  'image/jpeg': 'jpg',
                  'image/jpg': 'jpg', 
                  'image/png': 'png',
                  'image/gif': 'gif',
                  'image/webp': 'webp',
                  // 'image/svg+xml': 'svg',
                  // 'image/bmp': 'bmp',
                  // 'image/tiff': 'tiff',
                  // 'application/pdf': 'pdf',
                  'video/mp4': 'mp4',
                  // 'video/webm': 'webm',
                  'audio/mp3': 'mp3',
                  // 'audio/wav': 'wav'
              };
              return mimeToExt[mimeType] || 'png';
          }
      } catch (error) {
          console.warn('Failed to fetch blob URL:', error);
      }
      
      // Fallback to provided MIME type if fetch fails
      if (fallbackMimeType) {
          const mimeType = fallbackMimeType.toLowerCase();
          const mimeToExt: Record<string, string> = {
              'image/jpeg': 'jpg',
              'image/jpg': 'jpg', 
              'image/png': 'png',
              'image/gif': 'gif',
              'image/webp': 'webp',
              // 'image/svg+xml': 'svg',
              // 'image/bmp': 'bmp',
              // 'image/tiff': 'tiff',
              // 'application/pdf': 'pdf',
              'video/mp4': 'mp4',
              // 'video/webm': 'webm',
              'audio/mp3': 'mp3',
              // 'audio/wav': 'wav'
          };
          return mimeToExt[mimeType] || 'png';
      }
      return 'png'; // Default fallback for blob URLs
  }

  // Handle base64 data URLs (data:image/jpeg;base64,...)
  if (input.startsWith('data:')) {
      const mimeTypeMatch = input.match(/^data:([^;]+)/);
      if (mimeTypeMatch) {
          const mimeType = mimeTypeMatch[1].toLowerCase();
          // Convert MIME type to extension
          const mimeToExt: Record<string, string> = {
              'image/jpeg': 'jpg',
              'image/jpg': 'jpg', 
              'image/png': 'png',
              'image/gif': 'gif',
              'image/webp': 'webp',
              // 'image/svg+xml': 'svg',
              // 'image/bmp': 'bmp',
              // 'image/tiff': 'tiff',
              // 'application/pdf': 'pdf',
              'video/mp4': 'mp4',
              'video/webm': 'webm',
              'audio/mp3': 'mp3',
              'audio/wav': 'wav'
          };
          return mimeToExt[mimeType] || 'png';
      }
  }
  
 
  
  // Handle regular URLs with file extensions
  try {
      // Remove query parameters and hash fragments
      const cleanUrl = input.split('?')[0].split('#')[0];
      const urlPath = cleanUrl.includes('://') ? new URL(cleanUrl).pathname : cleanUrl;
      const fileExtension = urlPath.split('.').pop()?.toLowerCase() || '';
      
      // Validate that it's actually a file extension (not too long)
      if (fileExtension && fileExtension.length <= 10 && /^[a-z0-9]+$/.test(fileExtension)) {
          return fileExtension;
      }
  } catch (error) {
      // Fallback for invalid URLs
      const fileExtension = input.split('.').pop()?.toLowerCase() || '';
      if (fileExtension && fileExtension.length <= 10 && /^[a-z0-9]+$/.test(fileExtension)) {
          return fileExtension;
      }
  }
  
  // Default fallback
  return 'png';
}
export function objectKeyUserGen(user_id: string, prediction_id: string, generation_url: string): string {
  if (!generation_url) {
    return 'gen_error.webp';
  }

  const utcDate = new Date();
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth() + 1; // getUTCMonth() 返回 0-11
  const day = utcDate.getUTCDate();

  // Determine extension from data URL prefix or normal URL/filename suffix
  let ext = '';

  // Case 1: data URL like data:image/png;base64,....
  if (generation_url.startsWith('data:')) {
    const m = /^data:([^;]+)/i.exec(generation_url);
    const mime = (m?.[1] || '').toLowerCase();
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/ogg': 'ogv',
      'video/quicktime': 'mov',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'application/pdf': 'pdf'
    };
    ext = mimeToExt[mime] || '';
  } else {
    // Case 2: normal URL or filename
    try {
      const clean = generation_url.split('?')[0].split('#')[0];
      const path = clean.includes('://') ? new URL(clean).pathname : clean;
      const lastDot = path.lastIndexOf('.');
      if (lastDot >= 0 && lastDot < path.length - 1) {
        ext = path.substring(lastDot + 1).toLowerCase();
      }
    } catch {
      const clean = generation_url.split('?')[0].split('#')[0];
      const lastDot = clean.lastIndexOf('.');
      if (lastDot >= 0 && lastDot < clean.length - 1) {
        ext = clean.substring(lastDot + 1).toLowerCase();
      }
    }
  }

  // Sanitize: keep alphanumeric only
  if (ext) {
    ext = ext.replace(/[^a-z0-9]/g, '');
  }
  // Limit extension length to at most 10 characters
  if (ext && ext.length > 10) {
    ext = ext.substring(0, 10);
  }
  // Fallback
  if (!ext) {
    ext = 'png';
  }
  const extensionWithDot = `.${ext}`;

  let r2_object_key = '';
  // 生成 R2 对象键，并在末尾添加文件扩展名
  if (user_id)
    r2_object_key = `user_Gen/${user_id}/${prediction_id}${extensionWithDot}`;
  else
    r2_object_key = `tmp/${year}/${month}/${day}/${prediction_id}${extensionWithDot}`;

  return r2_object_key;
}


export function objectKeyPublicSave(path: string, fileExtension: string = ''): string {
  // Check if input is a valid string
  if (typeof path !== 'string' || path.trim() === '') {
    console.error('Invalid path provided. Path must be a non-empty string.');
    return '';
  }
  const modifiedPath = path.startsWith('/') ? path.substring(1) : path;
  // console.log('modifiedPath', modifiedPath)
  // Get the last part of the path (filename with extension)
  const lastSlashIndex = modifiedPath.lastIndexOf('/');
  const fileName = lastSlashIndex === -1 ? modifiedPath : modifiedPath.slice(lastSlashIndex + 1);
  
  // Control filename length to prevent excessively long object keys
  const maxFileNameLength =30;
  const truncatedFileName = fileName.length > maxFileNameLength 
    ? fileName.substring(0, maxFileNameLength) 
    : fileName;
  console.log('truncatedFileName', truncatedFileName)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const uuid_random = crypto.randomUUID();
  // Construct the final path with date-based directory structure`
  const objectKey = fileExtension ? `tmp/${year}/${month}/${day}/${uuid_random}-${truncatedFileName}.${fileExtension}` : `tmp/${year}/${month}/${day}/${uuid_random}-${truncatedFileName}`;
  return objectKey;
}


export const filterSensitiveInfo = (message: string): string => {
  // Filter out URLs using regex
  if (!message) return '';

  return message.replace(/https?:\/\/[^\s<>]*[^.,;'">\s<)}\]]/g, '');
};


export function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
export const computeFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};
export function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}



