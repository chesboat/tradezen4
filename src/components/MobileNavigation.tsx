import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Settings, 
  Trophy,
  Heart,
  BarChart3,
  PlusCircle,
  User,
  Target,
  FileText,
  Menu,
  X,
  MessageCircle,
  Tag,
  LogOut,
  Zap,
  CheckSquare
} from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useQuickNoteModal } from '@/store/useQuickNoteStore';
import { useUserProfileStore, getUserDisplayName } from '@/store/useUserProfileStore';
import { useTodoStore } from '@/store/useTodoStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AccountFilter } from './AccountFilter';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { TagManager } from './TagManager';
import toast from 'react-hot-toast';

interface MobileNavigationProps {
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
  },
  {
    id: 'habits',
    label: 'Habits',
    icon: Target,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
  },
  {
    id: 'trades',
    label: 'Trades',
    icon: TrendingUp,
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: BookOpen,
  },
];

// Additional nav items for the drawer
const additionalNavItems: NavItem[] = [
  {
    id: 'notes',
    label: 'Notes',
    icon: FileText,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    id: 'quests',
    label: 'Quests',
    icon: Trophy,
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: Heart,
  },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ onAddTrade }) => {
  const { currentView, setCurrentView } = useNavigationStore();
  const { openModal: openQuickNote } = useQuickNoteModal();
  const { profile } = useUserProfileStore();
  const { tasks, toggleDrawer } = useTodoStore();
  const { logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  
  // Count open tasks for badge
  const openTasksCount = tasks.filter(task => task.status === 'open').length;

  const handleNavItemClick = (item: NavItem) => {
    setCurrentView(item.id as any);
    setIsDrawerOpen(false);
    if (item.onClick) {
      item.onClick();
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Successfully logged out');
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error('Failed to log out');
      console.error('Logout error:', error);
    }
  };

  const handleQuickNote = () => {
    openQuickNote();
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-card-foreground">TradeFutura</h1>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <motion.button
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              onClick={() => setIsDrawerOpen(true)}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <motion.button
                key={item.id}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                onClick={() => handleNavItemClick(item)}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l border-border z-50 flex flex-col shadow-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 300,
                mass: 0.8
              }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground">Menu</h2>
                  </div>
                </div>
                <motion.button
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                  onClick={() => setIsDrawerOpen(false)}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Search & Account Filter */}
              <div className="p-4 space-y-4 border-b border-border">
                <SearchBar />
                <AccountFilter />
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                <div className="space-y-1">
                  {/* Main nav items */}
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    
                    return (
                      <motion.button
                        key={item.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                        onClick={() => handleNavItemClick(item)}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </motion.button>
                    );
                  })}

                  {/* Divider */}
                  <div className="my-4 border-t border-border" />

                  {/* Additional nav items */}
                  {additionalNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    
                    return (
                      <motion.button
                        key={item.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                        onClick={() => handleNavItemClick(item)}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-t border-border">
                <div className="space-y-2">
                  <motion.button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                    onClick={() => {
                      onAddTrade?.();
                      setIsDrawerOpen(false);
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span className="font-medium text-sm">Add Trade</span>
                  </motion.button>

                  <motion.button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      setCurrentView('coach');
                      setIsDrawerOpen(false);
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium text-sm">Coach</span>
                  </motion.button>
                  
                  <motion.button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                    onClick={handleQuickNote}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium text-sm">Quick Note</span>
                  </motion.button>
                  
                  <motion.button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                    onClick={() => setIsTagManagerOpen(true)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Tag className="w-5 h-5" />
                    <span className="font-medium text-sm">Manage Tags</span>
                  </motion.button>
                  
                  <motion.button
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      toggleDrawer();
                      setIsDrawerOpen(false);
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <CheckSquare className="w-5 h-5" />
                      <span className="font-medium text-sm">Todo List</span>
                    </div>
                    {openTasksCount > 0 && (
                      <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                        {openTasksCount}
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* User Profile */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center overflow-hidden">
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">
                      {profile?.displayName || getUserDisplayName()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile ? `Level ${profile.level} • ${profile.totalXP.toLocaleString()} XP` : 'Level 1'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      setCurrentView('settings');
                      setIsDrawerOpen(false);
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </motion.button>
                  
                  <motion.button
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    onClick={handleSignOut}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tag Manager Modal */}
      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
      />
    </>
  );
};
