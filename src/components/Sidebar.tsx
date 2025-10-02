import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Home, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Trophy,
  Heart,
  BarChart3,
  PlusCircle,
  User,

  Target,
  HelpCircle,
  Zap,
  FileText,
  Tag,
  MessageCircle,
  LogOut
} from 'lucide-react';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useQuickNoteModal } from '@/store/useQuickNoteStore';
import { useUserProfileStore, getUserDisplayName, getFormattedLevel } from '@/store/useUserProfileStore';
import { LevelBadge } from './xp/LevelBadge';
import { ProgressRing } from './xp/ProgressRing';
import { getLevelProgress } from '@/lib/xp/math';
import { FEATURE_XP_PRESTIGE } from '@/lib/xp/constants';
import { useQuestStore } from '@/store/useQuestStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AccountFilter } from './AccountFilter';
import { SearchBar } from './SearchBar';
import { Tooltip } from './ui/Tooltip';
import { ThemeToggle } from './ThemeToggle';
import { TagManager } from './TagManager';
import toast from 'react-hot-toast';
import { useScrollShadows } from '@/hooks/useScrollShadows';

interface SidebarProps {
  className?: string;
  onAddTrade?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string | number;
  onClick?: () => void;
}

// Apple-style grouped navigation
interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'TRADING',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        href: '/',
      },
      {
        id: 'calendar',
        label: 'Calendar',
        icon: Calendar,
        href: '/calendar',
      },
      {
        id: 'trades',
        label: 'Trades',
        icon: TrendingUp,
        href: '/trades',
      },
    ],
  },
  {
    title: 'ANALYSIS',
    items: [
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        href: '/analytics',
      },
      {
        id: 'journal',
        label: 'Journal',
        icon: BookOpen,
        href: '/journal',
      },
      {
        id: 'notes',
        label: 'Notes',
        icon: FileText,
        href: '/notes',
      },
    ],
  },
  {
    title: 'GROWTH',
    items: [
      {
        id: 'habits',
        label: 'Habits',
        icon: Target,
        href: '/habits',
      },
      {
        id: 'quests',
        label: 'Quests',
        icon: Trophy,
        href: '/quests',
      },
      {
        id: 'wellness',
        label: 'Wellness',
        icon: Heart,
        href: '/wellness',
      },
    ],
  },
];

const createVariants = (reduced: boolean) => {
  const baseDuration = reduced ? 0 : 0.25;
  return {
    sidebar: {
      expanded: {
        width: 280,
        transition: {
          duration: baseDuration,
          ease: [0.4, 0, 0.2, 1],
        },
      },
      collapsed: {
        width: 80,
        transition: {
          duration: baseDuration,
          ease: [0.4, 0, 0.2, 1],
        },
      },
    },
    content: {
      expanded: {
        opacity: 1,
        transition: {
          duration: baseDuration,
          delay: reduced ? 0 : 0.05,
        },
      },
      collapsed: {
        opacity: 0,
        transition: {
          duration: reduced ? 0 : 0.1,
        },
      },
    },
  };
};

export const Sidebar: React.FC<SidebarProps> = ({ className, onAddTrade }) => {
  const reducedMotion = useReducedMotion();
  const { sidebar: sidebarVariants, content: contentVariants } = React.useMemo(
    () => createVariants(!!reducedMotion),
    [reducedMotion]
  );
  const hoverScale = reducedMotion ? undefined : { scale: 1.02 };
  const tapScale = reducedMotion ? undefined : { scale: 0.98 };
  const { isExpanded, toggleSidebar } = useSidebarStore();
  const { currentView, setCurrentView } = useNavigationStore();
  const { openModal: openQuickNote } = useQuickNoteModal();
  const { profile, refreshStats } = useUserProfileStore();
  const navScroll = useScrollShadows<HTMLDivElement>();
  
  // Debug logging for sidebar progress updates
  React.useEffect(() => {
    if (profile?.xp) {
      console.log('📊 Sidebar Progress Update:', {
        seasonXp: profile.xp.seasonXp,
        level: profile.xp.level,
        progressPct: getLevelProgress(profile.xp.seasonXp)
      });
    }
  }, [profile?.xp?.seasonXp, profile?.xp?.level]);
  const { logout, currentUser } = useAuth();
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // Refresh user stats when component mounts
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleQuickNote = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuickNote();
  };

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Successfully logged out');
    } catch (error) {
      toast.error('Failed to log out');
      console.error('Logout error:', error);
    }
  };

  // Initialize with first available account if none selected
  useEffect(() => {
    // This effect will run when the component mounts
    // Account initialization is handled in the AccountFilter component
  }, []);

  const handleNavItemClick = (item: NavItem) => {
    setCurrentView(item.id as any);
    if (item.onClick) {
      item.onClick();
    }
  };

  const NavItem: React.FC<{ item: NavItem; isExpanded: boolean }> = ({ item, isExpanded }) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;

    const navItem = (
      <button
        className={cn(
          'w-full flex items-center rounded-lg transition-all duration-200 relative group',
          isActive
            ? 'bg-accent/50 text-foreground'
            : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground',
          isExpanded ? 'justify-start px-3 py-2 gap-3' : 'justify-center px-0 py-2'
        )}
        onClick={() => handleNavItemClick(item)}
      >
        {/* Apple-style left accent bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
        )}
        
        <Icon className={cn(
          'w-5 h-5 flex-shrink-0 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )} />
        
        {isExpanded && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className={cn(
              "font-medium text-sm truncate transition-colors",
              isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
            )}>
              {item.label}
            </span>
            {item.badge && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </button>
    );

    if (!isExpanded) {
      return (
        <Tooltip content={item.label} position="right" fullWidth>
          {navItem}
        </Tooltip>
      );
    }

    return navItem;
  };

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-background border-r border-border z-50',
        'flex flex-col shadow-xl overflow-hidden',
        className
      )}
      variants={sidebarVariants}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      initial={false}
    >
      {/* Header - Apple-style with consistent collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              className="flex items-center gap-2.5 flex-1"
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-foreground">Refine</h1>
              </div>
              {/* Theme Toggle - fixed position in header */}
              <ThemeToggle size="sm" />
            </motion.div>
          ) : (
            <div className="flex justify-center flex-1">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Collapse/Expand button - consistent with TodoDrawer/ActivityLog */}
        <Tooltip content={isExpanded ? "Collapse" : "Expand"} position="right">
          <motion.button
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            onClick={toggleSidebar}
            whileHover={hoverScale}
            whileTap={tapScale}
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </motion.button>
        </Tooltip>
      </div>

      {/* XP Progress - Subtle, Apple Fitness style */}
      <AnimatePresence mode="wait">
        {isExpanded && profile?.xp && (
          <motion.div
            className="px-4 py-3 border-b border-border/30"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <ProgressRing 
                  progressPct={getLevelProgress(profile.xp.seasonXp)}
                  size="sm"
                  thickness={2}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-primary leading-none">
                    {profile.xp.level}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  Level {profile.xp.level}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(profile.xp.seasonXp || 0).toLocaleString()} XP
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Filter */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="px-4 pt-3 pb-2"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <AccountFilter />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation - Apple-style grouped */}
      <nav 
        ref={navScroll.attach as any}
        className={cn(
          "flex-1 scrollable scroll-hint", 
          navScroll.hasTop && 'has-top',
          navScroll.hasBottom && 'has-bottom',
          !navScroll.hasOverflow && 'no-overflow'
        )}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--border)) transparent'
        }}
      >
        <div className={cn('px-4 py-2', isExpanded ? 'space-y-3' : 'space-y-4')}>
          {navGroups.map((group, groupIndex) => (
            <div key={group.title}>
              {/* Section Header - Only show when expanded */}
              {isExpanded && (
                <motion.div
                  className="px-3 mb-1.5"
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                >
                  <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    {group.title}
                  </h3>
                </motion.div>
              )}
              
              {/* Group Items */}
              <div className={cn(isExpanded ? 'space-y-0.5' : 'space-y-3')}>
                {group.items.map((item) => (
                  <div key={item.id} className={cn(!isExpanded && 'flex justify-center')}> 
                    <NavItem item={item} isExpanded={isExpanded} />
                  </div>
                ))}
              </div>

              {/* Divider between groups - subtle */}
              {groupIndex < navGroups.length - 1 && isExpanded && (
                <div className="mt-2.5 mb-0.5 mx-3 border-t border-border/30" />
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Quick Actions */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="p-4 border-t border-border"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div className="space-y-2">
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
                onClick={onAddTrade}
              >
                <PlusCircle className="w-5 h-5" />
                <span className="font-medium text-sm">Add Trade</span>
              </button>

              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors duration-200"
                onClick={() => {
                  // Navigate to Coach view
                  try {
                    useNavigationStore.getState().setCurrentView('coach');
                  } catch {}
                }}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium text-sm">Coach</span>
              </button>
              
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors duration-200"
                onClick={handleQuickNote}
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium text-sm">Quick Note</span>
              </button>
              
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors duration-200"
                onClick={() => setIsTagManagerOpen(true)}
              >
                <Tag className="w-5 h-5" />
                <span className="font-medium text-sm">Manage Tags</span>
              </button>
              

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile - Minimal Apple-style */}
      <div className="border-t border-border/50">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              className="p-3"
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              <div className="flex items-center gap-3">
                {/* Clean profile picture - no progress ring */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {profile?.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile?.displayName || getUserDisplayName()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip content="Settings" position="top">
                    <motion.button
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setCurrentView('settings')}
                      whileHover={hoverScale}
                      whileTap={tapScale}
                    >
                      <Settings className="w-4 h-4" />
                    </motion.button>
                  </Tooltip>
                  <Tooltip content="Logout" position="top">
                    <motion.button
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                      onClick={handleSignOut}
                      whileHover={hoverScale}
                      whileTap={tapScale}
                    >
                      <LogOut className="w-4 h-4" />
                    </motion.button>
                  </Tooltip>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="p-3 flex flex-col items-center gap-2">
              {/* Settings */}
              <Tooltip content="Settings" position="right">
                <motion.button
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setCurrentView('settings')}
                  whileHover={hoverScale}
                  whileTap={tapScale}
                >
                  <Settings className="w-4 h-4" />
                </motion.button>
              </Tooltip>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapsed State Indicators */}
      {!isExpanded && (
        <div className="p-4 space-y-4 overflow-y-auto flex-shrink-0">
          <Tooltip content="Add Trade" position="right" fullWidth>
            <motion.button
              className="w-full flex items-center justify-center p-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              onClick={onAddTrade}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusCircle className="w-5 h-5" />
            </motion.button>
          </Tooltip>
          
          <Tooltip content="Quick Note" position="right" fullWidth>
            <motion.button
              className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              onClick={handleQuickNote}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="w-5 h-5" />
            </motion.button>
          </Tooltip>
          
          <Tooltip content="Manage Tags" position="right" fullWidth>
            <motion.button
              className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              onClick={() => setIsTagManagerOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Tag className="w-5 h-5" />
            </motion.button>
          </Tooltip>
          
          
          <Tooltip content={
            profile?.xp 
              ? `${profile.displayName || getUserDisplayName()} - Level ${profile.xp.level}${profile.xp.prestige > 0 ? ` (${profile.xp.prestige} Prestige)` : ''}`
              : (profile?.displayName || getUserDisplayName())
          } position="right" fullWidth>
            <motion.button
              className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-accent transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
                            <div className="relative">
                <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-3 h-3 text-white" />
                  )}
                </div>
                {/* XP Progress Ring around avatar */}
                {FEATURE_XP_PRESTIGE && profile?.xp && (
                  <div className="absolute -inset-0.5">
                    <ProgressRing 
                      progressPct={getLevelProgress(profile.xp.seasonXp)}
                      size="sm"
                      thickness={1}
                    />
                  </div>
                )}
              </div>
            </motion.button>
          </Tooltip>
        </div>
      )}
      
      {/* Tag Manager Modal */}
      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
      />
    </motion.aside>
  );
}; 