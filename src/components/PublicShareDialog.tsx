import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2 } from 'lucide-react';
import { createPublicShareSnapshot, PublicShareOptions } from '@/lib/publicShare';

interface PublicShareDialogProps {
  date: string;
  accountId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PublicShareDialog: React.FC<PublicShareDialogProps> = ({ date, accountId, isOpen, onClose }) => {
  const [options, setOptions] = React.useState<PublicShareOptions>({
    includeImages: true,
    includeNotes: false,
    includeMood: true,
    includeCalendar: false,
    includeTrades: true,
    includeStats: true,
    expiresDays: undefined,
  });
  const [creating, setCreating] = React.useState(false);
  const [link, setLink] = React.useState<string | null>(null);

  const toggle = (key: keyof PublicShareOptions) => setOptions(prev => ({ ...prev, [key]: !prev[key] as any }));

  const handleCreate = async () => {
    try {
      setCreating(true);
      const { url } = await createPublicShareSnapshot(date, accountId, options);
      setLink(url);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
          <motion.div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6" initial={{scale:0.96, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.96, opacity:0}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Share day publicly</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded hover:bg-muted"><X className="w-4 h-4"/></button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={options.includeImages} onChange={() => toggle('includeImages')} />
                <span>Include images</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={options.includeNotes} onChange={() => toggle('includeNotes')} />
                <span>Include notes</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={options.includeMood} onChange={() => toggle('includeMood')} />
                <span>Include mood timeline</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={options.includeCalendar} onChange={() => toggle('includeCalendar')} />
                <span>Include calendar snapshot</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={options.includeTrades} onChange={() => toggle('includeTrades')} />
                <span>Include trades</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={options.includeStats} onChange={() => toggle('includeStats')} />
                <span>Include daily stats</span>
              </label>
            </div>

            <div className="mt-6 flex items-center gap-2 justify-end">
              {!link && (
                <button disabled={creating} onClick={handleCreate} className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50">
                  {creating ? 'Creating…' : 'Create link'}
                </button>
              )}
              {link && (
                <div className="w-full">
                  <div className="text-sm text-muted-foreground mb-2">Public link</div>
                  <div className="flex gap-2">
                    <input readOnly className="flex-1 px-2 py-2 rounded border bg-background" value={link} />
                    <button className="px-3 py-2 rounded bg-muted" onClick={() => navigator.clipboard.writeText(link!)}>Copy</button>
                    <a className="px-3 py-2 rounded bg-primary text-primary-foreground" href={link} target="_blank" rel="noreferrer">Open</a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


