
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createExpireStorage } from "@/utils/HelperForCheckandSave";

export enum GenerationStatus {
  PREPROCESSING = 'preprocessing',  // status 1: preprocessing
  GENERATING = 'generating',        // status 2: generating
  COMPLETED = 'completed'           // status 3: completed
}


interface GenerationTask {
  id: string;                       // generationId
  status: GenerationStatus;         // task status
  createdAt: number;               // create time
  expiresAt: number;               // expires time
  prompt?: string;                 // user prompt (truncated display)
  model?: string;                  // generation model
  type?: 'image' | 'text' | 'audio' | 'video'; // generation type
  predictionId?: string;           // API prediction ID (status 2时设置)
  userId?: string;                 // user ID
  [key: string]: any;             // extended fields
}


interface GenerationItem {
  id: string;
  type: 'image' | 'text' | 'audio' | 'video';
  content: any;
  createdAt: number;
  expiresAt: number;
  [key: string]: any;
}


const TASK_LIMITS: Record<string, number> = {

  'default': 10
};

// expiration time for different status (milliseconds)
const EXPIRATION_TIMES = {
  [GenerationStatus.PREPROCESSING]: 1 * 60 * 1000,      // 1 minute
  [GenerationStatus.GENERATING]: 8 * 60 * 1000,        // 8 minutes
  [GenerationStatus.COMPLETED]: 0                        // after completion, immediately clear
};

interface GenerationStore {
  // concurrent generation task management
  activeTasks: GenerationTask[];

  // history generation record (keep original functionality)
  recentGenerations: GenerationItem[];

  // temporary generation record (not persisted, only valid during session)
  tmpRecentGenerations: GenerationItem[];
  setTmpRecentGenerations: (newItems: GenerationItem[], isTemporary?: boolean) => void;
  addToTmpRecentGenerations: (items: GenerationItem[], isTemporary?: boolean) => void;
  clearTmpRecentGenerations: () => void;


  // concurrent generation management method
  startGeneration: (taskData: Partial<GenerationTask>) => string | null;
  updateGenerationStatus: (generationId: string, status: GenerationStatus, additionalData?: Partial<GenerationTask>) => void;
  completeGeneration: (generationId: string) => void;
  clearExpiredTasks: () => void;
  getActiveTasksCount: () => number;
  canStartNewGeneration: (subscriptionLevel?: string) => boolean;
  getMaxConcurrentTasks: (subscriptionLevel?: string) => number;

  // history record management method (keep original functionality)
  setRecentGenerations: (newItems: GenerationItem[], isTemporary?: boolean) => void;
  clearExpiredItems: () => void;
}

// TTL setting: expiration time for generation task storage 20days 
const GENERATION_TASKS_TTL = 20 * 24 * 60 * 60 * 1000;

export const createGenerationStore = create<GenerationStore>()(

  persist(
    (set, get) => ({
      activeTasks: [],
      recentGenerations: [],
      tmpRecentGenerations: [],

      // start new generation task
      startGeneration: (taskData: Partial<GenerationTask>) => {
        const state = get();

        // clear expired tasks
        state.clearExpiredTasks();

        // check if can start new task
        if (!state.canStartNewGeneration(taskData.userSubscriptionLevel)) {
          return null; // 超出并发限制
        }

        // create new task
        const generationId = `gen_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        const now = Date.now();

        const newTask: GenerationTask = {
          id: generationId,
          status: GenerationStatus.PREPROCESSING,
          createdAt: now,
          expiresAt: now + EXPIRATION_TIMES[GenerationStatus.PREPROCESSING],
          prompt: taskData.prompt?.substring(0, 50) + (taskData.prompt && taskData.prompt.length > 50 ? '...' : ''),
          model: taskData.model,
          type: taskData.type || 'image',
          userId: taskData.userId,
          ...taskData
        };

        set((state) => ({
          activeTasks: [...state.activeTasks, newTask]
        }));

        return generationId;
      },

      // update generation task status
      updateGenerationStatus: (generationId: string, status: GenerationStatus, additionalData?: Partial<GenerationTask>) => {
        set((state) => ({
          activeTasks: state.activeTasks.map(task => {
            if (task.id === generationId) {
              const now = Date.now();
              return {
                ...task,
                status,
                expiresAt: status === GenerationStatus.COMPLETED
                  ? now // 完成状态立即过期，等待清理
                  : now + EXPIRATION_TIMES[status],
                ...additionalData
              };
            }
            return task;
          })
        }));
      },

      // complete generation task
      completeGeneration: (generationId: string) => {
        set((state) => ({
          activeTasks: state.activeTasks.filter(task => task.id !== generationId)
        }));
      },

      // clear expired tasks
      clearExpiredTasks: () => {
        const currentTime = Date.now();
        set((state) => ({
          activeTasks: state.activeTasks.filter(task => task.expiresAt > currentTime)
        }));
      },

      // get current active tasks count
      getActiveTasksCount: () => {
        const state = get();
        state.clearExpiredTasks();
        return state.activeTasks.length;
      },

      // check if can start new generation task
      canStartNewGeneration: (subscriptionLevel?: string) => {
        const state = get();
        const maxConcurrent = state.getMaxConcurrentTasks(subscriptionLevel);
        const activeCount = state.getActiveTasksCount();
        return activeCount < maxConcurrent;
      },

      // get maximum concurrent tasks
      getMaxConcurrentTasks: (subscriptionLevel?: string) => {
        // console.log('subscriptionLevel', subscriptionLevel);
        const level = subscriptionLevel?.toLowerCase().trim() || 'default';
        return TASK_LIMITS[level] || TASK_LIMITS.default;
      },

      // === keep original history record functionality ===
      setRecentGenerations: (newItems, isTemporary = true) => {
        const expirationTime = isTemporary
          ? Date.now() + 15 * 60 * 1000        // 15 minutes for temporary URLs
          : Date.now() + 15 * 24 * 60 * 60 * 1000;  // 15 days for permanent content

        const itemsWithMetadata = newItems.map(item => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          type: item.type || 'image',
          createdAt: Date.now(),
          expiresAt: expirationTime
        }));

        set((state) => ({
          recentGenerations: [...itemsWithMetadata, ...state.recentGenerations],
        }));
      },

      clearExpiredItems: () => {
        const currentTime = Date.now();
        set((state) => ({
          recentGenerations: state.recentGenerations.filter(item =>
            item.expiresAt > currentTime
          )
        }));
        set((state) => ({
          tmpRecentGenerations: state.tmpRecentGenerations.filter(item =>
            item.expiresAt > currentTime
          )
        }));
      },

      // === temporary generation record management method (not persisted) ===
      setTmpRecentGenerations: (newItems: GenerationItem[]) => {
        const itemsWithMetadata = newItems.map(item => ({
          ...item,
          id: item?.id || crypto.randomUUID(),
          type: item?.type || 'image',
          createdAt: Date.now(),
          expiresAt: Date.now() + 15 * 60 * 1000 // 15分钟临时过期时间
        }));

        set((state) => ({
          tmpRecentGenerations: itemsWithMetadata
        }));
      },

      addToTmpRecentGenerations: (items: GenerationItem[]) => {
        const itemsWithMetadata = items.map(item => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          type: item.type || 'image',
          createdAt: Date.now(),
          expiresAt: Date.now() + 15 * 60 * 1000 // 15分钟临时过期时间
        }));

        set((state) => ({
          tmpRecentGenerations: [...itemsWithMetadata, ...state.tmpRecentGenerations]
        }));
      },

      clearTmpRecentGenerations: () => {
        set(() => ({
          tmpRecentGenerations: []
        }));
      },
    }),
    {
      name: 'recent_generations', // 独立的存储名称   generation_tasks_store old name is recent_generations
      storage: createJSONStorage(() => createExpireStorage(localStorage, GENERATION_TASKS_TTL)),
      // storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeTasks: state.activeTasks,
        recentGenerations: state.recentGenerations
      }),
      onRehydrateStorage: () => (state) => {
        // clear expired tasks and history records when page loads
        setTimeout(() => {
          if (state) {
            state.clearExpiredTasks();
            state.clearExpiredItems();
          }
        }, 0);
        return state;
      }
    }
  )
); 