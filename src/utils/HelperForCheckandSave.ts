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
  // Set the date to midnight of the current day
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

  // Convert hours to milliseconds
  const ttl = hours * 60 * 60 * 1000;

  // Wrap the stored data and expiration time
  const item = {
    value: value,
    expiry: Date.now() + ttl
  };
  localStorage.setItem(key, JSON.stringify(item));
};
 
export const getLocalStorageWithExpiry = (key: string): any | null => {
  const itemStr = localStorage.getItem(key);

  // If the key is not in localStorage, return null
  if (!itemStr) {
    return null;
  }

  const item = JSON.parse(itemStr);
  const now = new Date();
  console.debug("Date.now:", Date.now())
  // Check if it has expired
  if (Date.now() > parseInt(item.expiry, 10)) {
    // If it has expired, delete the data from localStorage and return null
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
        // If TTL is exceeded, delete the cache and return null
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