import { create } from 'zustand';

export type NudgeTone = 'positive' | 'neutral' | 'warning';

export interface Nudge {
  id: string;
  message: string;
  tone: NudgeTone;
}

interface NudgeState {
  nudge: Nudge | null;
  show: (message: string, tone?: NudgeTone) => void;
  dismiss: () => void;
}

const genId = () => Math.random().toString(36).slice(2);

export const useNudgeStore = create<NudgeState>((set) => ({
  nudge: null,
  show: (message, tone = 'positive') => set({ nudge: { id: genId(), message, tone } }),
  dismiss: () => set({ nudge: null }),
}));


