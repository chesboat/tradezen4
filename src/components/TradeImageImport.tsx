import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OpenAI from 'openai';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
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
      const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY as string | undefined;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

      const systemPrompt = `You are a precise data extraction engine. Extract trade rows from the provided screenshot of a trade table.
Return ONLY valid JSON with the schema:
{
  "date": string?,                 // ISO date if a session date is visible (e.g., 2025-08-07)
  "timezoneOffsetMinutes": number?, // If a timezone is shown, provide minutes offset from UTC (e.g., -300 for ET)
  "trades": [
    {
      "symbol": string,
      "direction": "long"|"short",
      "quantity": number?,
      "entryTime": string?,   // Prefer full ISO (e.g., 2025-08-07T12:46:32-05:00). If only a time is visible, return just the time string (e.g., 12:46:32 pm)
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

      const userText = `Extract the trades visible in this screenshot. The columns often include ID, Symbol, Size/Quantity, Entry Time, Exit Time, Entry Price, Exit Price, P&L, Commissions, Fees, Direction. Only return JSON.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText } as any,
              { type: 'image_url', image_url: { url: dataUrl } } as any,
            ] as any,
          },
        ],
        response_format: { type: 'json_object' } as any,
        max_completion_tokens: 1200,
      });

      let raw = completion.choices[0]?.message?.content?.trim() || '';
      if (!raw) {
        // Fallback attempt with gpt-4o-mini
        try {
          const backup = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text', text: userText } as any,
                  { type: 'image_url', image_url: { url: dataUrl } } as any,
                ] as any,
              },
            ],
            response_format: { type: 'json_object' } as any,
          });
          raw = backup.choices[0]?.message?.content?.trim() || '';
        } catch (e) {
          console.error('Backup model failed:', e);
        }
      }
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
      const { date, timezoneOffsetMinutes, trades } = json as { date?: string; timezoneOffsetMinutes?: number; trades: ParsedTrade[] };
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
        const direct = new Date(value);
        if (!isNaN(direct.getTime())) return direct;
        if (!base) return undefined;
        // Try parse time like 12:46:32 pm or 12:39:03 pm
        const m = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
        if (!m) return undefined;
        const hoursRaw = parseInt(m[1], 10);
        const minutes = parseInt(m[2], 10);
        const seconds = m[3] ? parseInt(m[3], 10) : 0;
        const ampm = m[4]?.toLowerCase();
        let hours = hoursRaw;
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        const d = new Date(base);
        d.setHours(hours, minutes, seconds, 0);
        return d;
      };

      const normalized = (Array.isArray(trades) ? trades : []).map(t => {
        const entry = toDate(t.entryTime as any, baseDate);
        const exit = toDate(t.exitTime as any, baseDate);
        return {
          ...t,
          entryTime: entry ? entry.toISOString() : t.entryTime,
          exitTime: exit ? exit.toISOString() : t.exitTime,
        } as ParsedTrade;
      });
      setParsedBaseDate(baseDate);
      setParsedTrades(normalized);
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
        const pnlNumber = Number(row.pnl ?? 0) || 0;
        const riskAmount = Math.max(Math.abs(Number(row.fees || 0) + Number(row.commissions || 0)), Math.abs(pnlNumber));
        const rr = riskAmount > 0 ? Math.abs(pnlNumber) / riskAmount : 1;

        const trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> = {
          symbol: row.symbol?.toUpperCase() || 'UNKNOWN',
          direction: (row.direction || 'long'),
          entryPrice: Number(row.entryPrice || 0),
          exitPrice: typeof row.exitPrice === 'number' ? row.exitPrice : undefined,
          quantity: Number(row.quantity || 1),
          riskAmount: Number.isFinite(riskAmount) ? riskAmount : 0,
          riskRewardRatio: Number.isFinite(rr) && rr > 0 ? rr : 1,
          result: pnlNumber === 0 ? 'breakeven' : pnlNumber > 0 ? 'win' : 'loss',
          pnl: pnlNumber,
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
              <h3 className="text-lg font-semibold text-card-foreground">Import Trades from Screenshot (GPT‑5)</h3>
              <p className="text-xs text-muted-foreground">Upload a screenshot of a trade table. We’ll OCR and parse it into structured trades you can import.</p>
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


