'use client'
// servers/HelperForCheckandSave.ts

export function setCookie(name: string, value: string, hours: number): void {
  let expires = "";
  if (hours) {
    const date = new Date();
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (encodeURIComponent(value) || "") + expires + "; path=/";
}
export function setCookieForToday(name: string, value: string): void {
  const date = new Date();
  // 设置日期为当天午夜
  date.setHours(23, 59, 59, 999);
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (encodeURIComponent(value) || "") + expires + "; path=/";
}
export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}
export function deleteCookie(name: string): void {
  document.cookie = name + '=; Max-Age=-99999999;';
}
export const setLocalStorageWithExpiry = (key: string, value: any, hours: number): void => {
  const now = new Date();

  // 将小时数转换为毫秒数
  const ttl = hours * 60 * 60 * 1000;

  // 包装存储的数据和过期时间
  const item = {
    value: value,
    expiry: Date.now() + ttl
  };
  localStorage.setItem(key, JSON.stringify(item));
};

export const getLocalStorageWithExpiry = (key: string): any | null => {
  const itemStr = localStorage.getItem(key);

  // 如果localStorage中没有这个键，返回null
  if (!itemStr) {
    return null;
  }

  const item = JSON.parse(itemStr);
  const now = new Date();
  console.debug("Date.now:", Date.now())
  // 检查是否过期
  if (Date.now() > parseInt(item.expiry, 10)) {
    // 如果过期了，删除localStorage中的数据，并返回null
    localStorage.removeItem(key);
    return null;
  }

  return item.value;
};

// src/utils/expireStorage.ts
export const createExpireStorage = (baseStorage: Storage, ttl: number) => {
  // SSR support: If baseStorage is not available, return a mock storage.
  if (typeof window === 'undefined' || !baseStorage) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }
  }
  return {
    getItem: (name: string) => {
      const str = baseStorage.getItem(name)
      if (!str) return null

      try {
        const { value, timestamp } = JSON.parse(str) as {
          value: string
          timestamp: number
        }
        // 如果超过 TTL，就删掉缓存并返回 null
        if (Date.now() - timestamp > ttl) {
          baseStorage.removeItem(name)
          return null
        }
        return value
      } catch {
        baseStorage.removeItem(name)
        return null
      }
    },
    setItem: (name: string, value: string) => {
      const payload = JSON.stringify({
        value,
        timestamp: Date.now(),
      })
      
      baseStorage.setItem(name, payload)
    },
    removeItem: (name: string) => {
      baseStorage.removeItem(name)
    },
  }
}


export const computeFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};