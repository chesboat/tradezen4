import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { authenticatedFetch } from '@/lib/apiClient';
import { useTradeStore } from '@/store/useTradeStore';
import { Trade } from '@/types';
import { cn } from '@/lib/utils';

type ParsedTrade = {
  symbol: string;
  direction: 'long' | 'short';
  quantity?: number;
  entryTime?: string; // ISO string
  exitTime?: string;  // ISO string
  entryPrice?: number;
  exitPrice?: number;
  pnl?: number;
  fees?: number;
  commissions?: number;
};

// TradingView Orders table row (post-OCR extraction schema)
type TradingViewOrder = {
  symbol: string;
  side: 'Buy' | 'Sell';
  type: 'Market' | 'Limit' | 'Stop' | 'Stop Loss' | 'Take Profit' | string;
  qty?: number;
  limitPrice?: number;
  stopPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  avgFillPrice?: number;
  status?: 'Filled' | 'Cancelled' | 'Working' | string;
  updateTime?: string; // ISO or time-only
  orderId?: string | number;
};

interface TradeImageImportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TradeImageImport: React.FC<TradeImageImportProps> = ({ isOpen, onClose }) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { addTrade } = useTradeStore();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [parsedTrades, setParsedTrades] = React.useState<ParsedTrade[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [parsedBaseDate, setParsedBaseDate] = React.useState<Date | null>(null);

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFiles = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setParseError('Please drop an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      await parseWithGPT(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFiles(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFiles(file);
  };

  const parseWithGPT = async (dataUrl: string) => {
    setIsParsing(true);
    setParseError(null);
    setParsedTrades([]);

    try {
      const systemPrompt = `You are a precise data extraction engine for trading tables.
Return ONLY valid JSON with the schema:
{
  "date": string?,                 // ISO date if visible (e.g., 2025-08-07)
  "timezoneOffsetMinutes": number?,
  "trades": [
    {
      "symbol": string,
      "direction": "long"|"short",
      "quantity": number?,
      "entryTime": string?,
      "exitTime": string?,
      "entryPrice": number?,
      "exitPrice": number?,
      "pnl": number?,
      "fees": number?,
      "commissions": number?
    }
  ]
}
Rules:\n- Use data exactly as shown in the screenshot.\n- Numbers should be plain (no $ or commas).\n- Direction should be long or short.\n- If a cell is blank or ambiguous, omit that field.`;

      const userText = `Extract trades visible in this screenshot. The columns often include: Symbol, Side/Direction, Quantity, Entry Time, Exit Time, Entry Price, Exit Price, P&L, Fees/Commissions. Only return JSON.`;

      const response = await authenticatedFetch('/api/parse-trade-image', {
        method: 'POST',
        body: JSON.stringify({
          dataUrl,
          systemPrompt,
          userText,
          model: 'gpt-4o-mini',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to parse trade image');
      }

      const result = await response.json();
      let raw = result.content?.trim() || '';
      
      if (!raw) throw new Error('Empty AI response');
      // Try strict parsing, then fenced cleanup, then best-effort brace slice
      const tryParse = (text: string) => {
        try { return JSON.parse(text); } catch { return undefined; }
      };
      let json: any = tryParse(raw);
      if (!json) {
        const unfenced = raw.replace(/```json\n?|```/gi, '').trim();
        json = tryParse(unfenced);
      }
      if (!json) {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          json = tryParse(raw.slice(start, end + 1));
        }
      }
      if (!json) {
        console.warn('Unparsable AI response:', raw);
        throw new Error('AI returned non‑JSON output. Please try again.');
      }
      console.log('[Image Import] OCR JSON:', json);
      const { date, timezoneOffsetMinutes } = json as { date?: string; timezoneOffsetMinutes?: number };
      let trades = (json as any).trades as ParsedTrade[] | undefined;
      if (!trades) {
        const candidates = Object.values(json).filter(v => Array.isArray(v)) as any[];
        const isTradeLike = (arr: any[]): boolean => Array.isArray(arr) && arr.some(r => r && typeof r === 'object' && (
          'entryPrice' in r || 'exitPrice' in r || 'entryTime' in r || 'exitTime' in r
        ));
        trades = candidates.find(isTradeLike) as any;
      }
      // If a session date was detected, keep as base for time-only cells
      let baseDate: Date | null = null;
      if (date) {
        const tzOffset = typeof timezoneOffsetMinutes === 'number' ? timezoneOffsetMinutes : undefined;
        const d = new Date(date);
        if (tzOffset !== undefined && Number.isFinite(tzOffset)) {
          // Normalize to provided timezone offset
          const localOffset = d.getTimezoneOffset();
          d.setMinutes(d.getMinutes() + (localOffset - tzOffset));
        }
        baseDate = d;
      }

      const toDate = (value: string | undefined, base: Date | null): Date | undefined => {
        if (!value) return undefined;
        const text = value.trim().replace(/\s*@\s*/g, ' ').replace(/\s{2,}/g, ' ');
        // 1) Native parse first
        const native = new Date(text);
        if (!isNaN(native.getTime())) return native;

        // Helpers
        const monthIndex = (m: string): number => {
          const map: Record<string, number> = {
            january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
            jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
          };
          const key = m.toLowerCase().replace(/\./g, '');
          return map[key] ?? -1;
        };
        const finalize = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0, ampm?: string) => {
          let hours = h;
          if (ampm) {
            const ap = ampm.toLowerCase();
            if (ap === 'pm' && hours < 12) hours += 12;
            if (ap === 'am' && hours === 12) hours = 0;
          }
          const dt = new Date(y, mo, d, hours, mi, s, 0);
          return dt;
        };

        // 2) Month name formats: "August 7 2025 12:46:32 pm" or with comma
        let m = text.match(/^(January|February|March|April|May|June|July|August|September|October|November|December|Jan\.?|Feb\.?|Mar\.?|Apr\.?|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Oct\.?|Nov\.?|Dec\.?)\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i);
        if (m) {
          const mo = monthIndex(m[1]);
          const day = parseInt(m[2], 10);
          const year = parseInt(m[3], 10);
          const hh = m[4] ? parseInt(m[4], 10) : 0;
          const mm = m[5] ? parseInt(m[5], 10) : 0;
          const ss = m[6] ? parseInt(m[6], 10) : 0;
          const ap = m[7];
          if (mo >= 0) return finalize(year, mo, day, hh, mm, ss, ap);
        }

        // 3) mm/dd/yyyy optional time
        m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i);
        if (m) {
          const mo = parseInt(m[1], 10) - 1;
          const day = parseInt(m[2], 10);
          const year = parseInt(m[3], 10);
          const hh = m[4] ? parseInt(m[4], 10) : 0;
          const mm = m[5] ? parseInt(m[5], 10) : 0;
          const ss = m[6] ? parseInt(m[6], 10) : 0;
          const ap = m[7];
          return finalize(year, mo, day, hh, mm, ss, ap);
        }

        // 4) yyyy-mm-dd optional time with am/pm
        m = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i);
        if (m) {
          const year = parseInt(m[1], 10);
          const mo = parseInt(m[2], 10) - 1;
          const day = parseInt(m[3], 10);
          const hh = m[4] ? parseInt(m[4], 10) : 0;
          const mm = m[5] ? parseInt(m[5], 10) : 0;
          const ss = m[6] ? parseInt(m[6], 10) : 0;
          const ap = m[7];
          return finalize(year, mo, day, hh, mm, ss, ap);
        }

        // 5) Time-only, use base date
        if (!base) return undefined;
        m = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
        if (m) {
          const hh = parseInt(m[1], 10);
          const mm = parseInt(m[2], 10);
          const ss = m[3] ? parseInt(m[3], 10) : 0;
          const ap = m[4];
          const d = new Date(base);
          let hours = hh;
          if (ap) {
            const ap2 = ap.toLowerCase();
            if (ap2 === 'pm' && hours < 12) hours += 12;
            if (ap2 === 'am' && hours === 12) hours = 0;
          }
          d.setHours(hours, mm, ss, 0);
          return d;
        }
        return undefined;
      };

      // Helper: compute filled price for an order
      const toNumber = (v: any): number | undefined => (typeof v === 'number' ? v : (v != null && v !== '' ? Number(String(v).replace(/[^\d.\-]/g, '')) : undefined));
      const getOrderFilledPrice = (o: TradingViewOrder): number | undefined => (
        toNumber((o as any).avgFillPrice) ?? toNumber(o.limitPrice) ?? toNumber(o.stopPrice) ?? toNumber(o.takeProfit) ?? toNumber(o.stopLoss)
      );

      // Convert TradingView filled orders into trades
      const groupOrdersToTrades = (list: TradingViewOrder[], base: Date | null): ParsedTrade[] => {
        const normalize = (s?: string) => String(s || '').trim().toLowerCase();
        const isFilled = (s?: string) => /fill/.test(normalize(s));
        const isCancelled = (s?: string) => /cancel/.test(normalize(s));
        const filled = (list || []).filter(o => isFilled(o.status) && !isCancelled(o.status));
        const withTs = filled.map(o => ({
          ...o,
          __ts: toDate(o.updateTime, base),
          __price: getOrderFilledPrice(o)
        })).sort((a, b) => {
          const at = a.__ts ? a.__ts.getTime() : 0;
          const bt = b.__ts ? b.__ts.getTime() : 0;
          return at - bt;
        });

        type OpenPos = { symbol: string; direction: 'long'|'short'; price: number; quantity: number; time?: Date };
        const open: OpenPos[] = [];
        const result: ParsedTrade[] = [];

        const typeOf = (t?: string) => {
          const x = normalize(t);
          if (/(stop\s*loss|stop-loss|sl)/.test(x)) return 'stop loss';
          if (/(take\s*profit|take-profit|tp)/.test(x)) return 'take profit';
          if (/market/.test(x)) return 'market';
          if (/limit/.test(x)) return 'limit';
          if (/stop/.test(x)) return 'stop';
          return x;
        };

        for (const o of withTs) {
          const type = typeOf(o.type);
          const side = normalize(o.side);
          const qty = typeof o.qty === 'number' ? o.qty : (o.qty ? Number(String(o.qty).replace(/[,]/g, '')) : 1);
          const price = typeof o.__price === 'number' ? o.__price : undefined;
          const time = o.__ts;
          if (!o.symbol || !qty || !price) {
            continue;
          }

          const isEntry = type === 'market' || type === 'limit' || type === 'stop';
          const isExit = type === 'stop loss' || type === 'take profit';

          if (isEntry) {
            const direction: 'long'|'short' = side === 'buy' ? 'long' : 'short';
            open.push({ symbol: o.symbol, direction, price, quantity: qty, time });
            continue;
          }

          if (isExit) {
            const closingDirection: 'long'|'short' = side === 'sell' ? 'long' : 'short';
            // find earliest matching open position
            let posIndex = open.findIndex(p => p.symbol === o.symbol && p.direction === closingDirection && p.quantity > 0);
            if (posIndex === -1) {
              continue;
            }
            let remaining = qty;
            while (remaining > 0 && posIndex !== -1) {
              const pos = open[posIndex];
              const takeQty = Math.min(remaining, pos.quantity);
              const entryTime = pos.time;
              const exitTime = time;
              const entryPrice = pos.price;
              const exitPrice = price;
              const direction = pos.direction;
              const pnl = direction === 'long'
                ? (exitPrice - entryPrice) * takeQty
                : (entryPrice - exitPrice) * takeQty;

              // Sanity: for stop-loss exits, ensure price moved against the position. If not, still save but it's a clue of mismatch.
              // Future: we could re-match to a better candidate if available.

              result.push({
                symbol: o.symbol,
                direction,
                quantity: takeQty,
                entryTime: entryTime ? entryTime.toISOString() : undefined,
                exitTime: exitTime ? exitTime.toISOString() : undefined,
                entryPrice,
                exitPrice,
                pnl,
              });

              pos.quantity -= takeQty;
              remaining -= takeQty;
              if (pos.quantity <= 0) {
                open.splice(posIndex, 1);
              }
              posIndex = open.findIndex(p => p.symbol === o.symbol && p.direction === closingDirection && p.quantity > 0);
            }
            continue;
          }
        }
        return result;
      };

      const normalized = (Array.isArray(trades) ? trades : []).map(t => {
          const entry = toDate((t as any).entryTime as any, baseDate);
          const exit = toDate((t as any).exitTime as any, baseDate);
          const entryPrice = typeof (t as any).entryPrice === 'number' ? (t as any).entryPrice : undefined;
          const exitPrice = typeof (t as any).exitPrice === 'number' ? (t as any).exitPrice : undefined;
          let pnl = (t as any).pnl as number | undefined;
          if (pnl === undefined && entryPrice !== undefined && exitPrice !== undefined && (t as any).direction) {
            pnl = (t as any).direction === 'long' ? (exitPrice - entryPrice) * (Number((t as any).quantity || 1)) : (entryPrice - exitPrice) * (Number((t as any).quantity || 1));
          }
          return {
            ...t,
            entryTime: entry ? entry.toISOString() : (t as any).entryTime,
            exitTime: exit ? exit.toISOString() : (t as any).exitTime,
            pnl,
          } as ParsedTrade;
        });

      setParsedBaseDate(baseDate);
      setParsedTrades(normalized);
      if (!normalized || normalized.length === 0) {
        setParseError('No trades recognized. Try cropping to the table area and re-upload.');
      }
    } catch (err: any) {
      console.error('Image parsing failed:', err);
      setParseError(err?.message || 'Failed to parse screenshot');
    } finally {
      setIsParsing(false);
    }
  };

  const importTrades = async () => {
    if (!selectedAccountId) {
      setParseError('Select an account first to import trades into.');
      return;
    }
    if (parsedTrades.length === 0) return;
    setIsImporting(true);
    try {
      for (const row of parsedTrades) {
        const pnlGross = Number(row.pnl ?? 0) || 0;
        // Some platforms export fees/commissions as negative values on wins.
        // Normalize to positive cost so we always subtract from PnL.
        const feeTotal = Math.abs(Number(row.fees ?? 0)) + Math.abs(Number(row.commissions ?? 0));
        const pnlNet = pnlGross - feeTotal;
        const riskAmount = Math.max(Math.abs(feeTotal), Math.abs(pnlNet));
        const rr = riskAmount > 0 ? Math.abs(pnlNet) / riskAmount : 1;

        const trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> = {
          symbol: row.symbol?.toUpperCase() || 'UNKNOWN',
          direction: (row.direction || 'long'),
          entryPrice: Number(row.entryPrice || 0),
          exitPrice: typeof row.exitPrice === 'number' ? row.exitPrice : undefined,
          quantity: Number(row.quantity || 1),
          riskAmount: Number.isFinite(riskAmount) ? riskAmount : 0,
          riskRewardRatio: Number.isFinite(rr) && rr > 0 ? rr : 1,
          result: pnlNet === 0 ? 'breakeven' : pnlNet > 0 ? 'win' : 'loss',
          pnl: pnlNet,
          entryTime: row.entryTime ? new Date(row.entryTime) : new Date(),
          exitTime: row.exitTime ? new Date(row.exitTime) : undefined,
          mood: 'neutral',
          tags: [],
          notes: undefined,
          accountId: selectedAccountId,
        };

        // Fire and await to keep order and capture failures clearly
        await addTrade(trade);
      }
      onClose();
    } catch (err) {
      console.error('Import failed:', err);
      setParseError('Import failed. Please review parsed data and try again.');
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
              <h3 className="text-lg font-semibold text-card-foreground">Import Topstep Screenshot (ProjectX)</h3>
              <p className="text-xs text-muted-foreground">Supports ProjectX/Topstep trade table screenshots. For TradingView, use Import TradingView CSV.</p>
            </div>

            <div className="p-4 space-y-4">
              {!imagePreview && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex flex-col items-center justify-center gap-3 p-10 rounded-xl border border-dashed text-muted-foreground bg-muted/20 transition-colors',
                    isDragging ? 'border-primary bg-primary/5' : 'border-border'
                  )}
                >
                  <div className="text-sm">Drag & drop an image here</div>
                  <div className="text-xs">or</div>
                  <button
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    onClick={handlePickFile}
                  >
                    Choose Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs">PNG, JPG. Clear table screenshots work best.</p>
                </div>
              )}

              {imagePreview && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {isParsing ? 'Parsing screenshot…' : parsedTrades.length > 0 ? `${parsedTrades.length} trades detected` : 'No trades detected yet'}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm"
                          onClick={() => parseWithGPT(imagePreview)}
                          disabled={isParsing}
                        >
                          Re-parse
                        </button>
                        <button
                          className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm"
                          onClick={() => setImagePreview(null)}
                          disabled={isParsing}
                        >
                          Choose another
                        </button>
                      </div>
                    </div>

                    {parseError && (
                      <div className="p-2 text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded">
                        {parseError}
                      </div>
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
                          {parsedTrades.map((t, idx) => (
                            <tr key={idx} className="border-t border-border">
                              <td className="p-2 font-medium">{t.symbol}</td>
                              <td className="p-2 capitalize">{t.direction}</td>
                              <td className="p-2 text-right">{t.quantity ?? '-'}</td>
                              <td className="p-2 text-right">{t.entryPrice ?? '-'}</td>
                              <td className="p-2 text-right">{t.exitPrice ?? '-'}</td>
                              <td className={cn('p-2 text-right', (t.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500')}>{t.pnl ?? '-'}</td>
                            </tr>
                          ))}
                          {parsedTrades.length === 0 && !isParsing && (
                            <tr>
                              <td className="p-3 text-center text-muted-foreground" colSpan={6}>Nothing parsed yet</td>
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
                        disabled={isParsing || parsedTrades.length === 0 || isImporting}
                      >
                        {isImporting ? 'Importing…' : `Import ${parsedTrades.length} trade${parsedTrades.length === 1 ? '' : 's'}`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TradeImageImport;


