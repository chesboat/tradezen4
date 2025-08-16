import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS, localStorage as ls } from '@/lib/localStorageUtils';
import { getAccountIdsForSelection } from '@/store/useAccountFilterStore';

export type DashboardTileId =
  | 'dailyFocus'
  | 'guardrails'
  | 'miniKpis'
  | 'recentTrades'
  | 'pinnedQuests'
  | 'gptInsights'
  | 'patternRadar'
  | 'reflectionProgress'
  | 'xpLevel';

export interface DashboardTileConfig {
  id: DashboardTileId;
  visible: boolean;
}

interface DashboardTilesState {
  layoutByAccount: Record<string, DashboardTileConfig[]>;
  getLayout: (accountSelection: string | null) => DashboardTileConfig[];
  setLayout: (accountSelection: string | null, layout: DashboardTileConfig[]) => void;
  toggleTile: (accountSelection: string | null, id: DashboardTileId) => void;
  resetLayout: (accountSelection: string | null) => void;
}

const DEFAULT_LAYOUT: DashboardTileConfig[] = [
  { id: 'dailyFocus', visible: true },
  { id: 'guardrails', visible: true },
  { id: 'miniKpis', visible: true },
  { id: 'recentTrades', visible: true },
  { id: 'pinnedQuests', visible: true },
  { id: 'gptInsights', visible: true },
  { id: 'patternRadar', visible: true },
  { id: 'reflectionProgress', visible: true },
  { id: 'xpLevel', visible: true },
];

export const useDashboardTilesStore = create<DashboardTilesState>()(
  persist(
    (set, get) => ({
      layoutByAccount: {},
      getLayout: (accountSelection) => {
        const key = accountSelection || 'all';
        const layout = get().layoutByAccount[key] || DEFAULT_LAYOUT;
        return layout;
      },
      setLayout: (accountSelection, layout) => {
        const key = accountSelection || 'all';
        set((state) => ({
          layoutByAccount: { ...state.layoutByAccount, [key]: layout },
        }));
      },
      toggleTile: (accountSelection, id) => {
        const key = accountSelection || 'all';
        const current = get().layoutByAccount[key] || DEFAULT_LAYOUT;
        const next = current.map((t) => (t.id === id ? { ...t, visible: !t.visible } : t));
        set((state) => ({ layoutByAccount: { ...state.layoutByAccount, [key]: next } }));
      },
      resetLayout: (accountSelection) => {
        const key = accountSelection || 'all';
        set((state) => ({ layoutByAccount: { ...state.layoutByAccount, [key]: DEFAULT_LAYOUT } }));
      },
    }),
    {
      name: STORAGE_KEYS.DASHBOARD_TILES,
      partialize: (state) => ({ layoutByAccount: state.layoutByAccount }),
    }
  )
);


