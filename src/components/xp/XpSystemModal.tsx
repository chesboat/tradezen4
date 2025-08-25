import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Crown, Zap, Target, Calendar, BookOpen, TrendingUp, Award, FileEdit } from 'lucide-react';
import { LevelBadge } from './LevelBadge';
import { PrestigeIcon } from './PrestigeIcon';
import { ProgressRing } from './ProgressRing';
import { XpRewards } from '@/lib/xp/XpService';
import { PRESTIGE_THEMES, OBSIDIAN_THEME } from '@/lib/xp/constants';
import { cn } from '@/lib/utils';

interface XpSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const XpSystemModal: React.FC<XpSystemModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'prestige' | 'progression'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Trophy },
    { id: 'rewards', label: 'XP Rewards', icon: Zap },
    { id: 'prestige', label: 'Prestige System', icon: Crown },
    { id: 'progression', label: 'Progression', icon: TrendingUp }
  ] as const;

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <ProgressRing progressPct={65} size="lg" showPercentage />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Level & XP System</h3>
        <p className="text-muted-foreground">
          Earn XP through trading, reflection, and consistent habits. Level up to unlock prestige tiers!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Levels 1-30</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Progress through 30 levels per season. Each level requires more XP than the last.
          </p>
          <div className="text-xs text-muted-foreground">
            • Level 1→2: 200 XP<br/>
            • Level 15→16: 1,600 XP<br/>
            • Level 29→30: 3,000 XP
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h4 className="font-semibold">Prestige System</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Reach Level 30 to unlock prestige. Reset to Level 1 but gain prestigious status!
          </p>
          <div className="text-xs text-muted-foreground">
            • Keep lifetime XP & achievements<br/>
            • Unlock exclusive badges<br/>
            • Show mastery & dedication
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-primary">Why XP Matters</h4>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Track Progress:</strong> Visual representation of your trading journey</li>
          <li>• <strong>Build Habits:</strong> Consistent rewards for good trading practices</li>
          <li>• <strong>Stay Motivated:</strong> Clear milestones and achievements</li>
          <li>• <strong>Show Mastery:</strong> Prestige levels demonstrate long-term commitment</li>
        </ul>
      </div>
    </div>
  );

  const renderRewards = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
        <h3 className="text-xl font-bold text-foreground mb-2">XP Rewards</h3>
        <p className="text-muted-foreground">
          Earn XP for every positive action in your trading journey
        </p>
      </div>

      <div className="grid gap-4">
        {/* Trading Section */}
        <div className="bg-muted/30 rounded-xl p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Trading Activities
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span>Trade Win</span>
              <span className="font-medium text-green-600">{XpRewards.TRADE_WIN} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Big Win (&gt;$500)</span>
              <span className="font-medium text-green-600">{XpRewards.BIG_WIN} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Trade Loss</span>
              <span className="font-medium text-orange-600">{XpRewards.TRADE_LOSS} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Breakeven Trade</span>
              <span className="font-medium text-blue-600">{XpRewards.TRADE_SCRATCH} XP</span>
            </div>
          </div>
        </div>

        {/* Reflection Section */}
        <div className="bg-muted/30 rounded-xl p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            Reflection & Growth
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span>Daily Reflection</span>
              <span className="font-medium text-blue-600">{XpRewards.DAILY_REFLECTION} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Weekly Review</span>
              <span className="font-medium text-blue-600">{XpRewards.WEEKLY_REVIEW} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Journal Entry</span>
              <span className="font-medium text-blue-600">{XpRewards.JOURNAL_ENTRY} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Lesson Learned</span>
              <span className="font-medium text-blue-600">{XpRewards.LESSON_LEARNED} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Task Completed</span>
              <span className="font-medium text-blue-600">{XpRewards.TODO_COMPLETE} XP</span>
            </div>
          </div>
        </div>

        {/* Rich Notes Section */}
        <div className="bg-muted/30 rounded-xl p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileEdit className="w-4 h-4 text-violet-500" />
            Rich Notes & Study
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span>Create Rich Note</span>
              <span className="font-medium text-violet-600">{XpRewards.RICH_NOTE_CREATE} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Update Note</span>
              <span className="font-medium text-violet-600">{XpRewards.RICH_NOTE_UPDATE} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Organize Notes</span>
              <span className="font-medium text-violet-600">{XpRewards.RICH_NOTE_ORGANIZE} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Link Notes</span>
              <span className="font-medium text-violet-600">{XpRewards.RICH_NOTE_LINK} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Favorite Note</span>
              <span className="font-medium text-violet-600">{XpRewards.RICH_NOTE_FAVORITE} XP</span>
            </div>
          </div>
        </div>

        {/* Habits Section */}
        <div className="bg-muted/30 rounded-xl p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            Habits & Consistency
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span>Habit Complete</span>
              <span className="font-medium text-purple-600">{XpRewards.HABIT_COMPLETE} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Perfect Habit Day</span>
              <span className="font-medium text-purple-600">{XpRewards.PERFECT_HABIT_DAY} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Weekly Consistency</span>
              <span className="font-medium text-purple-600">{XpRewards.WEEKLY_CONSISTENCY} XP</span>
            </div>
            <div className="flex justify-between">
              <span>Quest Complete</span>
              <span className="font-medium text-purple-600">{XpRewards.QUEST_COMPLETE} XP</span>
            </div>
          </div>
        </div>

        {/* Bonus Section */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-600" />
            Streak Bonuses
          </h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• <strong>Habit Streaks:</strong> +5 XP per consecutive day (max 30 days)</div>
            <div>• <strong>Trading Streaks:</strong> +15 XP per consecutive trading day</div>
            <div>• <strong>Reflection Streaks:</strong> +10 XP per consecutive day</div>
            <div>• <strong>Milestone Achievements:</strong> +200 XP for major accomplishments</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrestige = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
        <h3 className="text-xl font-bold text-foreground mb-2">Prestige System</h3>
        <p className="text-muted-foreground">
          Unlock prestigious status by reaching Level 30
        </p>
      </div>

      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20 mb-6">
        <h4 className="font-semibold mb-2">How Prestige Works</h4>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>1. <strong>Reach Level 30:</strong> Complete your first season</p>
          <p>2. <strong>Choose to Prestige:</strong> Reset to Level 1 with prestigious status</p>
          <p>3. <strong>Keep Achievements:</strong> Lifetime XP and accomplishments remain</p>
          <p>4. <strong>Show Mastery:</strong> Display exclusive prestige badges</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-4">Prestige Tiers</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(PRESTIGE_THEMES).map(([level, theme]) => (
            <div key={level} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <PrestigeIcon theme={theme} size="sm" />
              <div>
                <div className="font-medium text-sm">{theme.label}</div>
                <div className="text-xs text-muted-foreground">Prestige {level}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <PrestigeIcon theme={OBSIDIAN_THEME} size="sm" />
            <div>
              <div className="font-medium text-sm">{OBSIDIAN_THEME.label}</div>
              <div className="text-xs text-muted-foreground">Prestige 10+</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded-xl p-4">
        <h4 className="font-semibold mb-3">Prestige Benefits</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span><strong>Exclusive Badges:</strong> Show your prestigious status everywhere</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span><strong>Lifetime Stats:</strong> Keep all your achievements and total XP</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span><strong>Fresh Challenge:</strong> New goals and progression path</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span><strong>Community Recognition:</strong> Stand out as a dedicated trader</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderProgression = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <h3 className="text-xl font-bold text-foreground mb-2">Progression Timeline</h3>
        <p className="text-muted-foreground">
          Estimated time to reach Level 30 based on activity level
        </p>
      </div>

      <div className="grid gap-4">
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-600">Conservative Trader</h4>
            <span className="text-sm font-medium bg-blue-500/20 text-blue-600 px-2 py-1 rounded">~3.4 months</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• 5 trades per day (~200 XP)</div>
            <div>• Daily reflection (~75 XP)</div>
            <div>• 3 habits per day (~60 XP)</div>
            <div>• Weekly reviews (~20 XP/day)</div>
            <div className="font-medium pt-1">Total: ~450 XP/day</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-600">Active Trader</h4>
            <span className="text-sm font-medium bg-green-500/20 text-green-600 px-2 py-1 rounded">~2.4 months</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• 10 trades per day (~400 XP)</div>
            <div>• Daily reflection + notes (~100 XP)</div>
            <div>• 5 habits per day (~100 XP)</div>
            <div>• Consistent streaks (~50 XP)</div>
            <div className="font-medium pt-1">Total: ~650 XP/day</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-purple-600">Dedicated Trader</h4>
            <span className="text-sm font-medium bg-purple-500/20 text-purple-600 px-2 py-1 rounded">~1.7 months</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• 15+ trades per day (~600 XP)</div>
            <div>• Full reflection suite (~150 XP)</div>
            <div>• All habits + streaks (~150 XP)</div>
            <div>• Quests + milestones (~50 XP)</div>
            <div className="font-medium pt-1">Total: ~900 XP/day</div>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded-xl p-4">
        <h4 className="font-semibold mb-3">Tips for Faster Progression</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span><strong>Daily Consistency:</strong> Complete reflections and habits every day</span>
          </li>
          <li className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span><strong>Quality Trading:</strong> Focus on following your rules, not just volume</span>
          </li>
          <li className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span><strong>Document Everything:</strong> Journal entries and notes add up quickly</span>
          </li>
          <li className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span><strong>Build Streaks:</strong> Consecutive days multiply your XP gains</span>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">XP & Prestige System</h2>
                  <p className="text-sm text-muted-foreground">Level up your trading journey</p>
                </div>
              </div>
              <motion.button
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'rewards' && renderRewards()}
              {activeTab === 'prestige' && renderPrestige()}
              {activeTab === 'progression' && renderProgression()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
