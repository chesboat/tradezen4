import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/localStorageUtils';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';

export type AnalyticsTileId =
  | 'totalPnl'
  | 'winRate'
  | 'profitFactor'
  | 'sharpeRatio'
  | 'maxDrawdown'
  | 'totalTrades'
  | 'edgeScore'
  | 'netDailyPnl'
  | 'topSymbols'
  | 'recentTrades'
  | 'riskAnalysis'
  | 'avgWin'
  | 'avgLoss'
  | 'expectancy'
  | 'longestWinStreak'
  | 'longestLossStreak'
  | 'avgRR'
  | 'largestWin'
  | 'largestLoss'
  | 'longVsShort'
  | 'aiSummary';

export interface AnalyticsTileConfig { id: AnalyticsTileId; visible: boolean }

interface AnalyticsTilesState {
  layoutByAccount: Record<string, AnalyticsTileConfig[]>;
  getLayout: (accountSelection: string | null) => AnalyticsTileConfig[];
  setLayout: (accountSelection: string | null, layout: AnalyticsTileConfig[]) => void;
  toggleTile: (accountSelection: string | null, id: AnalyticsTileId) => void;
}

const DEFAULT_LAYOUT: AnalyticsTileConfig[] = [
  // Core metrics - always visible by default
  { id: 'totalPnl', visible: true },
  { id: 'winRate', visible: true },
  { id: 'profitFactor', visible: true },
  { id: 'sharpeRatio', visible: true },
  { id: 'maxDrawdown', visible: true },
  { id: 'totalTrades', visible: true },
  
  // Main analytics tiles
  { id: 'edgeScore', visible: true },
  { id: 'netDailyPnl', visible: true },
  { id: 'topSymbols', visible: true },
  { id: 'recentTrades', visible: true },
  { id: 'riskAnalysis', visible: true },
  
  // Additional stats - visible by default but can be hidden
  { id: 'avgWin', visible: true },
  { id: 'avgLoss', visible: true },
  { id: 'expectancy', visible: true },
  { id: 'longestWinStreak', visible: true },
  { id: 'longestLossStreak', visible: true },
  { id: 'avgRR', visible: true },
  
  // Advanced metrics - hidden by default to avoid clutter
  { id: 'largestWin', visible: false },
  { id: 'largestLoss', visible: false },
  { id: 'longVsShort', visible: false },
  { id: 'aiSummary', visible: false },
];

export const useAnalyticsTilesStore = create<AnalyticsTilesState>()(
  persist(
    (set, get) => ({
      layoutByAccount: {},
      getLayout: (accountSelection) => {
        const key = accountSelection || 'all';
        const existing = get().layoutByAccount[key] || [];
        const knownIds = new Set(DEFAULT_LAYOUT.map(t => t.id));
        const filtered = existing.filter(t => knownIds.has(t.id));
        const missing = DEFAULT_LAYOUT.filter(t => !filtered.some(x => x.id === t.id));
        const normalized = [...filtered, ...missing];
        return normalized.length > 0 ? normalized : DEFAULT_LAYOUT;
      },
      setLayout: (accountSelection, layout) => {
        const key = accountSelection || 'all';
        const knownIds = new Set(DEFAULT_LAYOUT.map(t => t.id));
        const filtered = layout.filter(t => knownIds.has(t.id));
        const missing = DEFAULT_LAYOUT.filter(t => !filtered.some(x => x.id === t.id));
        const normalized = [...filtered, ...missing];
        set((state) => ({ layoutByAccount: { ...state.layoutByAccount, [key]: normalized } }));
      },
      toggleTile: (accountSelection, id) => {
        const key = accountSelection || 'all';
        const current = get().getLayout(accountSelection);
        const next = current.map(t => t.id === id ? { ...t, visible: !t.visible } : t);
        set((state) => ({ layoutByAccount: { ...state.layoutByAccount, [key]: next } }));
      },
    }),
    { name: STORAGE_KEYS.ANALYTICS_TILES, partialize: (s) => ({ layoutByAccount: s.layoutByAccount }) }
  )
);


