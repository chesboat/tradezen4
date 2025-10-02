import React, { useState, useMemo } from 'react';
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
  CheckSquare,
  LogOut,
  Zap,
  Plus
} from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUserProfileStore, getUserDisplayName } from '@/store/useUserProfileStore';
import { useAuth } from '@/contexts/AuthContext';
import { useDisciplineStore } from '@/store/useDisciplineStore';
import { todayInTZ } from '@/lib/time';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import toast from 'react-hot-toast';

interface AppleMobileNavProps {
  onAddTrade?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Bottom navigation (4 items + center button)
const bottomNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Today', icon: Home },
  { id: 'calendar', label: 'Journal', icon: Calendar },
  // Center + button handled separately
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'more', label: 'More', icon: Menu },
];

// "More" tab items
const moreTabItems: NavItem[] = [
  { id: 'trades', label: 'Trades', icon: TrendingUp },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'habits', label: 'Habits', icon: Target },
  { id: 'quests', label: 'Quests', icon: Trophy },
  { id: 'wellness', label: 'Wellness', icon: Heart },
  { id: 'todos', label: 'Todo List', icon: CheckSquare },
];

export const AppleMobileNav: React.FC<AppleMobileNavProps> = ({ onAddTrade }) => {
  const { currentView, setCurrentView } = useNavigationStore();
  const { profile } = useUserProfileStore();
  const { logout } = useAuth();
  const { disciplineEnabled, getDayByDate } = useDisciplineStore();
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Successfully logged out');
      setIsProfileSheetOpen(false);
    } catch (error) {
      toast.error('Failed to log out');
      console.error('Logout error:', error);
    }
  };

  // Calculate trades left for mobile badge
  const tradesLeft = useMemo(() => {
    if (!disciplineEnabled) return null;
    const tz = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayStr = todayInTZ(tz);
    const todayDay = getDayByDate(todayStr);
    if (!todayDay?.checkInAt) return null;
    const left = Math.max(0, (todayDay.maxTrades || 0) - (todayDay.usedTrades || 0));
    return { left, isMax: left === 0 };
  }, [disciplineEnabled, profile?.timezone, getDayByDate]);

  return (
    <>
      {/* Top Bar - Apple minimal style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo + Trades Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Refine</h1>
            
            {/* Trades Left Badge - iOS notification badge style */}
            {tradesLeft !== null && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-semibold",
                  tradesLeft.isMax 
                    ? "bg-red-500/15 text-red-500 border border-red-500/30" 
                    : "bg-primary/15 text-primary border border-primary/30"
                )}
              >
                {tradesLeft.left}
              </motion.div>
            )}
          </div>

          {/* Profile Avatar - opens bottom sheet */}
          <button
            onClick={() => setIsProfileSheetOpen(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden"
          >
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Bottom Navigation Bar - iOS style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className="flex flex-col items-center gap-1 px-4 py-2 min-w-[60px] transition-colors"
              >
                <Icon className={cn(
                  "w-6 h-6 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>{item.label}</span>
              </button>
            );
          })}

          {/* Center + Button - Prominent iOS style */}
          <button
            onClick={onAddTrade}
            className="flex flex-col items-center gap-1 px-4 py-2 min-w-[60px] -mt-2"
          >
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </button>

          {bottomNavItems.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className="flex flex-col items-center gap-1 px-4 py-2 min-w-[60px] transition-colors"
              >
                <Icon className={cn(
                  "w-6 h-6 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* "More" Tab Content - iOS Settings style */}
      {currentView === 'more' && (
        <div className="pt-16 pb-24 px-4">
          <div className="max-w-2xl mx-auto space-y-2">
            {moreTabItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as any)}
                  className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border active:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-base font-medium text-foreground">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile Bottom Sheet - iOS style */}
      <AnimatePresence>
        {isProfileSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileSheetOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-[70] max-h-[85vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted rounded-full" />
              </div>

              {/* Profile Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {profile?.displayName || getUserDisplayName()}
                    </h2>
                    {profile?.xp && (
                      <p className="text-sm text-muted-foreground">Level {profile.xp.level}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 space-y-2">
                <button
                  onClick={() => {
                    setCurrentView('settings');
                    setIsProfileSheetOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl active:bg-accent transition-colors"
                >
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="text-base text-foreground">Settings</span>
                </button>

                <div className="flex items-center justify-between p-4 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <ThemeToggle size="sm" />
                    </div>
                    <span className="text-base text-foreground">Theme</span>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-4 p-4 rounded-xl active:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-500" />
                  <span className="text-base text-red-500">Log Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

