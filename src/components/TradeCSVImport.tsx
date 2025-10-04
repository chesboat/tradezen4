import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useTradeStore } from '@/store/useTradeStore';
import { Trade } from '@/types';
import { cn } from '@/lib/utils';

interface TradeCSVImportProps {
  isOpen: boolean;
  onClose: () => void;
}

type CsvRow = Record<string, string>;

type ParsedTrade = {
  symbol: string;
  direction: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  entryTime?: Date;
  exitTime?: Date;
  pnl?: number;
};

const parseCSV = (text: string): CsvRow[] => {
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
  if (lines.length === 0) return [];
  const first = lines[0].replace(/^\uFEFF/, '');
  // Auto-detect delimiter: comma, semicolon, or tab
  const comma = (first.match(/,/g) || []).length;
  const semi = (first.match(/;/g) || []).length;
  const tabs = (first.match(/\t/g) || []).length;
  const delim = tabs >= comma && tabs >= semi ? '\t' : (semi > comma ? ';' : ',');
  const splitLine = (line: string): string[] => {
    const cells = [] as string[];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (line.startsWith(delim, i) && !inQuotes) {
        cells.push(cur); cur = '';
        i += delim.length - 1;
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells;
  };
  const headers = splitLine(first).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cells = splitLine(line);
    const row: CsvRow = {};
    headers.forEach((h, idx) => row[h] = (cells[idx] || '').trim());
    return row;
  });
};

const toNum = (v?: string) => v != null && v !== '' ? Number(String(v).replace(/[^\d.\-]/g, '')) : undefined;
const toDate = (v?: string) => {
  if (!v || !v.trim()) return undefined;
  const s = v.trim();
  // Try ISO/Date.parse first
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  // Try numeric (Excel-like) serials
  // TradingView sometimes exports as 2.77603E+11 which is seconds since epoch without separators
  const num = Number(String(s).replace(/[^\d.\-eE+]/g, ''));
  if (Number.isFinite(num)) {
    // Heuristic: if it's < 10^12 treat as seconds, else milliseconds
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d;
  }
  return undefined;
};

// Futures point value map (USD per 1.00 price change per contract)
const POINT_VALUE_BY_ROOT: Record<string, number> = {
  MYM: 0.5,    // Micro E-mini Dow
  MES: 5,      // Micro E-mini S&P 500
  MNQ: 2,      // Micro E-mini Nasdaq-100
  M2K: 5,      // Micro E-mini Russell 2000
  MGC: 10,     // Micro Gold (per 1.0)
};

const getPointValue = (symbol?: string): number => {
  if (!symbol) return 1;
  const sym = symbol.toUpperCase();
  // Try longest matching known root prefix
  const root = Object.keys(POINT_VALUE_BY_ROOT).find(r => sym.startsWith(r));
  return root ? POINT_VALUE_BY_ROOT[root] : 1;
};

// Broker per-contract per-side fees (commission + exchange + routing) presets
const FEE_PER_SIDE_BY_ROOT: Record<string, number> = {
  MYM: 0.52,
  MES: 0.82,
  MNQ: 0.82,
  M2K: 0.82,
  MGC: 1.10,
};
const getDefaultFeePerFill = (symbol?: string): number => {
  if (!symbol) return 0;
  const sym = symbol.toUpperCase();
  const root = Object.keys(FEE_PER_SIDE_BY_ROOT).find(r => sym.startsWith(r));
  return root ? FEE_PER_SIDE_BY_ROOT[root] : 0;
};

// Map TradingView Orders export to parsed trades by pairing entry with stop loss / take profit
const mapTradingViewCsv = (rows: CsvRow[]): ParsedTrade[] => {
  const norm = (s?: string) => String(s || '').toLowerCase();
  const get = (row: CsvRow, keys: string[]) => {
    const lowerMap: Record<string, string> = {};
    Object.keys(row).forEach(k => lowerMap[k.toLowerCase().trim()] = row[k]);
    for (const k of keys) {
      const v = lowerMap[k.toLowerCase()];
      if (v !== undefined) return v;
    }
    return undefined as unknown as string;
  };
  const withFields = rows.map(r => ({
    symbol: get(r, ['symbol']),
    side: get(r, ['side']),
    type: get(r, ['type']),
    qty: toNum(get(r, ['qty','quantity'])) || 1,
    limitPrice: toNum(get(r, ['limit price','limit'])),
    stopPrice: toNum(get(r, ['stop price','stop'])),
    takeProfit: toNum(get(r, ['take profit','tp'])),
    stopLoss: toNum(get(r, ['stop loss','sl'])),
    avgFillPrice: toNum(get(r, ['avg fill price','average fill price','avg price','price'])),
    updateTime: toDate(get(r, ['update time','time','timestamp'])) || undefined,
    status: get(r, ['status'])
  }))
  // Exclude cancelled rows if status is provided
  .filter(o => !/cancel/.test(norm(o.status)))
  .sort((a, b) => (a.updateTime?.getTime() || 0) - (b.updateTime?.getTime() || 0));

  type OpenPos = { symbol: string; direction: 'long'|'short'; price: number; quantity: number; time?: Date };
  const open: OpenPos[] = [];
  const result: ParsedTrade[] = [];

  const priceOf = (o: any): number | undefined => o.avgFillPrice ?? o.limitPrice ?? o.stopPrice ?? o.takeProfit ?? o.stopLoss;
  const typeOf = (t?: string) => {
    const x = norm(t);
    if (/(stop\s*loss|stop-loss|sl)/.test(x)) return 'stop loss';
    if (/(take\s*profit|take-profit|tp)/.test(x)) return 'take profit';
    if (/market/.test(x)) return 'market';
    if (/limit/.test(x)) return 'limit';
    if (/stop/.test(x)) return 'stop';
    return x;
  };

  for (const o of withFields) {
    const t = typeOf(o.type);
    const side = norm(o.side);
    const price = priceOf(o);
    if (!o.symbol || !o.qty || !price) continue;
    const pointValue = getPointValue(o.symbol);
    const isEntry = t === 'market' || t === 'limit' || t === 'stop';
    const isExit = t === 'stop loss' || t === 'take profit';

    if (isEntry) {
      const direction: 'long'|'short' = side === 'buy' ? 'long' : 'short';
      open.push({ symbol: o.symbol, direction, price, quantity: o.qty, time: o.updateTime });
      continue;
    }
    if (isExit) {
      // TradingView Orders CSV may list exit rows (TP/SL) with the original entry side (e.g., 'Buy' for a long),
      // which doesn't reflect the actual closing action. Infer the closing direction from current open positions
      // for the symbol; fall back to the side heuristic only if ambiguous.
      const hasLongOpen = open.some(p => p.symbol === o.symbol && p.direction === 'long' && p.quantity > 0);
      const hasShortOpen = open.some(p => p.symbol === o.symbol && p.direction === 'short' && p.quantity > 0);
      const inferredDir: 'long'|'short' | null = hasLongOpen && !hasShortOpen ? 'long'
        : (!hasLongOpen && hasShortOpen ? 'short' : null);
      const closingDirection: 'long'|'short' = inferredDir ?? (side === 'sell' ? 'long' : 'short');
      let idx = open.findIndex(p => p.symbol === o.symbol && p.direction === closingDirection && p.quantity > 0);
      if (idx === -1) continue;
      let remaining = o.qty;
      while (remaining > 0 && idx !== -1) {
        const pos = open[idx];
        const takeQty = Math.min(remaining, pos.quantity);
        const entryPrice = pos.price;
        const exitPrice = price;
        const points = closingDirection === 'long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
        const pnl = points * pointValue * takeQty;
        result.push({
          symbol: o.symbol,
          direction: closingDirection,
          quantity: takeQty,
          entryPrice,
          exitPrice,
          entryTime: pos.time,
          exitTime: o.updateTime,
          pnl,
        });
        pos.quantity -= takeQty;
        remaining -= takeQty;
        if (pos.quantity <= 0) open.splice(idx, 1);
        idx = open.findIndex(p => p.symbol === o.symbol && p.direction === closingDirection && p.quantity > 0);
      }
    }
  }
  return result;
};

// Map generic filled-rows CSV where each row contains both legs, e.g.:
// symbol, qty, buyPrice, sellPrice, pnl, boughtTimestamp, soldTimestamp
const mapFilledRowsCsv = (rows: CsvRow[]): ParsedTrade[] => {
  const get = (row: CsvRow, keys: string[]) => {
    const lowerMap: Record<string, string> = {};
    Object.keys(row).forEach(k => lowerMap[k.toLowerCase().trim()] = row[k]);
    for (const k of keys) {
      const v = lowerMap[k.toLowerCase()];
      if (v !== undefined) return v;
    }
    return undefined as unknown as string;
  };
  const hasRequired = (r: CsvRow) => {
    const qty = get(r, ['qty','quantity']);
    const buy = get(r, ['buyprice','buy price','entry','entryprice']);
    const sell = get(r, ['sellprice','sell price','exit','exitprice']);
    return !!(qty && buy && sell);
  };
  const candidates = rows.filter(hasRequired);
  if (candidates.length === 0) return [];

  const parsed: ParsedTrade[] = [];
  for (const r of candidates) {
    const symbol = get(r, ['symbol','ticker','instrument']);
    const qty = toNum(get(r, ['qty','quantity'])) || 1;
    const buyPrice = toNum(get(r, ['buyprice','buy price','entry','entryprice']));
    const sellPrice = toNum(get(r, ['sellprice','sell price','exit','exitprice']));
    const buyTs = toDate(get(r, ['boughttimestamp','buy time','bought time','entrytime','entry time']));
    const sellTs = toDate(get(r, ['soldtimestamp','sell time','sold time','exittime','exit time']));
    const providedPnl = toNum(get(r, ['pnl','p&l','profit','profitloss']));
    if (!symbol || !qty || buyPrice == null || sellPrice == null) continue;

    const pointValue = getPointValue(symbol);
    // Determine direction by which leg happened first, otherwise by provided PnL sign
    let direction: 'long' | 'short' = 'long';
    if (buyTs && sellTs) {
      direction = (buyTs <= sellTs) ? 'long' : 'short';
    } else if (typeof providedPnl === 'number' && isFinite(providedPnl)) {
      direction = providedPnl >= 0 ? (sellPrice >= buyPrice ? 'long' : 'short') : (sellPrice >= buyPrice ? 'short' : 'long');
    } else {
      direction = sellPrice >= buyPrice ? 'long' : 'short';
    }

    const computedPnl = direction === 'long'
      ? (sellPrice - buyPrice) * pointValue * qty
      : (buyPrice - sellPrice) * pointValue * qty;
    const pnl = (typeof providedPnl === 'number' && isFinite(providedPnl)) ? providedPnl : computedPnl;

    const entryPrice = direction === 'long' ? buyPrice : sellPrice;
    const exitPrice = direction === 'long' ? sellPrice : buyPrice;
    const entryTime = direction === 'long' ? (buyTs || undefined) : (sellTs || undefined);
    const exitTime = direction === 'long' ? (sellTs || undefined) : (buyTs || undefined);

    parsed.push({
      symbol,
      direction,
      quantity: qty,
      entryPrice,
      exitPrice,
      entryTime,
      exitTime,
      pnl,
    });
  }
  return parsed;
};

export const TradeCSVImport: React.FC<TradeCSVImportProps> = ({ isOpen, onClose }) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { addTrade } = useTradeStore();

  const [rows, setRows] = React.useState<ParsedTrade[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [feePerFill, setFeePerFill] = React.useState<number>(0);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const csv = parseCSV(text);
    if (csv.length === 0) { setError('Empty CSV or unrecognized format'); return; }
    // Try TradingView Orders mapping first; if no trades reconstructed, try generic filled-rows mapping
    let trades = mapTradingViewCsv(csv);
    if (trades.length === 0) {
      trades = mapFilledRowsCsv(csv);
    }
    setRows(trades);
    if (trades.length > 0) {
      setFeePerFill(getDefaultFeePerFill(trades[0].symbol));
    } else {
      // Provide actionable feedback when no trades could be reconstructed
      const norm = (s?: string) => String(s || '').toLowerCase();
      const filled = csv.filter(r => !/cancel/.test(norm(r['Status'] || r['status'] || '')));
      const byType = filled.reduce((acc, r) => {
        const t = norm(r['Type'] || r['type'] || '');
        acc[t] = (acc[t] || 0) as number + 1 as any;
        return acc;
      }, {} as Record<string, number>);
      setError(`Parsed ${csv.length} rows, ${filled.length} non-cancelled, but found no complete trades. Supported formats: TradingView Orders export, or generic rows with buyPrice/sellPrice/boughtTimestamp/soldTimestamp. Types seen: ${Object.keys(byType).join(', ') || 'none'}.`);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const importTrades = async () => {
    if (!selectedAccountId) { setError('Select an account first.'); return; }
    if (rows.length === 0) return;
    setIsImporting(true);
    try {
      for (const r of rows) {
        const totalFees = 2 * r.quantity * (Number.isFinite(feePerFill) ? feePerFill : 0);
        const finalPnl = (r.pnl || 0) - totalFees;
        const trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> = {
          symbol: r.symbol?.toUpperCase() || 'UNKNOWN',
          direction: r.direction,
          entryPrice: r.entryPrice,
          exitPrice: r.exitPrice,
          quantity: r.quantity,
          riskAmount: Math.max(Math.abs(finalPnl), 0),
          riskRewardRatio: 1,
          result: finalPnl > 0 ? 'win' : 'loss', // Simple binary: profit = win, no profit = loss
          pnl: finalPnl,
          entryTime: r.entryTime || new Date(),
          exitTime: r.exitTime,
          mood: 'neutral',
          tags: [],
          notes: undefined,
          accountId: selectedAccountId,
        };
        await addTrade(trade);
      }
      onClose();
    } catch (e) {
      setError('Import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-card border border-border rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-card-foreground">Import TradingView CSV</h3>
              <p className="text-xs text-muted-foreground">Export your orders from TradingView and drop the CSV here.</p>
            </div>

            <div className="p-4 space-y-3">
              <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                <li>TradingView → Orders tab</li>
                <li>Click ⋯ (more) → Export → CSV</li>
                <li>Drop the CSV below</li>
              </ol>

              <input type="file" accept=".csv,text/csv" onChange={onChange} />
              <div className="text-xs text-muted-foreground">
                Expected headers (case-insensitive): Symbol, Side, Type, Qty, Limit Price, Stop Price, Take Profit, Stop Loss, Avg Fill Price, Update Time
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="text-muted-foreground">Per-fill fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="px-2 py-1 bg-muted rounded border border-border w-24"
                  value={feePerFill}
                  onChange={(e) => setFeePerFill(parseFloat(e.target.value))}
                />
                <span className="text-muted-foreground">Applied as 2 × Qty × fee</span>
              </div>

              {error && (
                <div className="p-2 text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded">{error}</div>
              )}

              <div className="max-h-72 overflow-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="p-2 text-left">Symbol</th>
                      <th className="p-2 text-left">Side</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Entry</th>
                      <th className="p-2 text-right">Exit</th>
                      <th className="p-2 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t, idx) => {
                      const fee = 2 * t.quantity * (Number.isFinite(feePerFill) ? feePerFill : 0);
                      const pnl = (t.pnl ?? 0) - fee;
                      return (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2 font-medium">{t.symbol}</td>
                        <td className="p-2 capitalize">{t.direction}</td>
                        <td className="p-2 text-right">{t.quantity}</td>
                        <td className="p-2 text-right">{t.entryPrice}</td>
                        <td className="p-2 text-right">{t.exitPrice ?? '-'}</td>
                        <td className={cn('p-2 text-right', pnl >= 0 ? 'text-green-500' : 'text-red-500')}>{Number.isFinite(pnl) ? pnl.toFixed(2) : '-'}</td>
                      </tr>
                      );
                    })}
                    {rows.length === 0 && (
                      <tr>
                        <td className="p-3 text-center text-muted-foreground" colSpan={6}>No rows parsed yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80" onClick={onClose} disabled={isImporting}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  onClick={importTrades}
                  disabled={rows.length === 0 || isImporting}
                >
                  {isImporting ? 'Importing…' : `Import ${rows.length} trade${rows.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TradeCSVImport;


