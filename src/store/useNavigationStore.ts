import { create } from 'zustand';

export type ViewType = 'dashboard' | 'calendar' | 'trades' | 'journal' | 'notes' | 'analytics' | 'quests' | 'wellness' | 'coach';

interface NavigationState {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  previousView: ViewType;
  goBack: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentView: 'dashboard',
  previousView: 'dashboard',
  
  setCurrentView: (view: ViewType) => {
    const currentView = get().currentView;
    set({ 
      currentView: view, 
      previousView: currentView 
    });
  },
  
  goBack: () => {
    const previousView = get().previousView;
    set({ 
      currentView: previousView,
      previousView: get().currentView 
    });
  },
})); 