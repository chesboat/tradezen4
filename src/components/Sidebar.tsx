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
  HelpCircle,
  Zap,
  FileText,
  Tag
} from 'lucide-react';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useQuickNoteModal } from '@/store/useQuickNoteStore';
import { useUserProfileStore, getUserDisplayName, getFormattedLevel } from '@/store/useUserProfileStore';
import { useQuestStore } from '@/store/useQuestStore';
import { cn } from '@/lib/utils';
import { AccountFilter } from './AccountFilter';
import { SearchBar } from './SearchBar';
import { Tooltip } from './ui/Tooltip';
import { ThemeToggle } from './ThemeToggle';
import { TagManager } from './TagManager';

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

const navItems: NavItem[] = [
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
  {
    id: 'journal',
    label: 'Journal',
    icon: BookOpen,
    href: '/journal',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
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
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // Refresh user stats when component mounts
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleQuickNote = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuickNote();
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
          'w-full flex items-center rounded-xl transition-colors duration-200 relative',
          isActive
            ? 'bg-primary text-primary-foreground hover:bg-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          isExpanded ? 'justify-start px-4 py-2.5 gap-3' : 'justify-center px-0 py-2.5'
        )}
        onClick={() => handleNavItemClick(item)}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-foreground' : 'text-foreground')} />
        {isExpanded && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="font-medium text-sm truncate">{item.label}</span>
            {item.badge && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </button>
    );

    if (!isExpanded) {
      return (
        <Tooltip content={item.label} position="right">
          {navItem}
        </Tooltip>
      );
    }

    return navItem;
  };

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 h-full bg-card border-r border-border z-50',
        'flex flex-col shadow-xl',
        className
      )}
      variants={sidebarVariants}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      initial={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              className="flex items-center gap-3"
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-card-foreground">TradZen</h1>
                <p className="text-xs text-muted-foreground">Trading Journal</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-2">
          {isExpanded && <ThemeToggle size="sm" />}
          
          <motion.button
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
            onClick={toggleSidebar}
            whileHover={hoverScale}
            whileTap={tapScale}
          >
            {isExpanded ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="p-4 border-b border-border"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <SearchBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Filter */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="p-4 border-b border-border"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <AccountFilter />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.id} item={item} isExpanded={isExpanded} />
        ))}
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

      {/* User Profile */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="p-4 border-t border-border"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">
                  {profile?.displayName || getUserDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile ? `Level ${profile.level} • ${profile.totalXP.toLocaleString()} XP` : getFormattedLevel()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                whileHover={hoverScale}
                whileTap={tapScale}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </motion.button>
              
              <motion.button
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                whileHover={hoverScale}
                whileTap={tapScale}
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Help</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed State Indicators */}
      {!isExpanded && (
        <div className="p-4 space-y-4">
          <Tooltip content="Theme" position="right">
            <div className="flex justify-center">
              <ThemeToggle size="sm" />
            </div>
          </Tooltip>
          
          <Tooltip content="Add Trade" position="right">
            <motion.button
              className="w-full flex items-center justify-center p-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              onClick={onAddTrade}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusCircle className="w-5 h-5" />
            </motion.button>
          </Tooltip>
          
          <Tooltip content="Quick Note" position="right">
            <motion.button
              className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              onClick={handleQuickNote}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="w-5 h-5" />
            </motion.button>
          </Tooltip>
          
          <Tooltip content="Manage Tags" position="right">
            <motion.button
              className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              onClick={() => setIsTagManagerOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Tag className="w-5 h-5" />
            </motion.button>
          </Tooltip>
          
          <Tooltip content="John Trader" position="right">
            <motion.button
              className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-accent transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <User className="w-5 h-5 text-muted-foreground" />
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