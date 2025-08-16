import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/localStorageUtils';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';

export type AnalyticsTileId =
  | 'edgeScore'
  | 'netDailyPnl'
  | 'topSymbols'
  | 'recentTrades'
  | 'riskAnalysis';

export interface AnalyticsTileConfig { id: AnalyticsTileId; visible: boolean }

interface AnalyticsTilesState {
  layoutByAccount: Record<string, AnalyticsTileConfig[]>;
  getLayout: (accountSelection: string | null) => AnalyticsTileConfig[];
  setLayout: (accountSelection: string | null, layout: AnalyticsTileConfig[]) => void;
  toggleTile: (accountSelection: string | null, id: AnalyticsTileId) => void;
}

const DEFAULT_LAYOUT: AnalyticsTileConfig[] = [
  { id: 'edgeScore', visible: true },
  { id: 'netDailyPnl', visible: true },
  { id: 'topSymbols', visible: true },
  { id: 'recentTrades', visible: true },
  { id: 'riskAnalysis', visible: true },
];

export const useAnalyticsTilesStore = create<AnalyticsTilesState>()(
  persist(
    (set, get) => ({
      layoutByAccount: {},
      getLayout: (accountSelection) => {
        const key = accountSelection || 'all';
        return get().layoutByAccount[key] || DEFAULT_LAYOUT;
      },
      setLayout: (accountSelection, layout) => {
        const key = accountSelection || 'all';
        set((state) => ({ layoutByAccount: { ...state.layoutByAccount, [key]: layout } }));
      },
      toggleTile: (accountSelection, id) => {
        const key = accountSelection || 'all';
        const current = get().layoutByAccount[key] || DEFAULT_LAYOUT;
        const next = current.map(t => t.id === id ? { ...t, visible: !t.visible } : t);
        set((state) => ({ layoutByAccount: { ...state.layoutByAccount, [key]: next } }));
      },
    }),
    { name: STORAGE_KEYS.ANALYTICS_TILES, partialize: (s) => ({ layoutByAccount: s.layoutByAccount }) }
  )
);


