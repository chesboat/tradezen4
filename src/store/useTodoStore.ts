import { create } from 'zustand';
import { ImprovementTask } from '@/types';
import { FirestoreService } from '@/lib/firestore';
import { STORAGE_KEYS, localStorage, generateId } from '@/lib/localStorageUtils';
import { useActivityLogStore } from './useActivityLogStore';

const taskService = new FirestoreService<ImprovementTask>('tasks');

interface TodoState {
  isExpanded: boolean;
  tasks: ImprovementTask[];
  categories: string[];
  railWidth: number;

  initialize: () => Promise<void>;
  toggleDrawer: () => void;
  setExpanded: (expanded: boolean) => void;
  setRailWidth: (width: number) => void;

  addTask: (text: string, extras?: Partial<ImprovementTask>) => Promise<ImprovementTask>;
  updateTask: (id: string, updates: Partial<ImprovementTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleDone: (id: string) => Promise<void>;
  snoozeTask: (id: string, minutes: number) => Promise<void>;
  reorder: (orderedIds: string[]) => void;
  togglePin: (id: string) => Promise<void>;
  setCategory: (id: string, category?: string) => Promise<void>;
  scheduleTask: (id: string, scheduledFor?: Date) => Promise<void>;
}

// Coerce a Firestore Timestamp | Date | ISO string | number into ISO string
function normalizeDateLike(value: any | undefined): string | undefined {
  if (!value) return undefined;
  try {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return new Date(value).toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    if (value && typeof value.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date ? d.toISOString() : undefined;
    }
  } catch (_e) {
    return undefined;
  }
  return undefined;
}

function deserializeTasks(raw: any[]): ImprovementTask[] {
  // Handle corrupted localStorage data from previous bug
  if (!raw || !Array.isArray(raw)) {
    console.warn('Invalid tasks data in localStorage, clearing...', raw);
    return [];
  }
  
  return (raw || []).map((t) => ({
    ...t,
    createdAt: normalizeDateLike(t.createdAt) || t.createdAt,
    updatedAt: normalizeDateLike(t.updatedAt) || t.updatedAt,
    dueAt: normalizeDateLike(t.dueAt),
    scheduledFor: normalizeDateLike(t.scheduledFor),
    completedAt: normalizeDateLike(t.completedAt),
  }));
}

export const useTodoStore = create<TodoState>((set, get) => ({
  isExpanded: localStorage.getItem(STORAGE_KEYS.TODO_DRAWER_EXPANDED, false),
  tasks: deserializeTasks(localStorage.getItem(STORAGE_KEYS.TODO_TASKS, [] as ImprovementTask[])),
  categories: [],
  railWidth: 400,

  initialize: async () => {
    try {
      const tasks = await taskService.getAll();
      // Keep most recent first
      const normalized = tasks
        .map((t) => ({
          ...t,
          createdAt: normalizeDateLike(t.createdAt) || t.createdAt,
          updatedAt: normalizeDateLike(t.updatedAt) || t.updatedAt,
          dueAt: normalizeDateLike((t as any).dueAt),
          scheduledFor: normalizeDateLike((t as any).scheduledFor),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      // Extract known categories for filtering UI
      const categories = Array.from(new Set(normalized.map(t => t.category).filter(Boolean) as string[])).sort();
      const localExisting = deserializeTasks(localStorage.getItem(STORAGE_KEYS.TODO_TASKS, [] as ImprovementTask[]));

      // Guard: never overwrite existing local tasks with an empty remote fetch
      if (normalized.length === 0 && localExisting.length > 0) {
        set({ tasks: localExisting, categories });
        // Keep local copy as source of truth until remote has data
        return;
      }

      // Merge unique by id when both exist
      const byId = new Map<string, ImprovementTask>();
      [...localExisting, ...normalized].forEach((t) => byId.set(t.id, t));
      const merged = Array.from(byId.values()).sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      set({ tasks: merged, categories });
      localStorage.setItem(STORAGE_KEYS.TODO_TASKS, JSON.stringify(merged));
    } catch (err) {
      console.error('Failed to initialize tasks:', err);
    }
  },

  toggleDrawer: () => {
    set((state) => {
      const next = !state.isExpanded;
      localStorage.setItem(STORAGE_KEYS.TODO_DRAWER_EXPANDED, next as any);
      return { isExpanded: next };
    });
  },
  setExpanded: (expanded) => {
    set({ isExpanded: expanded });
    localStorage.setItem(STORAGE_KEYS.TODO_DRAWER_EXPANDED, expanded as any);
  },

  setRailWidth: (width: number) => {
    set({ railWidth: Math.max(60, Math.min(420, Math.floor(width))) });
  },

  addTask: async (text, extras = {}) => {
    const base: Omit<ImprovementTask, 'id' | 'createdAt' | 'updatedAt'> = {
      text: text.trim(),
      status: 'open',
      priority: extras.priority, // No default - only if explicitly set
      tags: extras.tags || [],
      category: extras.category,
      accountId: (extras.accountId as string) || undefined, // Optional: journal-wide by default
      dueAt: normalizeDateLike(extras.dueAt),
      sourceReflectionId: extras.sourceReflectionId,
      completedAt: undefined,
      url: extras.url,
      notes: extras.notes,
      order: extras.order,
      pinned: extras.pinned,
      scheduledFor: normalizeDateLike(extras.scheduledFor),
    };
    try {
      const created = await taskService.create(base as any);
      set((state) => {
        // Use the order from the created task if it exists, otherwise assign one
        const withOrder: ImprovementTask = { 
          ...created, 
          order: created.order ?? (state.tasks[state.tasks.length - 1]?.order ?? 0) + 1 
        } as ImprovementTask;
        const next = [...state.tasks, withOrder]; // Add to end (blank canvas)
        localStorage.setItem(STORAGE_KEYS.TODO_TASKS, JSON.stringify(next));
        return { tasks: next };
      });
      return created;
    } catch (err) {
      console.error('Failed to add task:', err);
      // Fallback local add
      const nowIso = new Date().toISOString();
      const local: ImprovementTask = {
        id: generateId(),
        text: base.text,
        status: 'open',
        priority: base.priority,
        tags: base.tags,
        dueAt: base.dueAt,
        sourceReflectionId: base.sourceReflectionId,
        createdAt: nowIso,
        updatedAt: nowIso,
        accountId: base.accountId,
        url: base.url,
      };
      set((state) => {
        const withOrder: ImprovementTask = { ...local, order: (state.tasks[0]?.order ?? 0) + 1 };
        const next = [withOrder, ...state.tasks];
        localStorage.setItem(STORAGE_KEYS.TODO_TASKS, JSON.stringify(next));
        return { tasks: next };
      });
      return local;
    }
  },

  updateTask: async (id, updates) => {
    // Optimistic local update first
    set((state) => {
      const next = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem(STORAGE_KEYS.TODO_TASKS, JSON.stringify(next));
      return { tasks: next };
    });
    // Fire-and-forget remote sync
    try {
      await taskService.update(id, updates as any);
    } catch (err) {
      console.error('Failed to update task remotely (kept local change):', err);
    }
  },

  deleteTask: async (id) => {
    try {
      await taskService.delete(id);
    } catch (err) {
      console.warn('Failed to delete remote task, removing locally:', err);
    }
    set((state) => {
      const next = state.tasks.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TODO_TASKS, JSON.stringify(next));
      return { tasks: next };
    });
  },

  toggleDone: async (id) => {
    const current = get().tasks.find((t) => t.id === id);
    if (!current) return;
    const isDone = current.status === 'done';
    const updates: Partial<ImprovementTask> = {
      status: isDone ? 'open' : 'done',
      completedAt: isDone ? undefined : new Date().toISOString(),
    };
    // Optimistic local toggle
    set((state) => {
      const next = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem(STORAGE_KEYS.TODO_TASKS, JSON.stringify(next));
      return { tasks: next };
    });
    try {
      await taskService.update(id, updates as any);
    } catch (err) {
      console.error('Failed to toggle task remotely (kept local change):', err);
    }

    // Award XP and log activity only when marking as done
    if (!isDone) {
      try {
        const { awardXp, XpRewards } = await import('@/lib/xp/XpService');
        await awardXp.todoComplete(id);
        const addActivity = useActivityLogStore.getState().addActivity;
        addActivity({
          type: 'todo',
          title: 'Task Completed',
          description: current.text,
          xpEarned: XpRewards.TODO_COMPLETE,
          relatedId: id,
          accountId: current.accountId,
        });
      } catch (e) {
        console.error('Failed to award XP for task completion:', e);
      }
    }
  },

  snoozeTask: async (id, minutes) => {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    await get().updateTask(id, { status: 'snoozed', dueAt: until });
  },

  reorder: (orderedIds) => {
    const idToTask = new Map(get().tasks.map((t) => [t.id, t] as const));
    const next = orderedIds.map((id, idx) => {
      const t = idToTask.get(id);
      return t ? { ...t, order: orderedIds.length - idx } : undefined;
    }).filter(Boolean) as ImprovementTask[];
    set({ tasks: next });
    localStorage.setItem(STORAGE_KEYS.TODO_TASKS, JSON.stringify(next));
    // Persist new order asynchronously
    orderedIds.forEach((id, idx) => {
      const order = orderedIds.length - idx;
      get().updateTask(id, { order });
    });
  },

  togglePin: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    const updates = { pinned: !task.pinned } as Partial<ImprovementTask>;
    await get().updateTask(id, updates);
  },

  setCategory: async (id, category) => {
    await get().updateTask(id, { category });
  },

  scheduleTask: async (id, scheduledFor) => {
    await get().updateTask(id, { scheduledFor: normalizeDateLike(scheduledFor) });
  },
}));

// Initialize with some sample colorful tasks if none exist
export const initializeSampleTasks = async () => {
  const store = useTodoStore.getState();
  
  if (store.tasks.length === 0) {
    const sampleTasks = [
      {
        text: 'Review and update risk management rules',
        priority: 'high' as const,
        category: 'risk',
        pinned: true,
      },
      {
        text: 'Analyze last week\'s losing trades for patterns',
        priority: 'med' as const,
        category: 'analysis',
      },
      {
        text: 'Update trading journal with screenshots',
        priority: 'low' as const,
        category: 'journal',
      },
      {
        text: 'Practice mindfulness before trading session',
        priority: 'med' as const,
        category: 'wellness',
      },
      {
        text: 'Set up alerts for key support/resistance levels',
        priority: 'high' as const,
        category: 'execution',
      },
    ];

    // Add each sample task
    for (const task of sampleTasks) {
      await store.addTask(task.text, task);
    }
  }
};


