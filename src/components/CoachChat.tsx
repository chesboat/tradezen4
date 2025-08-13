import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { useCoachStore } from '@/store/useCoachStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { CoachService } from '@/lib/ai/coachService';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useSessionStore } from '@/store/useSessionStore';

interface CoachChatProps {
  date: string; // YYYY-MM-DD
}

export const CoachChat: React.FC<CoachChatProps> = ({ date }) => {
  const { isOpen, open, close, addMessage, getMessagesFor, loadFromStorage } = useCoachStore();
  const { selectedAccountId, accounts } = useAccountFilterStore();
  const { trades } = useTradeStore();
  const { notes } = useQuickNoteStore();
  const { rules } = useSessionStore();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const { isExpanded: sidebarExpanded } = useSidebarStore();
  const leftOffset = sidebarExpanded ? 300 : 84; // match sidebar widths (expanded vs collapsed)

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  const scopedTrades = useMemo(() => {
    if (!selectedAccountId) return trades;
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  const scopedNotes = useMemo(() => {
    if (!selectedAccountId) return notes;
    return notes.filter(n => n.accountId === selectedAccountId);
  }, [notes, selectedAccountId]);

  const messages = getMessagesFor(date, selectedAccountId || 'default');

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages.length, isOpen]);

  const send = async (override?: string) => {
    const toSend = (override ?? input).trim();
    if (!toSend || !selectedAccountId) return;
    const question = toSend;
    setInput('');
    addMessage({ role: 'user', content: question, date, accountId: selectedAccountId });
    setIsSending(true);
    try {
      const acc = accounts.find(a => a.id === selectedAccountId);
      const answer = await CoachService.askCoach(question, {
        date,
        accountId: selectedAccountId,
        trades: scopedTrades,
        notes: scopedNotes as any,
        rules: {
          dailyLossLimit: (acc as any)?.dailyLossLimit ?? null,
          maxDrawdown: (acc as any)?.maxDrawdown ?? null,
          maxTrades: (acc as any)?.sessionRules?.maxTrades ?? null,
          cutoffTime: (acc as any)?.sessionRules?.cutoffTimeMinutes ? String((acc as any).sessionRules.cutoffTimeMinutes) : null,
        },
      });
      addMessage({ role: 'assistant', content: answer, date, accountId: selectedAccountId });
    } finally {
      setIsSending(false);
    }
  };

  // Context-aware question suggestions (pills)
  const suggestions = useMemo(() => {
    const hasTrades = scopedTrades.length > 0;
    const acc = accounts.find(a => a.id === selectedAccountId);
    const hasCap = typeof (acc as any)?.dailyLossLimit === 'number' && (acc as any)?.dailyLossLimit! > 0;
    const pills: string[] = [];
    if (!hasCap) pills.push('Help me set my daily loss cap');
    if (hasTrades) pills.push('Summarize today in 4 bullets');
    pills.push('Give me 2 micro-goals for tomorrow');
    if (hasTrades) pills.push('What patterns do you see in my last 10 trades?');
    if (rules?.maxTrades) pills.push('Am I pacing well vs my max trades?');
    pills.push('Pre-market checklist for tomorrow');
    return pills.slice(0, 6);
  }, [scopedTrades.length, accounts, selectedAccountId, rules]);

  return (
    <>
      <button
        className="fixed bottom-6 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90"
        style={{ left: leftOffset }}
        onClick={isOpen ? close : open}
        title="Ask Coach"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 z-50 w-[360px] max-w-[92vw] bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
            style={{ left: leftOffset }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="p-3 border-b border-border/60 flex items-center justify-between">
              <div className="text-sm font-semibold">AI Coach</div>
              <button className="text-muted-foreground" onClick={close}><X className="w-4 h-4" /></button>
            </div>
            <div ref={scrollerRef} className="p-3 h-[300px] overflow-y-auto space-y-2">
              {messages.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  Ask things like: "What should my daily loss cap be?", "Summarize today in 3 bullets", or "Give me 2 micro goals for tomorrow."
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`text-sm p-2 rounded whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary/10 text-foreground' : 'bg-muted text-foreground'}`}>
                  {m.content}
                </div>
              ))}
            </div>
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    className="text-[11px] px-2 py-1 rounded-full bg-muted/60 border border-border hover:bg-muted text-foreground"
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="p-3 border-t border-border/60 flex items-center gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg bg-muted/40 border border-border/60 focus:outline-none focus:border-primary/50 text-sm"
                placeholder="Ask the coach..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              />
              <button
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
                disabled={isSending || !input.trim()}
                onClick={() => send()}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


