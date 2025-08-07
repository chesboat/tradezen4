import React from 'react';
import { Sidebar } from './components/Sidebar';
import { ActivityLog } from './components/ActivityLog';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { QuestsView } from './components/QuestsView';
import { WellnessView } from './components/WellnessView';
import { TradesView } from './components/TradesView';
import { AnalyticsView } from './components/AnalyticsView';
import { JournalView } from './components/JournalView';
import { TradeLoggerModal } from './components/TradeLoggerModal';
import { QuickNoteModal } from './components/QuickNoteModal';
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

function AppContent() {
  const { isExpanded: sidebarExpanded } = useSidebarStore();
  const { isExpanded: activityLogExpanded } = useActivityLogStore();
  const { currentView } = useNavigationStore();
  const { theme } = useTheme();
  const tradeLoggerModal = useTradeLoggerModal();
  const { currentUser } = useAuth();
  const { initializeProfile } = useUserProfileStore();

  // Initialize data when user is authenticated
  React.useEffect(() => {
    const initializeData = async () => {
      if (currentUser) {
        console.log('Starting app initialization for user:', currentUser.uid);
        try {
          await initializeDefaultAccounts();
          await initializeDefaultQuests();
          await initializeTradeStore();
          await initializeProfile(currentUser.uid, currentUser.email || undefined);
          console.log('App initialization completed successfully');
        } catch (error) {
          console.error('Error during app initialization:', error);
        }
      }
    };
    
    initializeData();
  }, [currentUser, initializeProfile]);

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
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
      case 'analytics':
        return <AnalyticsView />;
      case 'quests':
        return <QuestsView />;
      case 'wellness':
        return <WellnessView />;
      default:
        return <Dashboard />;
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
        } ${
          activityLogExpanded ? 'mr-[320px]' : 'mr-[60px]'
        }`}
      >
        {renderCurrentView()}
      </main>
      
      {/* Activity Log */}
      <ActivityLog />
      
      {/* Trade Logger Modal */}
      <TradeLoggerModal
        isOpen={tradeLoggerModal.isOpen}
        onClose={tradeLoggerModal.closeModal}
        editingTrade={tradeLoggerModal.editingTrade}
      />
      
      {/* Quick Note Modal */}
      <QuickNoteModal />
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