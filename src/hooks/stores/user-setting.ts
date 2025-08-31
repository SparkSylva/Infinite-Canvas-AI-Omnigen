import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Simple serializable value types
type JSONPrimitive = string | number | boolean | null;
type JSONValue = JSONPrimitive | JSONValue[] | { [k: string]: JSONValue };

// Temporary item (with TTL)
interface TempItem {
  key: string;
  value: JSONValue;
  createdAt: number;
  expiresAt: number;
  category?: string;
  description?: string;
}

// Persistent item (without TTL)
interface PersistItem {
  key: string;
  value: JSONValue;
  createdAt: number;
  updatedAt: number;
  category?: string;
  description?: string;
}

type SetOpts = {
  persistent?: boolean; // Default false (writes to temporarySettings)
  ttl?: number;         // Only effective for temporarySettings
  category?: string;
  description?: string;
};

interface Store {
  // In-memory: not persisted
  temporarySettings: TempItem[];
  // Local: only this field is persisted
  persistentSettings: Record<string, PersistItem>;

  // Write
  setSetting: (key: string, value: JSONValue, opts?: SetOpts) => void;
  setMultiple: (
    items: Array<{ key: string; value: JSONValue } & Omit<SetOpts, "ttl">> & { ttl?: number }[]
  ) => void; // Default writes to temporary; pass persistent:true for persistent; (each item in batch can be specified independently)

  // Read (temporary has priority, fallback to persistent if not expired)
  getSetting: (key: string) => JSONValue | undefined;
  hasSetting: (key: string) => boolean;

  // Read by category
  getAll: (category?: string) => Array<TempItem | PersistItem>;

  // Delete
  removeSetting: (key: string, opts?: { persistent?: boolean }) => void; // If not passed, delete from both
  clear: (opts?: { persistent?: boolean; category?: string }) => void;   // If not passed, clear both

  // Only effective for temporary items
  clearExpired: () => void;
}

const DEFAULT_TTL = 2 * 60 * 60 * 1000; // 2h
// const DEFAULT_TTL = 1 * 1 * 10 * 1000; //test 10 second
export const useUserSettingStore = create<Store>()(
  persist(
    (set, get) => ({
      temporarySettings: [],
      persistentSettings: {},

      setSetting: (key, value, opts) => {
        const { persistent = false, ttl = DEFAULT_TTL, category, description } = opts ?? {};
        const now = Date.now();

        if (persistent) {
          set((state) => ({
            persistentSettings: {
              ...state.persistentSettings,
              [key]: {
                key,
                value,
                category,
                description,
                createdAt: state.persistentSettings[key]?.createdAt ?? now,
                updatedAt: now,
              },
            },
          }));
          return;
        }

        // Temporary
        const expiresAt = now + ttl;
        set((state) => {
          const idx = state.temporarySettings.findIndex((it) => it.key === key);
          if (idx >= 0) {
            const arr = [...state.temporarySettings];
            arr[idx] = { ...arr[idx], value, category, description, expiresAt };
            return { temporarySettings: arr };
          }
          return {
            temporarySettings: [
              ...state.temporarySettings,
              { key, value, category, description, createdAt: now, expiresAt },
            ],
          };
        });
      },

      setMultiple: (items) => {
        const now = Date.now();
        set((state) => {
          let temp = [...state.temporarySettings];
          const per = { ...state.persistentSettings };

          for (const it of items) {
            const { key, value, persistent = false, ttl = DEFAULT_TTL, category, description } = it as any;

            if (persistent) {
              per[key] = {
                key,
                value,
                category,
                description,
                createdAt: per[key]?.createdAt ?? now,
                updatedAt: now,
              };
            } else {
              const expiresAt = now + ttl;
              const idx = temp.findIndex((t) => t.key === key);
              if (idx >= 0) {
                temp[idx] = { ...temp[idx], value, category, description, expiresAt };
              } else {
                temp.push({ key, value, category, description, createdAt: now, expiresAt });
              }
            }
          }

          return { temporarySettings: temp, persistentSettings: per };
        });
      },

      getSetting: (key) => {
        const { temporarySettings, persistentSettings } = get();
        const now = Date.now();
        const t = temporarySettings.find((it) => it.key === key);
        if (t && t.expiresAt > now) return t.value;
        return persistentSettings[key]?.value;
      },

      hasSetting: (key) => {
        const { temporarySettings, persistentSettings } = get();
        const now = Date.now();
        if (temporarySettings.some((it) => it.key === key && it.expiresAt > now)) return true;
        return Boolean(persistentSettings[key]);
      },

      getAll: (category) => {
        const { temporarySettings, persistentSettings } = get();
        const now = Date.now();
        const tmp = temporarySettings.filter((it) => it.expiresAt > now && (!category || it.category === category));
        const per = Object.values(persistentSettings).filter((it) => !category || it.category === category);
        return [...tmp, ...per];
      },

      removeSetting: (key, opts) => {
        const target = opts?.persistent;
        set((state) => {
          const next: Partial<Store> = {};
          if (target === undefined || !target) {
            next.temporarySettings = state.temporarySettings.filter((it) => it.key !== key);
          }
          if (target === undefined || target) {
            const { [key]: _, ...rest } = state.persistentSettings;
            next.persistentSettings = rest;
          }
          return next as Store;
        });
      },

      clear: (opts) => {
        const { persistent, category } = opts ?? {};
        set((state) => {
          const out: Partial<Store> = {};

          const keepByCat = <T extends { category?: string }>(arr: T[]) =>
            category ? arr.filter((it) => it.category !== category) : [];

          if (persistent === undefined || !persistent) {
            out.temporarySettings = keepByCat(state.temporarySettings);
          }
          if (persistent === undefined || persistent) {
            if (category) {
              out.persistentSettings = Object.fromEntries(
                Object.entries(state.persistentSettings).filter(([, v]) => v.category !== category)
              );
            } else {
              out.persistentSettings = {};
            }
          }
          return out as Store;
        });
      },

      clearExpired: () => {
        const now = Date.now();
        set((state) => ({
          temporarySettings: state.temporarySettings.filter((it) => it.expiresAt > now),
        }));
      },
    }),
    {
      name: "user-settings-local",
      storage: createJSONStorage(() => localStorage),
      // Only persist persistentSettings
      partialize: (state) => ({ persistentSettings: state.persistentSettings }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, clean up expired temporary items once (although temporary items are not persisted, this line maintains consistency)
        state?.clearExpired?.();
      },
    }
  )
);
// hook
export function useSettingValue<T = any>(key: string) {
  return useUserSettingStore((state) => {
    const now = Date.now();
    const t = state.temporarySettings.find(
      (it) => it.key === key && it.expiresAt > now
    );
    return (t ? t.value : state.persistentSettings[key]?.value) as T | undefined;
  });
}

// const S = useUserSettingStore.getState();

// // 1) Default: write to temporary (2h)
// S.setSetting("session_token", "abc");

// // 2) Write to persistent
// S.setSetting("api_key", "sk-xxx", { persistent: true });

// // 3) Read (temporary first, fallback to persistent)
// const token = S.getSetting("api_key");

// // 4) Delete (only persistent)
// S.removeSetting("api_key", { persistent: true });

// // 5) Batch (mixed)
// S.setMultiple([
//   { key: "theme", value: "dark", persistent: true },
//   { key: "lang", value: "en" }, // temporary
// ]);