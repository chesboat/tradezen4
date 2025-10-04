/**
 * Trading Health Documentation
 * Apple-style help & reference guide
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Target,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Info,
  Lightbulb,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradingHealthDocsProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: string; // Optional: jump to specific section
}

interface DocSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: React.ReactNode;
}

// Helper components - must be defined before sections array
const RuleCard: React.FC<{ title: string; description: string; check: string }> = ({ title, description, check }) => (
  <div className="text-xs bg-muted/30 p-2 rounded-lg space-y-1">
    <div className="font-semibold text-foreground">{title}</div>
    <div className="text-muted-foreground">{description}</div>
    <code className="text-[10px] text-primary">{check}</code>
  </div>
);

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <span className="font-semibold text-foreground text-sm">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const sections: DocSection[] = [
  {
    id: 'overview',
    icon: Info,
    title: 'What is Trading Health?',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          Trading Health is a comprehensive performance system that tracks your trading edge in three key areas:
          <strong className="text-foreground"> Profitability, Consistency, and Risk Control</strong>.
        </p>
        
        <div className="bg-muted/30 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-foreground">Think of it like Apple Watch</h4>
          <p className="text-sm text-muted-foreground">
            Just as Apple Watch has Move, Exercise, and Stand rings, Trading Health has Edge, Consistency, and Risk Control rings. 
            Close all three every day to build a profitable trading edge.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF375F]/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" style={{ color: '#FF375F' }} />
            </div>
            <div>
              <h5 className="font-semibold text-foreground mb-1">💰 Edge Ring</h5>
              <p className="text-sm text-muted-foreground">Your profit potential per trade (expectancy)</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#7AFF45]/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4" style={{ color: '#7AFF45' }} />
            </div>
            <div>
              <h5 className="font-semibold text-foreground mb-1">🎯 Consistency Ring</h5>
              <p className="text-sm text-muted-foreground">How well you follow your trading process</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0AFFFE]/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4" style={{ color: '#0AFFFE' }} />
            </div>
            <div>
              <h5 className="font-semibold text-foreground mb-1">⚠️ Risk Control Ring</h5>
              <p className="text-sm text-muted-foreground">How well you protect your capital from drawdowns</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'edge-ring',
    icon: Zap,
    title: 'Edge Ring (Profitability)',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          The Edge Ring measures your <strong className="text-foreground">expectancy</strong> - the average amount you make (or lose) per trade.
        </p>

        <div className="bg-[#FF375F]/5 border border-[#FF375F]/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-foreground">How It's Calculated</h4>
          <code className="text-xs bg-muted px-3 py-2 rounded-lg block">
            Expectancy = (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
          </code>
          <p className="text-sm text-muted-foreground">
            Example: 60% win rate, $100 avg win, $50 avg loss → <strong>$40 expectancy per trade</strong>
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Scoring</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg">
              <span className="text-muted-foreground">Expectancy &gt; $50</span>
              <span className="font-semibold text-green-500">90+ (Excellent)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg">
              <span className="text-muted-foreground">Expectancy &gt; $20</span>
              <span className="font-semibold text-blue-500">75+ (Good)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded-lg">
              <span className="text-muted-foreground">Expectancy &gt; $0</span>
              <span className="font-semibold text-yellow-500">45+ (Needs Work)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg">
              <span className="text-muted-foreground">Expectancy &lt; $0</span>
              <span className="font-semibold text-red-500">&lt;45 (Critical)</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">How to Improve</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Increase win rate by only taking high-probability setups</li>
                <li>Let winners run longer to increase average win</li>
                <li>Cut losers faster to decrease average loss</li>
                <li>Focus on setups with favorable risk-to-reward ratios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'consistency-ring',
    icon: Target,
    title: 'Consistency Ring (Process)',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          The Consistency Ring tracks how well you follow your trading process through <strong className="text-foreground">8 automatic rules</strong>. 
          No setup required - they work on every trade.
        </p>

        <div className="bg-[#7AFF45]/5 border border-[#7AFF45]/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-foreground">8 Universal Rules</h4>
          
          <div className="space-y-3">
            {/* Risk Management */}
            <div>
              <div className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                Risk Management (3 rules)
              </div>
              <div className="space-y-2 ml-6">
                <RuleCard
                  title="Set risk amount"
                  description="Defined how much you're risking before entering"
                  check="trade.riskAmount > 0"
                />
                <RuleCard
                  title="Position size appropriate"
                  description="Risk per trade between 0.5-3% of account"
                  check="0.5% ≤ risk% ≤ 3%"
                />
                <RuleCard
                  title="Minimum 1.5:1 R:R"
                  description="Trade had at least 1.5:1 risk-to-reward potential"
                  check="trade.rrRatio ≥ 1.5"
                />
              </div>
            </div>

            {/* Journaling */}
            <div>
              <div className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                Journaling (3 rules)
              </div>
              <div className="space-y-2 ml-6">
                <RuleCard
                  title="Added setup tags"
                  description="Tagged trade with strategy (#breakout, #reversal, etc.)"
                  check="trade.tags.length > 0"
                />
                <RuleCard
                  title="Added trade notes"
                  description="Wrote at least a sentence about the trade"
                  check="trade.notes.length ≥ 10"
                />
                <RuleCard
                  title="Marked result"
                  description="Logged the outcome (win/loss) and P&L"
                  check="trade.result && trade.pnl"
                />
              </div>
            </div>

            {/* Discipline */}
            <div>
              <div className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                Discipline (2 rules)
              </div>
              <div className="space-y-2 ml-6">
                <RuleCard
                  title="No revenge trading"
                  description="Didn't trade impulsively within 30 min after a loss"
                  check="No quick + oversized trades after losses"
                />
                <RuleCard
                  title="No overtrading"
                  description="Stayed within reasonable daily trade limit (≤5 default)"
                  check="trades per day ≤ 5"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">How to Improve</h4>
              <p className="text-xs text-muted-foreground">
                Follow 80%+ of rules consistently to pass. Build streaks by maintaining high adherence over multiple days.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'risk-ring',
    icon: Shield,
    title: 'Risk Control Ring (Protection)',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          The Risk Control Ring measures your <strong className="text-foreground">30-day maximum drawdown</strong> - 
          how much you've dropped from your peak equity in the last 30 days.
        </p>

        <div className="bg-[#0AFFFE]/5 border border-[#0AFFFE]/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-foreground">How It's Calculated</h4>
          <code className="text-xs bg-muted px-3 py-2 rounded-lg block">
            Max Drawdown = ((Peak Equity - Current Equity) / Peak Equity) × 100
          </code>
          <p className="text-sm text-muted-foreground">
            Example: Peak $10,000 → Current $9,500 = <strong>5% drawdown</strong>
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Scoring</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg">
              <span className="text-muted-foreground">Drawdown &lt; 5%</span>
              <span className="font-semibold text-green-500">95 (Excellent)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg">
              <span className="text-muted-foreground">Drawdown &lt; 10%</span>
              <span className="font-semibold text-blue-500">80 (Good)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded-lg">
              <span className="text-muted-foreground">Drawdown &lt; 15%</span>
              <span className="font-semibold text-yellow-500">60 (Needs Work)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg">
              <span className="text-muted-foreground">Drawdown ≥ 20%</span>
              <span className="font-semibold text-red-500">&lt;40 (Critical)</span>
            </div>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">Always Improvable!</h4>
              <p className="text-xs text-muted-foreground">
                Every time you hit a new equity peak, the drawdown resets. This metric is <strong>always improvable</strong> - 
                not a permanent scar from past mistakes.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">How to Improve</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Reduce position sizes during losing streaks</li>
                <li>Take breaks after 2-3 consecutive losses</li>
                <li>Stick to your stop losses (don't move them)</li>
                <li>Build equity back slowly with smaller size</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: '30-day-window',
    icon: Calendar,
    title: '30-Day Rolling Window',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          All Trading Health metrics use a <strong className="text-foreground">30-day rolling window</strong>. 
          This means your score is always based on your last 30 days of trading.
        </p>

        <div className="bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-green-500/10 border border-border rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-foreground">Why 30 Days?</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Old mistakes fade away</strong> - Bad trades from 2 months ago don't hurt you forever</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Recent performance matters</strong> - Your last 30 days reflect your current skill level</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Always improvable</strong> - You can always improve your score with better recent trading</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Encourages consistency</strong> - You can't coast on past wins; you need to stay sharp</span>
            </li>
          </ul>
        </div>

        <div className="bg-muted/30 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-foreground text-sm">Example Timeline</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>Jan 1-30:</strong> Your score is based on all January trades</div>
            <div><strong>Feb 1:</strong> Jan 1 trades drop off, Feb 1 trades are included</div>
            <div><strong>Feb 15:</strong> Your score includes Jan 16 - Feb 15</div>
            <div><strong>Mar 1:</strong> Your score includes Feb 1 - Mar 1 (all Jan trades are gone)</div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">Time Window Options</h4>
              <p className="text-xs text-muted-foreground">
                You can toggle between 7-day, 30-day, and 90-day windows to see short-term vs long-term performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'streaks',
    icon: Award,
    title: 'Streaks & Milestones',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          Build streaks by maintaining <strong className="text-foreground">80%+ rule adherence</strong> on consecutive days. 
          Streaks are a powerful motivator to stay consistent.
        </p>

        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-foreground">Streak Milestones</h4>
          <div className="space-y-2">
            {[
              { days: 3, title: '🔥 Building Momentum', desc: 'You\'re getting started' },
              { days: 7, title: '⭐ Week Warrior', desc: 'Consistency is forming' },
              { days: 14, title: '💪 Two-Week Streak', desc: 'This is becoming a habit' },
              { days: 30, title: '🏆 Month Master', desc: 'Elite discipline achieved' },
              { days: 90, title: '👑 Quarter King', desc: 'You\'re a trading professional' },
            ].map(({ days, title, desc }) => (
              <div key={days} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {days}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-foreground text-sm">How Streaks Are Calculated</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Each trading day, we check if you followed 80%+ of rules</li>
            <li>If yes, your streak continues</li>
            <li>If no, your streak resets to 0</li>
            <li>We also track your <strong>longest streak ever</strong> as a personal best</li>
          </ul>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">Streak Strategy</h4>
              <p className="text-xs text-muted-foreground">
                Focus on following your rules, not making money. Consistency leads to profitability. 
                A 30-day streak means you've traded like a professional for an entire month.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'faq',
    icon: HelpCircle,
    title: 'Frequently Asked Questions',
    content: (
      <div className="space-y-4">
        <FAQItem
          question="Why is my score low even though I'm profitable?"
          answer="Trading Health measures more than just profit. If your Consistency Ring is low, you might be winning despite poor process (luck). Fix your process to build sustainable edge."
        />
        
        <FAQItem
          question="Can I customize the rules?"
          answer="The 8 universal rules are automatic and apply to everyone. They represent best practices in trading. Future updates may allow custom rules, but these 8 cover the fundamentals."
        />
        
        <FAQItem
          question="What if I only trade 2-3 times per week?"
          answer="That's fine! The system works for any trading frequency. Your scores are based on the trades you do take, not how many. Quality over quantity."
        />
        
        <FAQItem
          question="Why does my Risk Control score change even without new trades?"
          answer="The 30-day window is rolling. As old trades drop off and new ones are added, your max drawdown calculation updates. This keeps the metric current and improvable."
        />
        
        <FAQItem
          question="How is revenge trading detected?"
          answer="If you take a trade within 30 minutes of a loss AND increase your position size by 1.5x+, it's flagged as potential revenge trading. We detect the pattern automatically."
        />
        
        <FAQItem
          question="What if I break my streak?"
          answer="Don't worry! Streaks are motivational, not punitive. Your overall score is based on the 30-day window, not streaks. Just start a new streak tomorrow."
        />
        
        <FAQItem
          question="Can I see my score history over time?"
          answer="Yes! Use the time window toggle (7-day, 30-day, 90-day) to see how your performance evolves. Future updates will add historical trend charts."
        />
        
        <FAQItem
          question="What's a 'good' overall score?"
          answer="80+ is excellent, 60-79 is good, 40-59 needs work, below 40 is critical. Focus on closing all three rings (80%+) consistently rather than chasing a perfect 100."
        />
      </div>
    ),
  },
];

export const TradingHealthDocs: React.FC<TradingHealthDocsProps> = ({
  isOpen,
  onClose,
  initialSection = 'overview',
}) => {
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const currentSection = sections.find(s => s.id === selectedSection) || sections[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background border border-border rounded-3xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Trading Health Guide</h2>
                  <p className="text-sm text-muted-foreground">Complete documentation & reference</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Sidebar */}
              <div className="flex-shrink-0 w-full md:w-64 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
                <nav className="p-4 space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = section.id === selectedSection;
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSection(section.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{section.title}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      {React.createElement(currentSection.icon, {
                        className: 'w-8 h-8 text-primary',
                      })}
                      <h3 className="text-2xl font-bold text-foreground">{currentSection.title}</h3>
                    </div>
                    {currentSection.content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TradingHealthDocs;
