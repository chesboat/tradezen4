import React from 'react';
import { Responsive, WidthProvider, type Layouts, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useAnalyticsTilesStore, type AnalyticsTileId } from '@/store/useAnalyticsTilesStore';
import { computeEdgeScore } from '@/lib/edgeScore';
import { Award, Info, Settings2 } from 'lucide-react';
import AnalyticsTilesModal from './AnalyticsTilesModal';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const ResponsiveGridLayout = WidthProvider(Responsive);

type Breakpoint = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

const BREAKPOINTS: Record<Breakpoint, number> = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
};

const COLS: Record<Breakpoint, number> = {
  lg: 12,
  md: 10,
  sm: 8,
  xs: 4,
  xxs: 2,
};

const ALL_TILE_IDS: AnalyticsTileId[] = [
  'totalPnl',
  'winRate',
  'profitFactor',
  'sharpeRatio',
  'maxDrawdown',
  'totalTrades',
  'edgeScore',
  'netDailyPnl',
  'topSymbols',
  'recentTrades',
  'riskAnalysis',
];

// Reasonable default layout (lg) – 6 rows tall by default for large tiles
const DEFAULT_LG_LAYOUT: Layout[] = [
  { i: 'totalPnl', x: 0, y: 0, w: 2, h: 3 },
  { i: 'winRate', x: 2, y: 0, w: 2, h: 3 },
  { i: 'profitFactor', x: 4, y: 0, w: 2, h: 3 },
  { i: 'sharpeRatio', x: 6, y: 0, w: 2, h: 3 },
  { i: 'maxDrawdown', x: 8, y: 0, w: 2, h: 3 },
  { i: 'totalTrades', x: 10, y: 0, w: 2, h: 3 },
  { i: 'edgeScore', x: 0, y: 3, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'netDailyPnl', x: 6, y: 3, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'topSymbols', x: 0, y: 11, w: 6, h: 6 },
  { i: 'recentTrades', x: 6, y: 11, w: 6, h: 8 },
  { i: 'riskAnalysis', x: 0, y: 19, w: 12, h: 5 },
];

const STORAGE_KEY_PREFIX = 'tz.layouts.v1.';

function getAccountKey(accountId: string | null): string {
  return accountId || 'all';
}

function loadLayouts(accountKey: string): Layouts | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + accountKey);
    return raw ? (JSON.parse(raw) as Layouts) : null;
  } catch {
    return null;
  }
}

function saveLayouts(accountKey: string, layouts: Layouts) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + accountKey, JSON.stringify(layouts));
  } catch {}
}

const SkeletonTile: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`h-full w-full rounded-xl border border-border bg-muted/20 ${className || ''}`}>
    <div className="h-full w-full animate-pulse">
      <div className="h-8 border-b border-border/60 px-4 flex items-center gap-2">
        <div className="h-4 w-24 bg-foreground/10 rounded" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/5 bg-foreground/10 rounded" />
        <div className="h-4 w-4/5 bg-foreground/10 rounded" />
        <div className="h-40 w-full bg-foreground/10 rounded" />
      </div>
    </div>
  </div>
);

const EdgeScoreRadarTile: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const filteredTrades = React.useMemo(() => {
    return trades.filter(t => !selectedAccountId || t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);
  const edge = React.useMemo(() => computeEdgeScore(filteredTrades), [filteredTrades]);

  const weakest = React.useMemo(() => {
    const entries: Array<{ key: keyof typeof edge.breakdown; label: string; value: number }> = [
      { key: 'winRate', label: 'Win %', value: edge.breakdown.winRate },
      { key: 'profitFactor', label: 'Profit Factor', value: edge.breakdown.profitFactor },
      { key: 'maxDrawdown', label: 'Max Drawdown', value: edge.breakdown.maxDrawdown },
      { key: 'avgWinLoss', label: 'Avg Win vs Loss', value: edge.breakdown.avgWinLoss },
      { key: 'consistency', label: 'Risk Consistency', value: edge.breakdown.consistency },
      { key: 'recoveryFactor', label: 'Recovery', value: edge.breakdown.recoveryFactor },
    ];
    return entries.reduce((min, cur) => (cur.value < min.value ? cur : min), entries[0]);
  }, [edge]);

  const data = [
    { metric: 'Win %', value: edge.breakdown.winRate },
    { metric: 'Profit Factor', value: edge.breakdown.profitFactor },
    { metric: 'Max Drawdown', value: edge.breakdown.maxDrawdown },
    { metric: 'Avg W/L', value: edge.breakdown.avgWinLoss },
    { metric: 'Risk Consistency', value: edge.breakdown.consistency },
    { metric: 'Recovery', value: edge.breakdown.recoveryFactor },
  ];

  const colorFor = (v: number) => (v >= 70 ? '#22c55e' : v >= 45 ? '#eab308' : '#ef4444');

  return (
    <div className="h-full w-full rounded-2xl border border-border bg-card">
      <div className="px-4 h-11 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Edge Score</span>
          <button className="p-1 rounded hover:bg-muted" title="What is this?">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="text-xs text-muted-foreground">Composite performance</div>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="80%">
              <PolarGrid gridType="polygon" stroke="currentColor" strokeOpacity={0.08} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.7 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Edge" dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.25} />
              <RechartsTooltip cursor={{ stroke: 'currentColor', strokeOpacity: 0.15 }} contentStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="md:col-span-2 flex flex-col items-center justify-center gap-4">
          <div className="text-5xl font-bold tracking-tight">{edge.score}</div>
          <div className="w-40 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${edge.score}%`, backgroundColor: colorFor(edge.score) }} />
          </div>
          <div className="w-full grid grid-cols-2 gap-2 text-xs">
            {data.map(d => (
              <div key={d.metric} className="flex items-center justify-between px-2 py-1 rounded bg-muted/40">
                <span className="text-muted-foreground">{d.metric}</span>
                <span className="font-medium" style={{ color: colorFor(d.value) }}>{d.value}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Weakest area: <span className="font-medium text-foreground">{weakest.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardGrid: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const accountKey = getAccountKey(selectedAccountId);
  const { getLayout } = useAnalyticsTilesStore();
  const visibility = getLayout(selectedAccountId);

  const [showSettings, setShowSettings] = React.useState(false);
  const [layouts, setLayouts] = React.useState<Layouts>(() => {
    const saved = loadLayouts(accountKey);
    if (saved) return saved;
    // Seed from lg default, copy to other breakpoints with simple scaling
    const lg = DEFAULT_LG_LAYOUT;
    const scale = (cols: number): Layout[] => lg.map(l => ({ ...l, w: Math.min(l.w, cols), x: Math.min(l.x, Math.max(0, cols - l.w)) }));
    return {
      lg,
      md: scale(COLS.md),
      sm: scale(COLS.sm),
      xs: scale(COLS.xs),
      xxs: scale(COLS.xxs),
    };
  });

  React.useEffect(() => {
    saveLayouts(accountKey, layouts);
  }, [accountKey, layouts]);

  // Filter tiles by visibility
  const visibleIds = React.useMemo(() => visibility.filter(t => t.visible).map(t => t.id), [visibility]);

  const onLayoutChange = (_current: Layout[], all: Layouts) => {
    setLayouts(all);
  };

  const renderTile = (id: AnalyticsTileId) => {
    switch (id) {
      case 'edgeScore':
        return <EdgeScoreRadarTile />;
      default:
        return <SkeletonTile />;
    }
  };

  // Ensure every visible id has a layout item
  const ensureLayoutItems = (ls: Layouts): Layouts => {
    const next: Layouts = { ...ls };
    (Object.keys(next) as Breakpoint[]).forEach(bp => {
      const items = new Set(next[bp]?.map(l => l.i) || []);
      const current = next[bp] || [];
      const missing = visibleIds.filter(id => !items.has(id));
      const appended = missing.map((id, idx) => ({ i: id, x: (idx * 2) % (COLS[bp] || 1), y: Infinity, w: 2, h: 3 }));
      next[bp] = [...current, ...appended];
    });
    return next;
  };

  const effectiveLayouts = React.useMemo(() => ensureLayoutItems(layouts), [layouts, visibleIds]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics Grid</h2>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm hover:bg-muted/80" onClick={() => setShowSettings(true)}>
          <Settings2 className="w-4 h-4" /> Customize
        </button>
      </div>
      <ResponsiveGridLayout
        className="layout"
        layouts={effectiveLayouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={24}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        isResizable
        isDraggable
        onLayoutChange={onLayoutChange}
        measureBeforeMount={false}
        useCSSTransforms
        compactType="vertical"
        preventCollision={false}
      >
        {ALL_TILE_IDS.filter(id => visibleIds.includes(id)).map((id) => (
          <div key={id} className="group">
            {renderTile(id)}
          </div>
        ))}
      </ResponsiveGridLayout>

      <AnalyticsTilesModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default DashboardGrid;


