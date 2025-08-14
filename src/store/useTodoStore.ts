import { create } from 'zustand';
import { ImprovementTask } from '@/types';
import { FirestoreService } from '@/lib/firestore';
import { STORAGE_KEYS, localStorage, generateId } from '@/lib/localStorageUtils';

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
}

function deserializeTasks(raw: any[]): ImprovementTask[] {
  return (raw || []).map((t) => ({
    ...t,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    dueAt: t.dueAt ?? undefined,
    completedAt: t.completedAt ?? undefined,
  }));
}

export const useTodoStore = create<TodoState>((set, get) => ({
  isExpanded: localStorage.getItem(STORAGE_KEYS.TODO_DRAWER_EXPANDED, false),
  tasks: deserializeTasks(localStorage.getItem(STORAGE_KEYS.TODO_TASKS, [] as ImprovementTask[])),
  categories: [],
  railWidth: 60,

  initialize: async () => {
    try {
      const tasks = await taskService.getAll();
      // Keep most recent first
      const normalized = tasks
        .map((t) => ({
          ...t,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      // Extract known categories for filtering UI
      const categories = Array.from(new Set(normalized.map(t => t.category).filter(Boolean) as string[])).sort();
      set({ tasks: normalized, categories });
      localStorage.setItem(STORAGE_KEYS.TODO_TASKS, normalized);
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
      priority: 'med',
      tags: [],
      accountId: (extras.accountId as string) || 'default',
      dueAt: extras.dueAt,
      sourceReflectionId: extras.sourceReflectionId,
      completedAt: undefined,
    };
    try {
      const created = await taskService.create(base as any);
      set((state) => {
        const withOrder: ImprovementTask = { ...created, order: (state.tasks[0]?.order ?? 0) + 1 } as ImprovementTask;
        const next = [withOrder, ...state.tasks];
        localStorage.setItem(STORAGE_KEYS.TODO_TASKS, next);
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
      };
      set((state) => {
        const withOrder: ImprovementTask = { ...local, order: (state.tasks[0]?.order ?? 0) + 1 };
        const next = [withOrder, ...state.tasks];
        localStorage.setItem(STORAGE_KEYS.TODO_TASKS, next);
        return { tasks: next };
      });
      return local;
    }
  },

  updateTask: async (id, updates) => {
    // Optimistic local update first
    set((state) => {
      const next = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem(STORAGE_KEYS.TODO_TASKS, next);
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
      localStorage.setItem(STORAGE_KEYS.TODO_TASKS, next);
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
      localStorage.setItem(STORAGE_KEYS.TODO_TASKS, next);
      return { tasks: next };
    });
    try {
      await taskService.update(id, updates as any);
    } catch (err) {
      console.error('Failed to toggle task remotely (kept local change):', err);
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
    localStorage.setItem(STORAGE_KEYS.TODO_TASKS, next);
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
}));


