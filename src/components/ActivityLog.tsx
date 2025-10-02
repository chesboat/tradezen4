import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FileEdit
} from 'lucide-react';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { ActivityLogEntry, ActivityType } from '@/types';
import { formatRelativeTime, getMoodEmoji } from '@/lib/localStorageUtils';
import { useScrollShadows } from '@/hooks/useScrollShadows';

interface ActivityLogProps {
  className?: string;
}

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
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
};

const activityColors: Record<ActivityType, string> = {
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

const ActivityItem: React.FC<{ activity: ActivityLogEntry; isExpanded: boolean }> = ({ 
  activity, 
  isExpanded 
}) => {
  const Icon = activityIcons[activity.type];
  const iconColor = activityColors[activity.type];

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

  return (
    <motion.div
      className="p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
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
  const { isExpanded, activities, toggleActivityLog, addActivity } = useActivityLogStore();
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleActivities, setVisibleActivities] = useState(20);

  // Initialize with some demo activities
  useEffect(() => {
    if (activities.length === 0) {
      const demoActivities = [
        {
          type: 'trade' as ActivityType,
          title: 'AAPL Long Position',
          description: 'Entered long position on AAPL at $150.25',
          xpEarned: 25,
          accountId: 'demo1',
        },
        {
          type: 'xp' as ActivityType,
          title: 'Quest Completed',
          description: 'Risk Master - Kept all trades under 2% risk',
          xpEarned: 50,
          accountId: 'demo1',
        },
        {
          type: 'note' as ActivityType,
          title: 'Market Observation',
          description: 'Strong breakout above resistance, good momentum',
          accountId: 'demo1',
        },
        {
          type: 'wellness' as ActivityType,
          title: 'Breathing Exercise',
          description: 'Completed 5-minute breathing exercise',
          xpEarned: 10,
          accountId: 'demo1',
        },
      ];

      demoActivities.forEach(activity => {
        addActivity(activity);
      });
    }
  }, [activities.length, addActivity]);

  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.type === filter
  ).slice(0, visibleActivities);

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
            <div className="p-4 space-y-2">
              <AnimatePresence mode="popLayout">
              {filteredActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActivityItem activity={activity} isExpanded={isExpanded} />
                </motion.div>
              ))}
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