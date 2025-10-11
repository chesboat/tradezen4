import React from 'react';
import { PublicSharePageClean as PublicSharePage } from './components/PublicSharePageClean';
import { PublicNoteView } from './components/PublicNoteView';
import { PublicTradeInsightView } from './components/PublicTradeInsightView';
import { StreakPreview } from './components/StreakPreview';
import { SettingsPage } from './components/SettingsPage';
import { Sidebar } from './components/Sidebar';
import { AppleMobileNav } from './components/AppleMobileNav';
import { ActivityLog } from './components/ActivityLog';

import { MinimalDashboard } from './components/MinimalDashboard';
import { AppleHabitTracker as HabitTracker } from './components/AppleHabitTracker';
import { CalendarView } from './components/CalendarView';
import { HomePage } from './components/marketing/HomePage';
import { FeaturesPage } from './components/marketing/FeaturesPage';
import { PricingPage as MarketingPricingPage } from './components/marketing/PricingPage';
import { PricingPage } from './components/PricingPage';
import { SubscriptionSuccess } from './components/SubscriptionSuccess';
import { SubscriptionCanceled } from './components/SubscriptionCanceled';
import { MarketingNav } from './components/marketing/MarketingNav';
import { QuestsView } from './components/QuestsView';
import { WellnessView } from './components/WellnessView';
import { TradesView } from './components/TradesView';
import { AppleAnalyticsDashboard } from './components/AppleAnalyticsDashboard';
import { CoachView } from './components/CoachView';
import { JournalViewApple as JournalView } from './components/JournalViewApple';
import { NotesView } from './components/NotesView';
import { TradeLoggerModalApple as TradeLoggerModal } from './components/TradeLoggerModalApple';
import { QuickNoteModal } from './components/QuickNoteModal';
import InsightHistoryView from './components/InsightHistoryView';
import HabitExperimentView from './components/HabitExperimentView';
import PremiumInsightsShowcase from './components/PremiumInsightsShowcase';
import { TradingHealthView } from './components/TradingHealthView';
import { CommandBar } from './components/CommandBar';
import { AuthPage } from './components/auth/AuthPage';
import { useSidebarStore } from './store/useSidebarStore';
import { useActivityLogStore } from './store/useActivityLogStore';
import { useNavigationStore } from './store/useNavigationStore';
import { initializeDefaultAccounts } from './store/useAccountFilterStore';
import { initializeDefaultQuests } from './store/useQuestStore';
import { useTheme } from './hooks/useTheme';
import { useAccentColor } from './hooks/useAccentColor';
import { useTradeLoggerModal } from './hooks/useTradeLoggerModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LevelUpToast } from './components/xp/LevelUpToast';
import { useXpRewards } from './hooks/useXpRewards';
import { StreakMilestoneCelebration } from './components/StreakMilestoneCelebration';
import { useStreakMilestoneStore } from './store/useStreakMilestoneStore';
import { initializeTradeStore } from './store/useTradeStore';
import { useUserProfileStore } from './store/useUserProfileStore';
import { initializeQuickNoteStore } from './store/useQuickNoteStore';
import { initializeRuleTallyStore } from './store/useRuleTallyStore';
import { useAccountFilterStore } from './store/useAccountFilterStore';
import { useTradeStore } from './store/useTradeStore';
import { CoachChat } from './components/CoachChat';
import { NudgeToast } from './components/NudgeToast';
import { TodoDrawer } from './components/TodoDrawer';
import { MobileTodoPage } from './components/MobileTodoPage';
import { TrialBanner } from './components/TrialBanner';
import { DataRetentionWarning } from './components/DataRetentionWarning';
import { UpgradeModal } from './components/UpgradeModal';
import { useTodoStore } from './store/useTodoStore';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from './lib/firebase';
import { checkAndAddWeeklyReviewTodo } from './lib/weeklyReviewTodo';
import { initializeWeeklyReviewStore } from './store/useWeeklyReviewStore';
import { useDailyReflectionStore } from './store/useDailyReflectionStore';
import { useSubscription } from './hooks/useSubscription';
import './lib/testMilestones'; // Load test utilities for development

function AppContent() {
  const { isExpanded: sidebarExpanded } = useSidebarStore();
  const { isExpanded: activityLogExpanded } = useActivityLogStore();
  const { currentView, setCurrentView } = useNavigationStore();
  const { theme } = useTheme();
  useAccentColor(); // Initialize accent color system
  const tradeLoggerModal = useTradeLoggerModal();
  const { currentUser, loading } = useAuth();
  const { initializeProfile } = useUserProfileStore();
  const { isExpanded: todoExpanded, railWidth } = useTodoStore();
  const { showLevelUpToast, levelUpData, closeLevelUpToast } = useXpRewards();
  const { currentMilestone, dismiss: dismissMilestone } = useStreakMilestoneStore();
  const { tier } = useSubscription();
  const { profile } = useUserProfileStore();

  // Marketing site state
  const [marketingPage, setMarketingPage] = React.useState<'home' | 'features' | 'pricing'>('home');
  const [showAuthPage, setShowAuthPage] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('signup');

  const [bootHydrating, setBootHydrating] = React.useState(false);
  const hydratingRef = React.useRef(false);
  const initializedUidRef = React.useRef<string | null>(null);
  const remoteExpectedRef = React.useRef(false);
  const [bootReloadTick, setBootReloadTick] = React.useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  // Periodic check for weekly review todo (every hour)
  React.useEffect(() => {
    if (!currentUser || loading) return;
    
    const checkWeeklyReviewTodo = async () => {
      try {
        await checkAndAddWeeklyReviewTodo();
      } catch (error) {
        console.error('Failed to check weekly review todo:', error);
      }
    };
    
    // Check immediately and then every hour
    checkWeeklyReviewTodo();
    const interval = setInterval(checkWeeklyReviewTodo, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(interval);
  }, [currentUser, loading]);

  // Cleanup on logout
  React.useEffect(() => {
    if (!loading && !currentUser) {
      // User logged out, cleanup all subscriptions
      console.log('User logged out, cleaning up activity log...');
      const activityLogStore = useActivityLogStore.getState();
      activityLogStore.cleanup();
    }
  }, [loading, currentUser]);

  // Initialize data when user is authenticated
  React.useEffect(() => {
    const initializeData = async () => {
      if (!loading && currentUser) {
        if (initializedUidRef.current === currentUser.uid && !hydratingRef.current) {
          return; // prevent duplicate init for same user
        }
        console.log('Starting app initialization for user:', currentUser.uid);
        try {
          setBootHydrating(true);
          hydratingRef.current = true;
          initializedUidRef.current = currentUser.uid;
          // For authenticated users, expect remote data by default (profile/accounts/trades/notes)
          remoteExpectedRef.current = true;
          // Absolute safety timer to avoid indefinite loader
          const abortTimer = setTimeout(() => {
            if (hydratingRef.current) {
              console.warn('Hydration abort timer fired');
              // Only release UI if we do NOT expect remote data
              if (!remoteExpectedRef.current) {
                console.warn('No remote data expected; releasing UI.');
                setBootHydrating(false);
                hydratingRef.current = false;
              } else {
                console.warn('Remote data expected; keeping loader visible and retrying.');
                // kick a retry
                setBootReloadTick((x) => x + 1);
              }
            }
          }, 15000);
          // Load profile first so other stores can rely on it
          await initializeProfile(currentUser.uid, currentUser.email || undefined);
          await initializeDefaultAccounts();
          await initializeDefaultQuests();
          await initializeTradeStore();
          await initializeRuleTallyStore();
          await initializeQuickNoteStore();
          // Start daily reflections real-time subscription
          try {
            const drStore = useDailyReflectionStore.getState();
            // Migrate legacy local data once, then subscribe
            await drStore.migrateLegacyLocalToFirestore?.();
            const unsub = drStore.subscribeRemote?.();
            (window as any).__dailyReflectionsUnsub = unsub;
          } catch (e) {
            console.warn('Failed to subscribe to daily reflections:', e);
          }
          
          // Initialize weekly review store with real-time Firebase subscription
          await initializeWeeklyReviewStore();
          
          // Initialize activity log with real-time Firebase subscription
          const activityLogStore = useActivityLogStore.getState();
          activityLogStore.initializeActivityLog(currentUser.uid);
          
          // Check for weekly review todo after all stores are initialized
          await checkAndAddWeeklyReviewTodo();
          console.log('App initialization completed successfully');

          // Verify remote presence and wait for subscriptions to populate stores
          try {
            const profileDoc = collection(db as any, `userProfiles`);
            const tradesCol = collection(db as any, `users/${currentUser.uid}/trades`);
            const accountsCol = collection(db as any, `users/${currentUser.uid}/tradingAccounts`);
            const quickNotesCol = collection(db as any, `users/${currentUser.uid}/quickNotes`);
            const [tradesSnap, accountsSnap, notesSnap] = await Promise.all([
              getDocs(query(tradesCol, limit(1))),
              getDocs(query(accountsCol, limit(1))),
              getDocs(query(quickNotesCol, limit(1)))
            ]);
            const remoteHasTrades = !tradesSnap.empty;
            const remoteHasAccounts = !accountsSnap.empty;
            const remoteHasNotes = !notesSnap.empty;
            // Treat existing user profile as signal via store state
            const hasProfile = !!useUserProfileStore.getState().profile;
            remoteExpectedRef.current = hasProfile || remoteHasAccounts || remoteHasTrades || remoteHasNotes;

            const waitUntil = async (predicate: () => boolean, ms: number, attempts: number) => {
              for (let i = 0; i < attempts; i++) {
                if (predicate()) return true;
                await new Promise((r) => setTimeout(r, ms));
              }
              return predicate();
            };

            const ok = await waitUntil(() => {
              const { accounts } = useAccountFilterStore.getState();
              const { trades } = useTradeStore.getState();
              if (remoteHasAccounts && (accounts?.length || 0) > 0) return true;
              if (remoteHasTrades && (trades?.length || 0) > 0) return true;
              if (!remoteHasAccounts && !remoteHasTrades) return true; // nothing remote to wait for
              return false;
            }, 150, 40); // up to ~6s

            if (!ok) {
              console.warn('Hydration verification timed out, retrying store initializers');
              await initializeDefaultAccounts();
              await initializeTradeStore();
            }
          } catch (e) {
            console.warn('Hydration verification failed (keeping loader):', e);
            // Keep loader instead of releasing UI on verification failure
            setBootHydrating(true);
            hydratingRef.current = true;
          } finally {
            if (!remoteExpectedRef.current) {
              setBootHydrating(false);
              hydratingRef.current = false;
            } else {
              // If remote expected, only release if stores are now populated
              const { accounts } = useAccountFilterStore.getState();
              const { trades } = useTradeStore.getState();
              const notesCount = (await import('./store/useQuickNoteStore')).useQuickNoteStore.getState().notes.length;
              const anyReadyFlag = (window as any).__accountsReady || (window as any).__tradesReady || (window as any).__notesReady;
              const ready = anyReadyFlag || (accounts?.length || 0) > 0 || (trades?.length || 0) > 0 || notesCount > 0;
              setBootHydrating(!ready);
              hydratingRef.current = !ready;
            }
            clearTimeout(abortTimer);
          }
        } catch (error) {
          console.error('Error during app initialization:', error);
          setBootHydrating(false);
          hydratingRef.current = false;
          initializedUidRef.current = null; // allow retry on next render
        }
      }
    };
    
    initializeData();
  }, [loading, currentUser, initializeProfile, bootReloadTick]);

  // Recovery: if user is present but stores are empty (e.g., after returning from /share demo), re-init
  React.useEffect(() => {
    if (!loading && currentUser) {
      const { accounts } = useAccountFilterStore.getState();
      const { trades } = useTradeStore.getState();
      if ((accounts?.length || 0) === 0 || (trades?.length || 0) === 0) {
        (async () => {
          try {
            await initializeDefaultAccounts();
            await initializeTradeStore();
            await initializeQuickNoteStore();
          } catch (e) {
            console.warn('Recovery initialization failed:', e);
          }
        })();
      }
    }
  }, [loading, currentUser]);

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <MinimalDashboard />;
      
      case 'health':
        return <TradingHealthView />;

      case 'habits':
        return <HabitTracker />;
      case 'calendar':
        return <CalendarView />;
      case 'trades':
        return <TradesView onOpenTradeModal={(trade) => {
          if (trade.id) {
            tradeLoggerModal.openForEdit(trade);
          } else {
            tradeLoggerModal.openForNew();
          }
        }} />;
      case 'journal':
        return <JournalView />;
      case 'notes':
        return <NotesView />;
      case 'analytics':
        return <AppleAnalyticsDashboard />;
      case 'quests':
        return <QuestsView />;
      case 'wellness':
        return <WellnessView />;
      case 'coach':
        return <CoachView />;
      case 'settings':
        return <SettingsPage />;
      case 'todos':
        return <MobileTodoPage />;
      case 'insights':
        return <PremiumInsightsShowcase />;
      case 'insight-history':
        return <InsightHistoryView />;
      case 'experiments':
        return <HabitExperimentView />;
      case 'pricing':
        return <PricingPage />;
      case 'subscription-success':
        return <SubscriptionSuccess />;
      case 'subscription-canceled':
        return <SubscriptionCanceled />;
      default:
        return <MinimalDashboard />;
    }
  };

  // Show Marketing Site for logged out users
  if (!currentUser) {
    if (showAuthPage) {
      return <AuthPage initialMode={authMode} onBack={() => setShowAuthPage(false)} />;
    }

    const renderMarketingPage = () => {
      switch (marketingPage) {
        case 'home':
          return (
            <HomePage
              onGetStarted={() => {
                setAuthMode('signup');
                setShowAuthPage(true);
              }}
              onViewPricing={() => setMarketingPage('pricing')}
            />
          );
        case 'features':
          return (
            <FeaturesPage
              onGetStarted={() => {
                setAuthMode('signup');
                setShowAuthPage(true);
              }}
            />
          );
        case 'pricing':
          return (
            <MarketingPricingPage
              onGetStarted={() => {
                setAuthMode('signup');
                setShowAuthPage(true);
              }}
            />
          );
      }
    };

    return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <MarketingNav
          onNavigate={setMarketingPage}
          onLogin={() => {
            setAuthMode('login');
            setShowAuthPage(true);
          }}
          onSignup={() => {
            setAuthMode('signup');
            setShowAuthPage(true);
          }}
          currentPage={marketingPage}
        />
        {renderMarketingPage()}
      </div>
    );
  }

  // Block UI until hydration completes to avoid flashing an empty dashboard when data exists remotely
  if (bootHydrating) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading your workspace…</span>
          </div>
          <button
            onClick={() => setBootReloadTick((x) => x + 1)}
            className="px-3 py-1.5 text-xs rounded bg-muted hover:bg-muted/80 text-foreground border border-border"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 🍎 APPLE-STYLE TRIAL-FIRST FLOW
  // Redirect new users to pricing page to start their free trial
  // This creates a clear path: Sign Up → Choose Plan → Start Trial → Explore App
  React.useEffect(() => {
    if (currentUser && profile) {
      // Check if user is brand new (no subscription info at all)
      const isNewUser = !profile.subscriptionTier && !profile.trialEndsAt && !profile.trialStartedAt;
      
      // Also redirect if they're on a special path (subscription success/canceled)
      const isSubscriptionPath = window.location.pathname.startsWith('/subscription/');
      
      if (isNewUser && !isSubscriptionPath && currentView !== 'pricing') {
        console.log('🎯 New user detected - redirecting to pricing for trial');
        setCurrentView('pricing');
      }
    }
  }, [currentUser, profile, currentView, setCurrentView]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Trial Banner */}
      <TrialBanner />
      
      {/* Data Retention Warning (Basic users) */}
      <DataRetentionWarning onUpgrade={() => setShowUpgradeModal(true)} />
      
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar onAddTrade={tradeLoggerModal.openForNew} />
      </div>
      
      {/* Mobile Navigation - Only visible on mobile */}
      <div className="lg:hidden">
        <AppleMobileNav onAddTrade={tradeLoggerModal.openForNew} />
      </div>
      
      {/* Main Content */}
      <main 
        className={`transition-all duration-300 ${
          // Desktop margins
          sidebarExpanded ? 'lg:ml-[280px]' : 'lg:ml-20'
        } ${
          // Mobile: full width with top/bottom padding for mobile nav
          'pt-16 pb-20 lg:pt-0 lg:pb-0'
        } ${
          // Desktop right margins - responsive
          activityLogExpanded && todoExpanded ? 'lg:mr-[480px]' :
          activityLogExpanded ? 'lg:mr-[380px]' :
          todoExpanded ? 'lg:mr-[460px]' : 'lg:mr-[120px]'
        }`}
      >
        {renderCurrentView()}
      </main>
      
      {/* Desktop Activity Log & Todo - Hidden on mobile */}
      <div className="hidden lg:block">
        <ActivityLog />
        <TodoDrawer />
      </div>
      
      {/* Trade Logger Modal */}
      <TradeLoggerModal
        isOpen={tradeLoggerModal.isOpen}
        onClose={tradeLoggerModal.closeModal}
        editingTrade={tradeLoggerModal.editingTrade}
      />
      
      {/* Quick Note Modal */}
      <QuickNoteModal />

      {/* Global Nudge Toast */}
      <NudgeToast />
      
      {/* Level Up Toast */}
      <LevelUpToast
        isVisible={showLevelUpToast}
        level={levelUpData?.level || 1}
        onClose={closeLevelUpToast}
      />
      
      {/* Streak Milestone Celebration - Apple-style */}
      <StreakMilestoneCelebration
        milestone={currentMilestone}
        onDismiss={dismissMilestone}
      />
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}

function App() {
  // Check for public share routes BEFORE rendering any app components/hooks
  if (typeof window !== 'undefined') {
    // Dev preview page for streak icons
    if (window.location.pathname === '/streak-preview') {
      return <StreakPreview />;
    }
    
    // Public share routes
    if (window.location.pathname.startsWith('/share/note/')) {
      return <PublicNoteView />;
    }
    if (window.location.pathname.startsWith('/share/insight/')) {
      return <PublicTradeInsightView />;
    }
    if (window.location.pathname.startsWith('/share/')) {
      return <PublicSharePage />;
    }
    
    // Subscription success/cancel routes (accessible without full auth)
    if (window.location.pathname.startsWith('/subscription/success')) {
      return (
        <AuthProvider>
          <SubscriptionSuccess />
        </AuthProvider>
      );
    }
    if (window.location.pathname.startsWith('/subscription/canceled')) {
      return (
        <AuthProvider>
          <SubscriptionCanceled />
        </AuthProvider>
      );
    }
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 