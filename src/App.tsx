import React from 'react';
import { PublicSharePage } from './components/PublicSharePage';
import { SettingsPage } from './components/SettingsPage';
import { Sidebar } from './components/Sidebar';
import { ActivityLog } from './components/ActivityLog';

import { MinimalDashboard } from './components/MinimalDashboard';
import { MinimalHabitTracker } from './components/MinimalHabitTracker';
import { CalendarView } from './components/CalendarView';
import { QuestsView } from './components/QuestsView';
import { WellnessView } from './components/WellnessView';
import { TradesView } from './components/TradesView';
import { CleanAnalyticsDashboard } from './components/CleanAnalyticsDashboard';
import { CoachView } from './components/CoachView';
import { JournalView } from './components/JournalView';
import { NotesView } from './components/NotesView';
import { TradeLoggerModal } from './components/TradeLoggerModal';
import { QuickNoteModal } from './components/QuickNoteModal';
import { CommandBar } from './components/CommandBar';
import { AuthPage } from './components/auth/AuthPage';
import { useSidebarStore } from './store/useSidebarStore';
import { useActivityLogStore } from './store/useActivityLogStore';
import { useNavigationStore } from './store/useNavigationStore';
import { initializeDefaultAccounts } from './store/useAccountFilterStore';
import { initializeDefaultQuests } from './store/useQuestStore';
import { useTheme } from './hooks/useTheme';
import { useTradeLoggerModal } from './hooks/useTradeLoggerModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initializeTradeStore } from './store/useTradeStore';
import { useUserProfileStore } from './store/useUserProfileStore';
import { initializeQuickNoteStore } from './store/useQuickNoteStore';
import { initializeRuleTallyStore } from './store/useRuleTallyStore';
import { CoachChat } from './components/CoachChat';
import { NudgeToast } from './components/NudgeToast';
import { TodoDrawer } from './components/TodoDrawer';
import { useTodoStore } from './store/useTodoStore';

function AppContent() {
  const { isExpanded: sidebarExpanded } = useSidebarStore();
  const { isExpanded: activityLogExpanded } = useActivityLogStore();
  const { currentView } = useNavigationStore();
  const { theme } = useTheme();
  const tradeLoggerModal = useTradeLoggerModal();
  const { currentUser } = useAuth();
  const { initializeProfile } = useUserProfileStore();
  const { isExpanded: todoExpanded, railWidth } = useTodoStore();

  // Initialize data when user is authenticated
  React.useEffect(() => {
    const initializeData = async () => {
      if (currentUser) {
        console.log('Starting app initialization for user:', currentUser.uid);
        try {
          await initializeDefaultAccounts();
          await initializeDefaultQuests();
          await initializeTradeStore();
          await initializeRuleTallyStore();
          await initializeProfile(currentUser.uid, currentUser.email || undefined);
          await initializeQuickNoteStore();
          console.log('App initialization completed successfully');
        } catch (error) {
          console.error('Error during app initialization:', error);
        }
      }
    };
    
    initializeData();
  }, [currentUser, initializeProfile]);

  // If visiting a public share link, bypass auth gating entirely
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/share/')) {
    return <PublicSharePage />;
  }

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <MinimalDashboard />;

      case 'habits':
        return <MinimalHabitTracker />;
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
        return <CleanAnalyticsDashboard />;
      case 'quests':
        return <QuestsView />;
      case 'wellness':
        return <WellnessView />;
      case 'coach':
        return <CoachView />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <MinimalDashboard />;
    }
  };

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar onAddTrade={tradeLoggerModal.openForNew} />
      
      {/* Main Content */}
      <main 
        className={`transition-all duration-300 ${
          sidebarExpanded ? 'ml-[280px]' : 'ml-20'
        }`}
        style={{
          marginRight: (activityLogExpanded ? 320 : 60) + (todoExpanded ? 0 : 60) + 10,
        }}
      >
        {renderCurrentView()}
      </main>
      
      {/* Activity Log */}
      <ActivityLog />
      {/* Improvement Tasks Drawer */}
      <TodoDrawer />
      
      {/* Trade Logger Modal */}
      <TradeLoggerModal
        isOpen={tradeLoggerModal.isOpen}
        onClose={tradeLoggerModal.closeModal}
        editingTrade={tradeLoggerModal.editingTrade}
      />
      
      {/* Quick Note Modal */}
      <QuickNoteModal />

      {/* Global Command Bar */}
      <CommandBar />

      {/* Global AI Coach */}
      <CoachChat date={new Date().toISOString().split('T')[0]} />

      {/* Global Nudge Toast */}
      <NudgeToast />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 