import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  TrendingUp, 
  BookOpen, 
  Trophy, 
  Heart, 
  Zap,
  Clock,
  Filter,
  MoreVertical,
  Edit,
  Target,
  FileText,
  CheckCircle2,
  FileEdit,
  AlertTriangle,
  Flame,
  Award,
  Lightbulb,
  BarChart3,
  Shield
} from 'lucide-react';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { ActivityLogEntry, ActivityType } from '@/types';
import { formatRelativeTime, getMoodEmoji } from '@/lib/localStorageUtils';
import { useScrollShadows } from '@/hooks/useScrollShadows';

interface ActivityLogProps {
  className?: string;
}

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  // Original types
  trade: TrendingUp,
  note: BookOpen,
  quest: Trophy,
  wellness: Heart,
  xp: Zap,
  reflection: Activity,
  journal: Edit,
  habit: Target,
  weekly_review: FileText,
  todo: CheckCircle2,
  rich_note: FileEdit,
  // Trading Health types
  ring_change: BarChart3,
  streak_event: Flame,
  rule_violation: AlertTriangle,
  health_suggestion: Lightbulb,
  health_warning: Shield,
  milestone: Award,
  daily_summary: Activity,
};

const activityColors: Record<ActivityType, string> = {
  // Original types
  trade: 'text-primary',
  note: 'text-yellow-500',
  quest: 'text-purple-500',
  wellness: 'text-green-500',
  xp: 'text-orange-500',
  reflection: 'text-blue-500',
  journal: 'text-indigo-500',
  habit: 'text-emerald-500',
  weekly_review: 'text-blue-600',
  todo: 'text-emerald-600',
  rich_note: 'text-violet-500',
  // Trading Health types
  ring_change: 'text-blue-500',
  streak_event: 'text-orange-500',
  rule_violation: 'text-yellow-500',
  health_suggestion: 'text-purple-500',
  health_warning: 'text-red-500',
  milestone: 'text-yellow-400',
  daily_summary: 'text-blue-600',
};

const sidebarVariants = {
  expanded: {
    width: 320,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  collapsed: {
    width: 60,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const contentVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      delay: 0.1,
      ease: 'easeOut',
    },
  },
  collapsed: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// Apple-style priority helpers
const getPriorityStyles = (priority?: string) => {
  switch (priority) {
    case 'critical':
      return {
        bg: 'bg-gradient-to-r from-red-500/10 to-red-600/5',
        border: 'border-l-4 border-red-500',
        glow: 'shadow-red-500/20',
      };
    case 'high':
      return {
        bg: 'bg-gradient-to-r from-orange-500/10 to-yellow-500/5',
        border: 'border-l-4 border-orange-500',
        glow: 'shadow-orange-500/20',
      };
    case 'medium':
      return {
        bg: 'bg-blue-500/5',
        border: 'border-l-2 border-blue-500/30',
        glow: '',
      };
    default: // routine
      return {
        bg: '',
        border: 'border-l border-border/20',
        glow: '',
      };
  }
};

// Smart time grouping (Apple Time Machine style)
const getTimeGroup = (date: string | Date): 'today' | 'yesterday' | 'thisWeek' | 'older' => {
  const activityDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - activityDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays <= 7) return 'thisWeek';
  return 'older';
};

const groupLabels = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'Earlier This Week',
  older: 'Last 30 Days',
};

// Priority-based sorting (critical > high > medium > routine, then by time)
const sortByPriority = (a: ActivityLogEntry, b: ActivityLogEntry) => {
  const priorityOrder = { critical: 0, high: 1, medium: 2, routine: 3 };
  const aPriority = priorityOrder[a.priority || 'routine'];
  const bPriority = priorityOrder[b.priority || 'routine'];
  
  if (aPriority !== bPriority) {
    return aPriority - bPriority;
  }
  
  // Same priority, sort by time (newest first)
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

// Apple-style celebration confetti
const triggerCelebration = (type: 'streak' | 'milestone') => {
  const colors = type === 'milestone' 
    ? ['#FFD700', '#FFA500', '#FF6B6B'] // Gold/Orange/Red for milestones
    : ['#FF375F', '#FF6B35', '#FFA500']; // Red/Orange for streaks

  // Burst from center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors,
    shapes: ['circle', 'square'],
    scalar: 1.2,
  });

  // Side bursts (Apple-style)
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });
  }, 150);
};

const ActivityItem: React.FC<{ activity: ActivityLogEntry; isExpanded: boolean }> = ({ 
  activity, 
  isExpanded 
}) => {
  const Icon = activityIcons[activity.type];
  const iconColor = activityColors[activity.type];
  const { setCurrentView } = useNavigationStore();

  // Handle activity click (deep link navigation)
  const handleActivityClick = () => {
    // Trigger celebration confetti for milestones and streaks
    if (activity.type === 'milestone' && activity.metadata?.isNewMilestone) {
      triggerCelebration('milestone');
    } else if (activity.type === 'streak_event' && activity.metadata?.isNewMilestone) {
      triggerCelebration('streak');
    }

    // Trading Health activities navigate to health view
    if (['ring_change', 'streak_event', 'rule_violation', 'health_suggestion', 'health_warning', 'milestone', 'daily_summary'].includes(activity.type)) {
      setCurrentView('health');
      return;
    }

    // Use metadata deep link if available
    if (activity.metadata?.deepLink) {
      const path = activity.metadata.deepLink;
      if (path === '/health') setCurrentView('health');
      else if (path === '/analytics') setCurrentView('analytics');
      else if (path === '/insights') setCurrentView('insights');
      // Add more as needed
      return;
    }

    // Default navigation based on type
    switch (activity.type) {
      case 'trade':
        setCurrentView('journal');
        break;
      case 'note':
      case 'rich_note':
        setCurrentView('notes');
        break;
      case 'quest':
        setCurrentView('quests');
        break;
      case 'wellness':
        setCurrentView('wellness');
        break;
      case 'weekly_review':
        setCurrentView('journal'); // Weekly reviews are part of journal
        break;
      case 'habit':
        setCurrentView('habits');
        break;
      case 'todo':
        setCurrentView('todos');
        break;
      default:
        break;
    }
  };

  if (!isExpanded) {
    return (
      <motion.div
        className="flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </motion.div>
    );
  }

  const priorityStyles = getPriorityStyles(activity.priority);

  return (
    <motion.div
      className={`p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group ${priorityStyles.bg} ${priorityStyles.border} ${priorityStyles.glow}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleActivityClick}
      layout
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-muted ${iconColor} flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-card-foreground truncate">
              {activity.title}
            </h4>
            {activity.xpEarned && (
              <div className="flex items-center gap-1 text-xs text-orange-500">
                <Zap className="w-3 h-3" />
                <span>+{activity.xpEarned}</span>
              </div>
            )}
          </div>
          
          {activity.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {activity.description}
            </p>
          )}
          
          {/* Show metadata for Trading Health items */}
          {activity.metadata?.trend && (
            <div className="flex items-center gap-1.5 mt-1">
              {activity.metadata.trend === 'improving' && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Improving
                </span>
              )}
              {activity.metadata.trend === 'declining' && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 rotate-180" /> Declining
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatRelativeTime(activity.createdAt)}</span>
            </div>
            
            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ActivityLog: React.FC<ActivityLogProps> = ({ className }) => {
  const { isExpanded, activities, toggleActivityLog, addActivity, clearActivities } = useActivityLogStore();
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleActivities, setVisibleActivities] = useState(20);

  // Initialize with demo activities (Apple-style showcase)
  useEffect(() => {
    if (activities.length === 0) {
      const now = new Date();
      const demoActivities = [
        // CRITICAL PRIORITY (Red) - Today
        {
          type: 'health_warning' as ActivityType,
          title: '🚨 Risk Control Declining',
          description: '80 → 65 (-15) in last 30 trades. Current drawdown: 18.5%',
          priority: 'critical' as const,
          accountId: 'demo1',
          metadata: {
            ringType: 'riskControl' as const,
            oldValue: 80,
            newValue: 65,
            trend: 'declining' as const,
            deepLink: '/health',
          },
          createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
        },
        // HIGH PRIORITY (Orange) - Today
        {
          type: 'health_suggestion' as ActivityType,
          title: '💡 New Suggestion For You',
          description: 'Stop Trading & Analyze - Your expectancy went negative',
          priority: 'high' as const,
          accountId: 'demo1',
          metadata: {
            suggestionType: 'stop_trading',
            actionable: true,
            deepLink: '/health',
          },
          createdAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
        },
        {
          type: 'ring_change' as ActivityType,
          title: '💰 Edge Improved',
          description: '45 → 52 (+7). Your expectancy improved to $9.50 per trade',
          priority: 'high' as const,
          accountId: 'demo1',
          metadata: {
            ringType: 'edge' as const,
            oldValue: 45,
            newValue: 52,
            trend: 'improving' as const,
            deepLink: '/health',
          },
          createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15 min ago
        },
        // HIGH PRIORITY - Yesterday
        {
          type: 'streak_event' as ActivityType,
          title: '🔥 3-Day Streak Started!',
          description: "You're following 80%+ of your rules. Next milestone: 7 days 🏆",
          priority: 'high' as const,
          accountId: 'demo1',
          metadata: {
            streakDays: 3,
            isNewMilestone: true,
            deepLink: '/health',
          },
          createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000), // Yesterday evening
        },
        {
          type: 'milestone' as ActivityType,
          title: '🏆 Milestone: 7-Day Streak!',
          description: 'Your longest streak yet. Keep it up!',
          priority: 'high' as const,
          xpEarned: 100,
          accountId: 'demo1',
          metadata: {
            streakDays: 7,
            isNewMilestone: true,
            deepLink: '/health',
          },
          createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000), // Yesterday morning
        },
        // MEDIUM PRIORITY (Blue) - Today
        {
          type: 'rule_violation' as ActivityType,
          title: '⚠️ Broke Risk Management Rule',
          description: 'Trade risked 3.5% (max: 2%)',
          priority: 'medium' as const,
          accountId: 'demo1',
          metadata: {
            ruleId: 'risk-management',
            ruleName: 'Keep risk under 2%',
            deepLink: '/health',
          },
          createdAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 min ago
        },
        // ROUTINE (Minimal) - Today
        {
          type: 'trade' as ActivityType,
          title: 'AAPL Long Position',
          description: 'Entered long position on AAPL at $150.25',
          priority: 'routine' as const,
          xpEarned: 25,
          accountId: 'demo1',
          createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
        },
        {
          type: 'note' as ActivityType,
          title: 'Market Observation',
          description: 'Strong breakout above resistance, good momentum',
          priority: 'routine' as const,
          accountId: 'demo1',
          createdAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        },
        {
          type: 'wellness' as ActivityType,
          title: 'Breathing Exercise',
          description: 'Completed 5-minute breathing exercise',
          priority: 'routine' as const,
          xpEarned: 10,
          accountId: 'demo1',
          createdAt: new Date(now.getTime() - 90 * 60 * 1000), // 1.5 hours ago
        },
        // DAILY SUMMARY - Yesterday morning
        {
          type: 'daily_summary' as ActivityType,
          title: "📊 Yesterday's Trading Health",
          description: 'Edge: 52/80 (↗ +3) • Consistency: 68/80 (→) • Risk: 80/80 (✓)',
          priority: 'high' as const,
          accountId: 'demo1',
          metadata: {
            deepLink: '/health',
          },
          createdAt: new Date(now.getTime() - 32 * 60 * 60 * 1000), // Yesterday 8 AM
        },
      ];

      demoActivities.forEach(activity => {
        addActivity(activity);
      });
    }
  }, [activities.length, addActivity]);

  // Filter and sort activities (Apple-style: priority first, then time)
  const filteredActivities = activities
    .filter(activity => filter === 'all' || activity.type === filter)
    .sort(sortByPriority)
    .slice(0, visibleActivities);

  // Group activities by time (Apple Time Machine style)
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const timeGroup = getTimeGroup(activity.createdAt);
    if (!groups[timeGroup]) {
      groups[timeGroup] = [];
    }
    groups[timeGroup].push(activity);
    return groups;
  }, {} as Record<string, ActivityLogEntry[]>);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      
      if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoadingMore) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleActivities(prev => prev + 10);
          setIsLoadingMore(false);
        }, 500);
      }
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [isLoadingMore]);

  const filterOptions = [
    { value: 'all', label: 'All', icon: Activity },
    { value: 'trade', label: 'Trades', icon: TrendingUp },
    { value: 'note', label: 'Notes', icon: BookOpen },
    { value: 'rich_note', label: 'Rich Notes', icon: FileEdit },
    { value: 'quest', label: 'Quests', icon: Trophy },
    { value: 'wellness', label: 'Wellness', icon: Heart },
    { value: 'xp', label: 'XP', icon: Zap },
    { value: 'weekly_review', label: 'Reviews', icon: FileText },
    { value: 'todo', label: 'Tasks', icon: CheckCircle2 },
  ];

  return (
    <motion.aside
      className={`fixed right-0 top-0 h-full bg-background border-l border-border z-40 flex flex-col shadow-xl ${className}`}
      variants={sidebarVariants}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      initial={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <motion.button
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          onClick={toggleActivityLog}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </motion.button>

        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              className="flex items-center gap-3"
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-card-foreground">Activity</h2>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-primary rounded-full">
                <span className="text-xs font-medium text-primary-foreground">
                  {activities.length}
                </span>
              </div>
              {/* Demo Reset Button (for testing new design) */}
              <motion.button
                onClick={() => {
                  clearActivities();
                  window.location.reload();
                }}
                className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted-foreground/20 text-muted-foreground transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Reset to demo activities to see new Trading Health design"
              >
                Reset Demo
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="p-4 border-b border-border"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.value}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === option.value 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => setFilter(option.value as ActivityType | 'all')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{option.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Feed - Only when expanded */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          <ScrollableSectionWithShadows refObj={scrollContainerRef} padding="p-0">
            <div className="p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {/* Render grouped activities (Apple Time Machine style) */}
                {(['today', 'yesterday', 'thisWeek', 'older'] as const).map((timeGroup) => {
                  const groupActivities = groupedActivities[timeGroup];
                  if (!groupActivities || groupActivities.length === 0) return null;

                  return (
                    <motion.div
                      key={timeGroup}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-2"
                    >
                      {/* Group Header */}
                      <div className="flex items-center gap-2 px-2 pt-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {groupLabels[timeGroup]}
                        </h3>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      {/* Group Activities */}
                      <div className="space-y-2">
                        {groupActivities.map((activity) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ActivityItem activity={activity} isExpanded={isExpanded} />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {filteredActivities.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start trading to see your activity here
                  </p>
                </div>
              )}
            </div>
          </ScrollableSectionWithShadows>
        </div>
      )}

      {/* Collapsed State - Only when collapsed */}
      {!isExpanded && (
        <div className="flex-1 overflow-hidden">
          <ScrollableSectionWithShadows padding="p-0">
            <div className="p-2 space-y-2">
            {filteredActivities.slice(0, 10).map((activity) => (
              <ActivityItem key={activity.id} activity={activity} isExpanded={false} />
            ))}
            
            {filteredActivities.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="w-6 h-6 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No activity</p>
              </div>
            )}
            </div>
          </ScrollableSectionWithShadows>
        </div>
      )}
    </motion.aside>
  );
}; 

const ScrollableSectionWithShadows: React.FC<{ refObj?: React.RefObject<HTMLDivElement>; padding?: string; children: React.ReactNode }>
  = ({ refObj, padding = 'p-0', children }) => {
  const { attach, hasTop, hasBottom, hasOverflow } = useScrollShadows<HTMLDivElement>();
  return (
    <div
      ref={(el) => {
        if (refObj) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          refObj.current = el;
        }
        attach(el);
      }}
      className={`h-full ${padding} space-y-2 scrollable scroll-hint ${hasTop ? 'has-top' : ''} ${hasBottom ? 'has-bottom' : ''} ${!hasOverflow ? 'no-overflow' : ''}`}
    >
      {children}
    </div>
  );
};