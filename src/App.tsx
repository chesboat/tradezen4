import React from 'react';
import { PublicSharePageClean as PublicSharePage } from './components/PublicSharePageClean';
import { PublicNoteView } from './components/PublicNoteView';
import { PublicTradeInsightView } from './components/PublicTradeInsightView';
import { StreakPreview } from './components/StreakPreview';
import { SettingsPage } from './components/SettingsPage';
import { SupportPage } from './components/SupportPage';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsOfService } from './components/legal/TermsOfService';
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
import { WelcomeFlow } from './components/WelcomeFlow';
import { SubscriptionSuccess } from './components/SubscriptionSuccess';
import { SubscriptionCanceled } from './components/SubscriptionCanceled';
import { MarketingNav } from './components/marketing/MarketingNav';
import { QuestsView } from './components/QuestsView';
import { WellnessView } from './components/WellnessView';
import { TradesView } from './components/TradesView';
import { AppleAnalyticsDashboard } from './components/AppleAnalyticsDashboard';
import { ClassificationAnalyticsPage } from './components/ClassificationAnalytics';
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
import { useAccentColor, accentColorPalettes } from './hooks/useAccentColor';
import { useStyleTheme, styleThemes } from './hooks/useStyleTheme';
import { useCustomColors } from './hooks/useCustomColors';
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
import { useClassificationStore } from './store/useClassificationStore';
import { CoachChat } from './components/CoachChat';
import { NudgeToast } from './components/NudgeToast';
import { TodoDrawer } from './components/TodoDrawer';
import { MobileTodoPage } from './components/MobileTodoPage';
import { TrialBanner } from './components/TrialBanner';
import { DataRetentionWarning } from './components/DataRetentionWarning';
import { UpgradeModal } from './components/UpgradeModal';
import { WelcomeToPremium } from './components/WelcomeToPremium';
import { ExpiredSubscriptionModal } from './components/ExpiredSubscriptionModal';
import { useTodoStore } from './store/useTodoStore';
import { checkAndAddWeeklyReviewTodo } from './lib/weeklyReviewTodo';
import { initializeWeeklyReviewStore } from './store/useWeeklyReviewStore';
import { useDailyReflectionStore } from './store/useDailyReflectionStore';
import { useSubscription } from './hooks/useSubscription';
import './lib/testMilestones'; // Load test utilities for development

function AppContent() {
  const { currentUser, loading } = useAuth();
  const { isExpanded: sidebarExpanded } = useSidebarStore();
  const { isExpanded: activityLogExpanded } = useActivityLogStore();
  const { currentView, setCurrentView } = useNavigationStore();
  const { theme } = useTheme();
  useAccentColor(); // Initialize accent color system
  useStyleTheme(); // Initialize style theme system
  useCustomColors(); // Initialize custom colors system
  const tradeLoggerModal = useTradeLoggerModal();
  const { initializeProfile } = useUserProfileStore();
  const { isExpanded: todoExpanded, railWidth } = useTodoStore();
  const { showLevelUpToast, levelUpData, closeLevelUpToast } = useXpRewards();
  const { currentMilestone, dismiss: dismissMilestone } = useStreakMilestoneStore();
  const { tier, hasAccess, isExpired } = useSubscription();
  const { profile } = useUserProfileStore();
  
  // Apply theme settings when profile loads (fallback for hooks)
  const profilePrefsRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!profile?.preferences) return;
    
    const currentPrefsJson = JSON.stringify(profile.preferences);
    if (profilePrefsRef.current === currentPrefsJson) return;
    profilePrefsRef.current = currentPrefsJson;
    
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    
    // Apply accent color
    const accentColor = profile.preferences.accentColor;
    if (accentColor && accentColorPalettes[accentColor]) {
      const palette = accentColorPalettes[accentColor];
      const colors = isDark ? palette.dark : palette.light;
      root.setAttribute('data-accent', accentColor);
      root.style.setProperty('--primary', colors.primary, 'important');
      root.style.setProperty('--primary-foreground', colors.primaryForeground, 'important');
      root.style.setProperty('--ring', colors.ring, 'important');
    }
    
    // Apply style theme
    const styleTheme = profile.preferences.styleTheme;
    if (styleTheme && styleThemes[styleTheme]) {
      const config = styleThemes[styleTheme];
      Object.keys(styleThemes).forEach((key) => {
        root.classList.remove(`style-${key}`);
      });
      root.classList.add(`style-${styleTheme}`);
      root.style.setProperty('--font-primary', config.fontFamily);
      root.style.setProperty('--font-mono', config.fontFamilyMono);
    }
  }, [profile?.preferences]);

  // Marketing site state
  const [marketingPage, setMarketingPage] = React.useState<'home' | 'features' | 'pricing'>('home');
  const [showAuthPage, setShowAuthPage] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('signup');

  const [bootHydrating, setBootHydrating] = React.useState(false);
  const hydratingRef = React.useRef(false);
  const initializedUidRef = React.useRef<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  
  // 🍎 APPLE WAY: Show expired subscription modal
  const [showExpiredModal, setShowExpiredModal] = React.useState(false);

  // Check for expired subscriptions
  React.useEffect(() => {
    if (!loading && currentUser && !hasAccess && isExpired) {
      setShowExpiredModal(true);
    } else if (hasAccess) {
      setShowExpiredModal(false);
    }
  }, [loading, currentUser, hasAccess, isExpired]);

  // Note: hard guard moved to AppWithPricingCheck to avoid render timing issues

  // 🍎 APPLE WAY: Force light mode for marketing pages (logged out users)
  React.useEffect(() => {
    if (!loading) {
      const root = document.documentElement;
      if (!currentUser) {
        // Marketing pages: force light mode
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        // Logged in: use saved theme or system preference
        const savedTheme = localStorage.getItem('tradzen-theme');
        if (savedTheme) {
          root.classList.remove('light', 'dark');
          root.classList.add(savedTheme);
        } else {
          // First-time: respect system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.remove('light', 'dark');
          root.classList.add(prefersDark ? 'dark' : 'light');
        }
      }
    }
  }, [currentUser, loading]);

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
      const activityLogStore = useActivityLogStore.getState();
      activityLogStore.cleanup();
    }
  }, [loading, currentUser]);

  // Initialize data when user is authenticated - FAST & RESILIENT
  React.useEffect(() => {
    const initializeData = async () => {
      if (!loading && currentUser) {
        // Skip initialization if user needs to see pricing first
        if (sessionStorage.getItem('show_pricing_after_auth') === 'true') {
          return;
        }
        
        // Prevent duplicate init for same user
        if (initializedUidRef.current === currentUser.uid && !hydratingRef.current) {
          return;
        }
        
        initializedUidRef.current = currentUser.uid;
        setBootHydrating(true);
        hydratingRef.current = true;
        
        // HARD TIMEOUT: Always release UI after 5 seconds no matter what
        const hardTimeout = setTimeout(() => {
          if (hydratingRef.current) {
            console.warn('Hard timeout reached - releasing UI');
            setBootHydrating(false);
            hydratingRef.current = false;
          }
        }, 5000);
        
        try {
          // Initialize critical stores in parallel for speed
          await Promise.all([
            initializeProfile(currentUser.uid, currentUser.email || undefined),
            initializeDefaultAccounts(),
            initializeTradeStore(),
          ]);
          
          // Initialize secondary stores (can fail without breaking UI)
          await Promise.allSettled([
            initializeDefaultQuests(),
            initializeRuleTallyStore(),
            initializeQuickNoteStore(),
            useClassificationStore.getState().initialize(currentUser.uid),
            initializeWeeklyReviewStore(),
          ]);
          
          // Initialize subscriptions (non-blocking)
          try {
            const drStore = useDailyReflectionStore.getState();
            await drStore.migrateLegacyLocalToFirestore?.();
            const unsub = drStore.subscribeRemote?.();
            (window as any).__dailyReflectionsUnsub = unsub;
          } catch (e) {
            // Non-critical, continue
          }
          
          // Initialize activity log
          try {
            const activityLogStore = useActivityLogStore.getState();
            activityLogStore.initializeActivityLog(currentUser.uid);
          } catch (e) {
            // Non-critical, continue
          }
          
          // Check weekly review (non-blocking)
          checkAndAddWeeklyReviewTodo().catch(() => {});
          
        } catch (error) {
          console.error('Error during app initialization:', error);
          // Still allow app to render - user can retry actions manually
        } finally {
          clearTimeout(hardTimeout);
          setBootHydrating(false);
          hydratingRef.current = false;
        }
      }
    };
    
    initializeData();
  }, [loading, currentUser, initializeProfile]);

  // Recovery: if stores are empty after returning from public pages, re-init
  React.useEffect(() => {
    if (!loading && currentUser && !bootHydrating) {
      const { accounts } = useAccountFilterStore.getState();
      const { trades } = useTradeStore.getState();
      if ((accounts?.length || 0) === 0 && (trades?.length || 0) === 0) {
        Promise.all([
          initializeDefaultAccounts(),
          initializeTradeStore(),
          initializeQuickNoteStore(),
        ]).catch(() => {});
      }
    }
  }, [loading, currentUser, bootHydrating]);

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
      case 'statistics':
        return <ClassificationAnalyticsPage onManageCategories={() => setCurrentView('settings')} />;
      case 'quests':
        return <QuestsView />;
      case 'wellness':
        return <WellnessView />;
      case 'coach':
        return <CoachView />;
      case 'settings':
        return <SettingsPage />;
      case 'support':
        return <SupportPage />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsOfService />;
      case 'todos':
        return <MobileTodoPage />;
      case 'insights':
        return <PremiumInsightsShowcase />;
      case 'insight-history':
        return <InsightHistoryView />;
      case 'experiments':
        return <HabitExperimentView />;
      case 'pricing':
        try {
          return <PricingPage />;
        } catch (error) {
          console.error('Error rendering pricing page:', error);
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-4">Loading pricing...</h2>
                <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-primary text-white rounded">
                  Go to Dashboard
                </button>
              </div>
            </div>
          );
        }
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

  // Brief loading indicator while critical stores initialize
  if (bootHydrating) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Pricing check moved to top of AppContent for early return

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Trial Banner - TEMPORARILY DISABLED */}
      {/* <TrialBanner /> */}
      
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
      
      {/* 🍎 APPLE WAY: Expired Subscription Modal */}
      <ExpiredSubscriptionModal
        isOpen={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
      />
    </div>
  );
}

// Wrapper to check for new signup before loading AppContent
function AppWithPricingCheck() {
  const { currentUser, loading } = useAuth();
  const { hasAccess } = useSubscription();
  const [showWelcome, setShowWelcome] = React.useState(false);
  const clearedRef = React.useRef(false);
  
  // Clear transient pricing flags once we confirm access to avoid sticky redirects
  React.useEffect(() => {
    if (!loading && currentUser && hasAccess && !clearedRef.current) {
      try {
        sessionStorage.removeItem('show_pricing_after_auth');
        // Optionally also clear welcome flag if pricing shouldn't show again
        // sessionStorage.removeItem('has_seen_welcome_flow');
        clearedRef.current = true;
      } catch {}
    }
  }, [loading, currentUser, hasAccess]);
  
  // Check if user is in signup flow
  React.useEffect(() => {
    if (!loading && currentUser && sessionStorage.getItem('show_pricing_after_auth') === 'true') {
      const hasSeenWelcome = sessionStorage.getItem('has_seen_welcome_flow') === 'true';
      setShowWelcome(!hasSeenWelcome);
    }
  }, [loading, currentUser]);
  
  // Block app when user is logged in but has no access
  if (!loading && currentUser && hasAccess === false) {
    return <PricingPage />;
  }

  // Show Welcome Flow first for new signups
  if (!loading && currentUser && sessionStorage.getItem('show_pricing_after_auth') === 'true') {
    const hasSeenWelcome = sessionStorage.getItem('has_seen_welcome_flow') === 'true';
    
    if (!hasSeenWelcome) {
      return (
        <WelcomeFlow 
          onComplete={() => {
            sessionStorage.setItem('has_seen_welcome_flow', 'true');
            setShowWelcome(false);
          }} 
        />
      );
    }
    
    // Welcome flow complete, show pricing
    return <PricingPage />;
  }
  
  // Normal app flow
  return <AppContent />;
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
      <AppWithPricingCheck />
    </AuthProvider>
  );
}

export default App; 