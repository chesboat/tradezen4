import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Target, Shield, Sparkles, ArrowRight, Check } from 'lucide-react';

interface WelcomeFlowProps {
  onComplete: () => void;
}

/**
 * Apple-style welcome flow for new signups
 * Shows value BEFORE pricing: Trading Health → Intelligence → Pricing
 */
export const WelcomeFlow = ({ onComplete }: WelcomeFlowProps) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);

  // Auto-advance from welcome screen after 2.5 seconds
  useEffect(() => {
    if (currentScreen === 0 && !hasAutoAdvanced) {
      const timer = setTimeout(() => {
        setCurrentScreen(1);
        setHasAutoAdvanced(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, hasAutoAdvanced]);

  const screens = [
    <WelcomeScreen key="welcome" />,
    <TradingHealthScreen key="health" onContinue={() => setCurrentScreen(2)} />,
    <IntelligenceScreen key="intelligence" onContinue={() => setCurrentScreen(3)} />,
  ];

  if (currentScreen >= screens.length) {
    onComplete();
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {screens[currentScreen]}
        </motion.div>
      </AnimatePresence>

      {/* Progress Dots */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {screens.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentScreen
                ? 'w-8 bg-primary'
                : index < currentScreen
                ? 'w-1.5 bg-primary/50'
                : 'w-1.5 bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Screen 1: Welcome
const WelcomeScreen = () => {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-8"
      >
        <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
          Welcome to
        </div>
        <div className="text-7xl font-bold tracking-tight">Refine</div>
        <div className="text-lg text-muted-foreground mt-2 font-light">
          Your Trading Journal
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="flex justify-center mb-6"
      >
        <SimplifiedRings />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="text-xl text-muted-foreground"
      >
        Close all 3 rings.
        <br />
        Build a consistently profitable edge.
      </motion.p>
    </div>
  );
};

// Screen 2: Trading Health Demo
const TradingHealthScreen = ({ onContinue }: { onContinue: () => void }) => {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-3">Your Trading Health at a Glance</h2>
        <p className="text-lg text-muted-foreground">
          Track your performance across the 3 metrics that matter most
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <RingCard
          icon={<TrendingUp className="w-8 h-8" />}
          title="Edge"
          emoji="💰"
          description="Are you profitable?"
          metric="Expectancy"
          detail="Track your profit potential per trade"
          delay={0.1}
        />
        <RingCard
          icon={<Target className="w-8 h-8" />}
          title="Consistency"
          emoji="🎯"
          description="Following your rules?"
          metric="Rule Adherence"
          detail="Process over results"
          delay={0.2}
        />
        <RingCard
          icon={<Shield className="w-8 h-8" />}
          title="Risk Control"
          emoji="⚠️"
          description="Protecting your capital?"
          metric="Max Drawdown"
          detail="Always improvable"
          delay={0.3}
        />
      </div>

      <div className="space-y-4 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-start gap-3 bg-muted/30 rounded-xl p-4"
        >
          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-left">
            <div className="font-medium">30-Day Rolling Window</div>
            <div className="text-sm text-muted-foreground">
              Always improvable—every day is a fresh start
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-start gap-3 bg-muted/30 rounded-xl p-4"
        >
          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-left">
            <div className="font-medium">Build Streaks & Unlock Badges</div>
            <div className="text-sm text-muted-foreground">
              Close all 3 rings daily to build your streak
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-start gap-3 bg-muted/30 rounded-xl p-4"
        >
          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-left">
            <div className="font-medium">Automatic Tracking</div>
            <div className="text-sm text-muted-foreground">
              No manual work—just trade and journal
            </div>
          </div>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onContinue}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

// Screen 3: Intelligence Preview
const IntelligenceScreen = ({ onContinue }: { onContinue: () => void }) => {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-sm font-medium text-primary uppercase tracking-wide">
            Premium Feature
          </span>
        </div>
        <h2 className="text-4xl font-bold mb-3">Refine Learns Your Edge</h2>
        <p className="text-lg text-muted-foreground">
          Discover patterns you didn't know existed
        </p>
      </div>

      {/* Example "For You" Insights */}
      <div className="space-y-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 text-left border border-primary/20"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">💰</div>
            <div>
              <div className="font-semibold mb-1">Your Most Profitable Setup</div>
              <div className="text-muted-foreground">
                "You're <span className="text-foreground font-medium">34% more profitable</span> trading momentum setups before 11 AM. Consider trading more of these."
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl p-6 text-left border border-amber-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎯</div>
            <div>
              <div className="font-semibold mb-1">Consistency Insight</div>
              <div className="text-muted-foreground">
                "Your rule adherence drops to <span className="text-foreground font-medium">62% after 2 PM</span>. Take a break or stop trading earlier."
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl p-6 text-left border border-red-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <div className="font-semibold mb-1">Risk Control Alert</div>
              <div className="text-muted-foreground">
                "You take <span className="text-foreground font-medium">2.3x larger positions</span> after losing trades. Set a max position size rule."
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-muted/30 rounded-xl p-6 text-left"
        >
          <div className="font-semibold mb-2">📊 Setup Analytics</div>
          <div className="text-sm text-muted-foreground">
            Which setups are actually profitable? Get the data.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-muted/30 rounded-xl p-6 text-left"
        >
          <div className="font-semibold mb-2">⏰ Time Intelligence</div>
          <div className="text-sm text-muted-foreground">
            Your best (and worst) trading hours, automatically tracked.
          </div>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        onClick={onContinue}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
      >
        See Plans & Pricing
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

// Helper Components
const SimplifiedRings = () => {
  return (
    <div className="relative w-48 h-48">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Ring 3 - Outer (Risk) */}
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="4"
          opacity="0.3"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="hsl(199 89% 48%)" // Cyan for Risk
          strokeWidth="4"
          strokeDasharray="264"
          initial={{ strokeDashoffset: 264 }}
          animate={{ strokeDashoffset: 264 * 0.3 }} // 70% fill
          transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
          strokeLinecap="round"
        />

        {/* Ring 2 - Middle (Consistency) */}
        <motion.circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="4"
          opacity="0.3"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="hsl(142 76% 36%)" // Green for Consistency
          strokeWidth="4"
          strokeDasharray="220"
          initial={{ strokeDashoffset: 220 }}
          animate={{ strokeDashoffset: 220 * 0.15 }} // 85% fill
          transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
          strokeLinecap="round"
        />

        {/* Ring 1 - Inner (Edge) */}
        <motion.circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="4"
          opacity="0.3"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke="hsl(24 70% 56%)" // Orange for Edge
          strokeWidth="4"
          strokeDasharray="176"
          initial={{ strokeDashoffset: 176 }}
          animate={{ strokeDashoffset: 176 * 0.45 }} // 55% fill
          transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>

      {/* Center Streak (optional) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.4 }}
          className="text-center"
        >
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-xs text-muted-foreground font-medium">Build</div>
          <div className="text-xs text-muted-foreground font-medium">Your Streak</div>
        </motion.div>
      </div>
    </div>
  );
};

const RingCard = ({
  icon,
  title,
  emoji,
  description,
  metric,
  detail,
  delay
}: {
  icon: React.ReactNode;
  title: string;
  emoji: string;
  description: string;
  metric: string;
  detail: string;
  delay: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-muted/30 rounded-2xl p-6 text-center"
    >
      <div className="text-4xl mb-3">{emoji}</div>
      <div className="text-xl font-bold mb-2">{title}</div>
      <div className="text-sm text-muted-foreground mb-3">{description}</div>
      <div className="text-xs font-medium text-primary mb-1">{metric}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </motion.div>
  );
};

