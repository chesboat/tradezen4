import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import app, { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { ImageGallery } from './ImageGallery';
import { 
  Calendar,
  FileText,
  Brain,
  Smile,
  Star,
  TrendingUp,
  ExternalLink,
  X,
  Target,
  Trophy,
  BarChart3,
  Clock,
  AlertCircle,
  Flame,
  Pin,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
  Zap,
  Send,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Share2,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Home,
  LineChart,
  BookOpen,
  StickyNote,
  Activity,
  MessageSquare,
  Heart,
  User,
  Bell,
  Filter,
  MoreHorizontal,
  Edit,
  Sparkles,
  CheckCircle,
  Eye,
  Tag,
  Sun,
  Moon,
  ArrowRight
} from 'lucide-react';
import { formatDate, formatCurrency, formatTime } from '@/lib/localStorageUtils';

// Simple theme hook for demo
const useDemoTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('tradzen-theme');
      return (savedTheme as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    localStorage.setItem('tradzen-theme', newTheme);
  };

  return { theme, toggleTheme };
};

// Demo Theme Toggle Component
const DemoThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useDemoTheme();
  
  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative w-12 h-7 rounded-full p-1 transition-all duration-300
        ${theme === 'light' 
          ? 'bg-gray-200 hover:bg-gray-300' 
          : 'bg-gray-700 hover:bg-gray-600'
        }
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${theme === 'light' ? 'focus:ring-offset-white' : 'focus:ring-offset-gray-900'}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-1 rounded-full bg-white dark:bg-gray-900 shadow-md flex items-center justify-center"
        animate={{ 
          x: theme === 'light' ? 0 : 20 
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {theme === 'light' ? (
          <Sun 
            size={14} 
            className="text-yellow-500 transition-colors duration-300" 
          />
        ) : (
          <Moon 
            size={14} 
            className="text-blue-400 transition-colors duration-300" 
          />
        )}
      </motion.div>
    </motion.button>
  );
};

// Safe date formatting for public shares
const formatShareDate = (date: any): string => {
  if (!date) return 'Unknown Date';
  if (typeof date === 'string') return date;
  try {
    return formatDate(new Date(date));
  } catch {
    return String(date);
  }
};

// Load images for a specific share
const loadShareImages = async (shareId: string): Promise<{ [blockId: string]: string[] }> => {
  try {
    const imagesCol = collection(db, 'publicShareImages');
    const q = query(imagesCol, where('shareId', '==', shareId));
    const snapshot = await getDocs(q);
    
    const imagesByBlock: { [blockId: string]: string[] } = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      imagesByBlock[data.blockId] = data.images || [];
    });
    
    console.log('📖 Loaded share images:', {
      shareId,
      blockCount: Object.keys(imagesByBlock).length,
      totalImages: Object.values(imagesByBlock).reduce((sum, images) => sum + images.length, 0),
      imagesByBlock,
      sampleUrls: Object.values(imagesByBlock).flat().slice(0, 3)
    });
    
    return imagesByBlock;
  } catch (error) {
    console.error('Failed to load share images:', error);
    return {};
  }
};

// Load full blocks (HTML + meta) for a specific share
const loadShareBlocks = async (shareId: string): Promise<{ [blockId: string]: any }> => {
  try {
    const blocksCol = collection(db, 'publicShareBlocks');
    // Avoid composite index requirement; sort locally
    const q = query(blocksCol, where('shareId', '==', shareId));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(d => d.data()).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    const byId: { [blockId: string]: any } = {};
    docs.forEach((data: any) => { byId[data.blockId] = data; });
    console.log('📖 Loaded share blocks:', {
      shareId,
      count: Object.keys(byId).length
    });
    return byId;
  } catch (error) {
    console.error('Failed to load share blocks:', error);
    return {};
  }
};

// Resolve any Firebase Storage JSON API image URLs in HTML to public download URLs
const resolveInlineStorageLinksInHtml = async (html: string): Promise<string> => {
  if (!html || typeof html !== 'string' || html.indexOf('/o?name=') === -1) return html;
  
  const docEl = document.implementation.createHTMLDocument('tmp');
  docEl.body.innerHTML = html;
  const imgEls = Array.from(docEl.body.querySelectorAll('img')) as HTMLImageElement[];
  
  await Promise.all(imgEls.map(async (img) => {
    const src = img.getAttribute('src') || '';
    console.log('🖼️ Processing image in HTML:', { src, needsResolution: /\/o\?name=/.test(src) && !/alt=media/.test(src) });
    
    if (/\/o\?name=/.test(src) && !/alt=media/.test(src)) {
      try {
        const u = new URL(src);
        const pathParam = u.searchParams.get('name');
        if (pathParam) {
          const storagePath = decodeURIComponent(pathParam);
          
          // Get the storage bucket from the URL or environment
          const bucketName = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 
                            src.match(/\/b\/([^/]+)\//)?.[1];
          
          if (bucketName) {
            // Create a public download URL using the REST API format
            const encodedPath = encodeURIComponent(storagePath);
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
            console.log('🖼️ Converted URL:', { original: src, converted: publicUrl });
            img.setAttribute('src', publicUrl);
          }
        }
      } catch {
        // ignore
      }
    }
  }));
  return docEl.body.innerHTML;
};

// Signup redirect helper
const redirectToSignup = () => {
  window.location.href = `/signup?utm_source=share&utm_medium=public_journal&utm_campaign=preview_interaction`;
};

// Mock Sidebar Component
const MockSidebar: React.FC<{ 
  isExpanded: boolean; 
  onToggle: () => void; 
  isDemo?: boolean; 
  currentView?: string; 
  onViewChange?: (view: string) => void;
}> = ({ isExpanded, onToggle, isDemo = false, currentView = 'journal', onViewChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'trades', label: 'Trades', icon: LineChart },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'quests', label: 'Quests', icon: Target },
    { id: 'wellness', label: 'Wellness', icon: Heart },
    { id: 'coach', label: 'Coach', icon: MessageSquare },
  ];

  const actionItems = [
    { id: 'add-trade', label: 'Add Trade', icon: Plus },
    { id: 'coach-chat', label: 'Coach', icon: MessageCircle },
    { id: 'quick-note', label: 'Quick Note', icon: Edit },
    { id: 'manage-tags', label: 'Manage Tags', icon: Tag },
  ];

  return (
    <motion.aside
      className="fixed left-0 top-0 h-full bg-card border-r border-border z-40 flex flex-col shadow-xl"
      animate={{ width: isExpanded ? 280 : 80 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-card-foreground">TradeFutura</h1>
                <p className="text-xs text-muted-foreground">Your edge, future-proofed</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-2">
          <DemoThemeToggle />
          <motion.button
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      {isExpanded && (
        <div className="p-4 border-b border-border">
          <motion.button
            onClick={redirectToSignup}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Sign up to search your journal"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Search journal...</span>
          </motion.button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const canNavigate = isDemo && ['dashboard', 'calendar', 'trades', 'journal'].includes(item.id);
          const isPreview = ['calendar', 'trades', 'journal'].includes(item.id);
          
          return (
            <motion.button
              key={item.id}
              onClick={() => {
                if (canNavigate && onViewChange) {
                  onViewChange(item.id);
                } else if (!isDemo) {
                  redirectToSignup();
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              } ${canNavigate || !isDemo ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              whileHover={canNavigate || !isDemo ? { scale: 1.02 } : {}}
              whileTap={canNavigate || !isDemo ? { scale: 0.98 } : {}}
              title={
                !isDemo ? `Sign up to access ${item.label}` :
                canNavigate ? `Preview the ${item.label.toLowerCase()} view` : 
                'Available in full version'
              }
            >
              <item.icon className="w-5 h-5" />
              {isExpanded && (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm font-medium">{item.label}</span>
                  {isDemo && !canNavigate && (
                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Pro</span>
                  )}
                  {isDemo && canNavigate && isPreview && (
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">Preview</span>
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
        
        {/* Action Items Section */}
        {isExpanded && (
          <div className="mt-6 pt-4 border-t border-border">
            {actionItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={redirectToSignup}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer mb-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={`Sign up to access ${item.label}`}
              >
                <item.icon className="w-5 h-5" />
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Pro</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <motion.button
          onClick={redirectToSignup}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Sign up to create your profile"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          {isExpanded && (
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">Demo User</div>
              <div className="text-xs text-muted-foreground">Preview Mode</div>
            </div>
          )}
        </motion.button>
      </div>
    </motion.aside>
  );
};

// Mock Activity Log Component - Authentic to real implementation
const MockActivityLog: React.FC<{ isExpanded: boolean; onToggle: () => void }> = ({ isExpanded, onToggle }) => {
  const mockActivities = [
    { 
      id: '1',
      type: 'trade', 
      title: 'AAPL Long Position',
      description: 'Entered long position at $175.50, exited at $178.25',
      time: '2 min ago', 
      xpEarned: 25,
      icon: TrendingUp, 
      color: 'text-primary' 
    },
    { 
      id: '2',
      type: 'note', 
      title: 'Market Analysis Note',
      description: 'Strong bullish momentum in tech sector',
      time: '15 min ago', 
      icon: BookOpen, 
      color: 'text-yellow-500' 
    },
    { 
      id: '3',
      type: 'reflection', 
      title: 'Daily Reflection',
      description: 'Completed daily trading reflection',
      time: '1 hour ago', 
      xpEarned: 15,
      icon: Activity, 
      color: 'text-blue-500' 
    },
    { 
      id: '4',
      type: 'quest', 
      title: 'Risk Master Quest',
      description: 'Kept all trades under 2% risk for 5 days',
      time: '2 hours ago', 
      xpEarned: 50,
      icon: Trophy, 
      color: 'text-purple-500' 
    },
    { 
      id: '5',
      type: 'wellness', 
      title: 'Breathing Exercise',
      description: 'Completed 5-minute mindfulness session',
      time: '3 hours ago', 
      xpEarned: 10,
      icon: Heart, 
      color: 'text-green-500' 
    },
  ];

  const sidebarVariants = {
    expanded: { width: 320, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
    collapsed: { width: 60, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1, ease: 'easeOut' } },
    collapsed: { opacity: 0, x: 20, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  return (
    <motion.aside
      className="fixed right-0 top-0 h-full bg-card border-l border-border z-40 flex flex-col shadow-xl"
      variants={sidebarVariants}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      initial={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <motion.button
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </motion.button>
        
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              className="flex items-center gap-2"
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Activity</h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Tabs - Only when expanded */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="p-4 border-b border-border"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div className="flex gap-2 overflow-x-auto">
              {['All', 'Trades', 'Notes', 'Quests', 'XP'].map((filter, index) => (
                <motion.button
                  key={filter}
                  onClick={redirectToSignup}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    index === 0 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Sign up to filter activities"
                >
                  {filter}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Feed - Only when expanded */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {mockActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <motion.button
                    onClick={redirectToSignup}
                    className="w-full p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group text-left"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    title="Sign up to view activity details"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${activity.color} flex-shrink-0`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-card-foreground group-hover:text-accent-foreground">
                            {activity.title}
                          </h4>
                          {activity.xpEarned && (
                            <span className="text-xs text-orange-500 font-medium">
                              +{activity.xpEarned} XP
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <motion.button
              onClick={redirectToSignup}
              className="w-full p-3 border-2 border-dashed border-primary/30 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors mt-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              + Start tracking your activity
            </motion.button>
          </div>
        </div>
      )}

      {/* Collapsed State - Only when collapsed */}
      {!isExpanded && (
        <div className="flex-1 overflow-hidden">
          <div className="p-2 space-y-2">
            {mockActivities.slice(0, 8).map((activity, index) => (
              <motion.button
                key={activity.id}
                onClick={redirectToSignup}
                className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={`${activity.title} - Sign up to view details`}
              >
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.aside>
  );
};

// Mock Todo Drawer Component - Authentic to real implementation
const MockTodoDrawer: React.FC<{ isExpanded: boolean; onToggle: () => void; activityLogExpanded: boolean }> = ({ isExpanded, onToggle, activityLogExpanded }) => {
  const mockTodos = [
    { 
      id: '1',
      text: 'Review and update risk management rules',
      completed: false, 
      priority: 'high',
      category: 'risk',
      pinned: true,
      order: 1,
      createdAt: new Date('2024-01-15T10:00:00'),
      dueDate: new Date('2024-01-16T17:00:00')
    },
    { 
      id: '2',
      text: 'Analyze last week\'s losing trades for patterns',
      completed: false, 
      priority: 'medium',
      category: 'analysis',
      pinned: false,
      order: 2,
      createdAt: new Date('2024-01-14T14:30:00')
    },
    { 
      id: '3',
      text: 'Update trading journal with screenshots',
      completed: true, 
      priority: 'low',
      category: 'journal',
      pinned: false,
      order: 3,
      createdAt: new Date('2024-01-13T09:15:00'),
      completedAt: new Date('2024-01-15T11:45:00')
    },
    { 
      id: '4',
      text: 'Practice mindfulness before trading session',
      completed: false, 
      priority: 'medium',
      category: 'wellness',
      pinned: false,
      order: 4,
      createdAt: new Date('2024-01-12T16:20:00')
    },
    { 
      id: '5',
      text: 'Set up alerts for key support/resistance levels',
      completed: false, 
      priority: 'high',
      category: 'execution',
      pinned: false,
      order: 5,
      createdAt: new Date('2024-01-11T13:10:00')
    },
  ];

  const sidebarVariants = {
    expanded: { width: 360, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
    collapsed: { width: 60, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1, ease: 'easeOut' } },
    collapsed: { opacity: 0, x: 20, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      risk: 'bg-red-500/10 text-red-500',
      analysis: 'bg-blue-500/10 text-blue-500',
      journal: 'bg-green-500/10 text-green-500',
      wellness: 'bg-purple-500/10 text-purple-500',
      execution: 'bg-orange-500/10 text-orange-500',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-500';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const rightOffset = Math.max(60, (activityLogExpanded ? 320 : 60));
  const clampedWidth = Math.max(220, Math.min(420, isExpanded ? 360 : 60));

  return (
    <motion.aside
      className="fixed top-0 h-full bg-card border-l border-border z-39 flex flex-col shadow-xl"
      style={{ right: rightOffset, width: clampedWidth }}
      variants={sidebarVariants}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      initial={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <motion.button
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
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
                <Check className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-card-foreground">Improvement Tasks</h2>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-primary rounded-full">
                <span className="text-xs font-medium text-primary-foreground">{mockTodos.length}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add - Only when expanded */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="p-2 border-b border-border"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div className="flex items-center gap-2">
              <input
                placeholder="Add a task to improve your trading..."
                className="flex-1 px-2 py-1.5 rounded-lg bg-muted text-sm outline-none focus:ring-2 ring-primary/40"
                onClick={redirectToSignup}
                readOnly
                title="Sign up to add tasks"
              />
              <motion.button
                onClick={redirectToSignup}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Sign up to add tasks"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters - Only when expanded */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="p-2 border-b border-border"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              {['All', 'Open', 'Done', 'Snoozed'].map((filter, index) => (
                <motion.button
                  key={filter}
                  onClick={redirectToSignup}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    index === 0 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Sign up to filter tasks"
                >
                  {filter}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List - Only when expanded */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-2 space-y-1.5">
            <AnimatePresence mode="popLayout">
              {mockTodos.map((todo, index) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <motion.button
                    onClick={redirectToSignup}
                    className="w-full p-2 rounded-lg hover:bg-muted transition-colors text-left group border border-transparent hover:border-border/50"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    title="Sign up to manage tasks"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-2 mt-0.5">
                        {todo.pinned && <Pin className="w-3 h-3 text-primary" />}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          todo.completed 
                            ? 'bg-primary border-primary' 
                            : 'border-muted-foreground group-hover:border-primary/50'
                        }`}>
                          {todo.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm font-medium ${
                            todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {todo.text}
                          </span>
                          <span className="text-xs">{getPriorityIcon(todo.priority)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(todo.category)}`}>
                            {todo.category}
                          </span>
                          {todo.dueDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {todo.dueDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <motion.button
              onClick={redirectToSignup}
              className="w-full p-3 border-2 border-dashed border-primary/30 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors mt-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              + Add improvement task
            </motion.button>
          </div>
        </div>
      )}

      {/* Collapsed State - Only when collapsed */}
      {!isExpanded && (
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.button
            onClick={onToggle}
            className="relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={`${mockTodos.length} improvement tasks - Click to expand`}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" />
            </div>
            {mockTodos.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">
                  {mockTodos.length}
                </span>
              </div>
            )}
          </motion.button>
        </div>
      )}
    </motion.aside>
  );
};

// Demo Data Generator
const generateDemoData = () => {
  const demoTrades = [
    { id: '1', symbol: 'AAPL', type: 'Long', entry: 175.50, exit: 178.25, quantity: 100, pnl: 275, date: '2024-01-15', time: '09:30', notes: 'Strong earnings momentum, broke resistance' },
    { id: '2', symbol: 'TSLA', type: 'Short', entry: 245.80, exit: 242.10, quantity: 50, pnl: 185, date: '2024-01-15', time: '14:15', notes: 'Overbought on RSI, took profits at support' },
    { id: '3', symbol: 'NVDA', type: 'Long', entry: 520.30, exit: 515.75, quantity: 25, pnl: -113.75, date: '2024-01-14', time: '11:45', notes: 'Stopped out, market turned bearish' },
    { id: '4', symbol: 'SPY', type: 'Long', entry: 485.20, exit: 487.90, quantity: 200, pnl: 540, date: '2024-01-14', time: '15:30', notes: 'End of day momentum play' },
    { id: '5', symbol: 'QQQ', type: 'Short', entry: 395.60, exit: 392.80, quantity: 75, pnl: 210, date: '2024-01-12', time: '10:15', notes: 'Tech weakness, good risk/reward' },
  ];

  const demoNotes = [
    { id: '1', content: 'Market showing strong bullish momentum. Tech sector leading the way. Watch for pullback opportunities.', date: '2024-01-15', tags: ['market-analysis', 'bullish'] },
    { id: '2', content: 'FOMC meeting tomorrow. Expecting volatility around 2PM EST. Reduced position sizes accordingly.', date: '2024-01-14', tags: ['fed', 'volatility', 'risk-management'] },
    { id: '3', content: 'Earnings season heating up. Focus on companies with strong guidance and beat expectations.', date: '2024-01-12', tags: ['earnings', 'strategy'] },
  ];

  const demoJournalEntries = [
    {
      date: '2024-01-15',
      reflection: 'Great trading day! Stayed disciplined with my entries and exits. The AAPL trade worked perfectly as expected after earnings. Need to work on position sizing - could have made more on the TSLA short.',
      insightBlocks: [
        {
          id: '1',
          title: 'Market Analysis',
          emoji: '📊',
          content: '<h2>Strong Bullish Momentum</h2><p>The market showed exceptional strength today with tech leading the charge. AAPL earnings beat expectations significantly, driving the entire sector higher.</p><p><strong>Key observations:</strong></p><ul><li>Volume was above average on all major indices</li><li>Breadth was strong with 80% of stocks advancing</li><li>VIX dropped to 12.5, showing low fear</li></ul>',
          tags: ['market-analysis', 'bullish', 'tech'],
          images: [] // Would contain chart URLs in real app
        },
        {
          id: '2', 
          title: 'Risk Management',
          emoji: '🛡️',
          content: '<h3>Position Sizing Review</h3><p>Today I risked 2% of my account across all positions. This felt comfortable and allowed me to stay calm during the NVDA stop-out.</p><p>Areas for improvement:</p><ul><li>Could have sized the TSLA short larger given the clear setup</li><li>Need to be more aggressive when conviction is high</li></ul>',
          tags: ['risk-management', 'position-sizing'],
          images: []
        }
      ],
      mood: [
        { timestamp: new Date('2024-01-15T09:00:00'), mood: '😊' },
        { timestamp: new Date('2024-01-15T12:00:00'), mood: '🚀' },
        { timestamp: new Date('2024-01-15T16:00:00'), mood: '💪' },
      ]
    }
  ];

  return { demoTrades, demoNotes, demoJournalEntries };
};

// Mock Dashboard Background
const MockDashboard: React.FC<{ isDemo?: boolean }> = ({ isDemo = false }) => {
  const mockTiles = [
    { title: 'Total P&L', value: '+$2,450.75', icon: TrendingUp, color: 'text-green-500' },
    { title: 'Win Rate', value: '68%', icon: Target, color: 'text-blue-500' },
    { title: 'Avg Trade', value: '+$125.30', icon: BarChart3, color: 'text-purple-500' },
    { title: 'Risk Score', value: '7.2/10', icon: AlertCircle, color: 'text-amber-500' },
  ];

  return (
    <div className={`p-6 space-y-6 ${!isDemo ? 'opacity-50' : ''}`}>
      {/* Demo Mode Banner */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Star className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-700 dark:text-blue-300">Demo Mode</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">You're exploring with sample data. Sign up to track your real trades!</p>
              </div>
            </div>
            <motion.button
              onClick={redirectToSignup}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockTiles.map((tile, index) => (
          <motion.button
            key={index}
            onClick={isDemo ? undefined : redirectToSignup}
            className={`bg-card rounded-2xl p-6 border border-border transition-colors ${
              isDemo ? 'cursor-default' : 'hover:border-primary/50 cursor-pointer'
            }`}
            whileHover={isDemo ? {} : { scale: 1.02 }}
            whileTap={isDemo ? {} : { scale: 0.98 }}
            title={isDemo ? '' : 'Sign up to see your real stats'}
          >
            <div className="flex items-center justify-between mb-3">
              <tile.icon className={`w-6 h-6 ${tile.color}`} />
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold">{tile.value}</p>
              <p className="text-sm text-muted-foreground">{tile.title}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Chart Placeholder */}
      <motion.button
        onClick={isDemo ? undefined : redirectToSignup}
        className={`w-full bg-card rounded-2xl p-6 border border-border transition-colors ${
          isDemo ? 'cursor-default' : 'hover:border-primary/50 cursor-pointer'
        }`}
        whileHover={isDemo ? {} : { scale: 1.01 }}
        whileTap={isDemo ? {} : { scale: 0.99 }}
        title={isDemo ? '' : 'Sign up to see your performance charts'}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Performance Chart</h3>
          <LineChart className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isDemo ? 'Interactive charts available in full version' : 'Your trading performance will appear here'}
            </p>
          </div>
        </div>
      </motion.button>
    </div>
  );
};

// Demo Journal View Component
const DemoJournalView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysToShow, setDaysToShow] = useState(30);
  const [showOnlyReflected, setShowOnlyReflected] = useState(false);

  // Generate demo timeline entries
  const demoEntries = useMemo(() => {
    const entries: any[] = [];
    const today = new Date();
    
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Generate realistic demo data
      const hasReflection = Math.random() > 0.3; // 70% chance of reflection
      const tradeCount = Math.floor(Math.random() * 12) + 1;
      const winRate = 0.4 + Math.random() * 0.5; // 40-90% win rate
      const pnl = (Math.random() - 0.4) * 3000; // -1200 to +1800 range
      const avgRR = 1 + Math.random() * 2; // 1-3 R:R
      const notesCount = Math.floor(Math.random() * 5);
      
      entries.push({
        date: dateStr,
        dateObj: d,
        stats: {
          pnl,
          trades: tradeCount,
          winRate,
          avgRR,
        },
        hasReflection,
        quickNotesCount: notesCount,
        isToday: i === 0,
      });
    }
    
    return showOnlyReflected ? entries.filter(e => e.hasReflection) : entries;
  }, [daysToShow, showOnlyReflected]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (direction === 'prev') {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(date.getDate() + 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const jumpToToday = () => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                Journal Timeline
              </h1>
              <p className="text-muted-foreground">
                Your trading journey, day by day
              </p>
            </div>
            
            {/* Streak Counter */}
            <motion.div
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl shadow-lg cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={redirectToSignup}
            >
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                <div className="text-center">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs opacity-90">Day Streak</div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>47 reflections</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>2,340 XP earned</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>156 avg words</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="px-4 py-2 bg-card border rounded-lg">
              <span className="text-sm font-medium">
                {(() => {
                  const [year, month, day] = selectedDate.split('-').map(Number);
                  const localDate = new Date(year, month - 1, day);
                  return localDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                })()}
              </span>
            </div>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={jumpToToday}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Today
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={daysToShow}
            onChange={(e) => setDaysToShow(Number(e.target.value))}
            className="px-3 py-2 bg-card border rounded-lg text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 2 weeks</option>
            <option value={30}>Last month</option>
            <option value={90}>Last 3 months</option>
          </select>
          
          <button
            onClick={() => setShowOnlyReflected(!showOnlyReflected)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              showOnlyReflected 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            <Filter className="w-4 h-4 inline mr-1" />
            Reflected Only
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {demoEntries.map((entry, index) => (
            <motion.div
              key={entry.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <motion.div
                className={`bg-card border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer ${
                  entry.date === selectedDate ? 'ring-2 ring-primary' : ''
                } ${entry.isToday ? 'border-primary/50' : ''}`}
                onClick={() => {
                  setSelectedDate(entry.date);
                  redirectToSignup();
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {entry.dateObj.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        {entry.isToday && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {entry.isToday ? 'Today' : `${index} day${index > 1 ? 's' : ''} ago`}
                      </p>
                    </div>
                    
                    {/* Reflection Status */}
                    {entry.hasReflection && (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Reflected</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* P&L */}
                    <div className={`font-bold text-lg ${
                      entry.stats.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {entry.stats.pnl >= 0 ? '+' : ''}${entry.stats.pnl.toFixed(0)}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <div className="text-muted-foreground mb-1">Trades</div>
                    <div className="font-medium text-lg">{entry.stats.trades}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Win Rate</div>
                    <div className="font-medium text-lg">{(entry.stats.winRate * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Avg R:R</div>
                    <div className="font-medium text-lg">{entry.stats.avgRR.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Notes</div>
                    <div className="font-medium text-lg">{entry.quickNotesCount}</div>
                  </div>
                </div>
                
                {/* Quick Preview */}
                {entry.hasReflection && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Smile className="w-4 h-4 text-primary" />
                      <span className="font-medium">Daily Reflection</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">
                      {index % 3 === 0 
                        ? "Great day overall! The AAPL trade worked perfectly as expected. Need to work on position sizing for the TSLA short."
                        : index % 3 === 1
                        ? "Mixed results today. The morning setup was solid but I got impatient on the afternoon trades. Focus on patience tomorrow."
                        : "Excellent execution on risk management today. All stops were respected and I stuck to my plan. Feeling confident about tomorrow's setups."
                      }
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Tips Section */}
      <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
            Timeline Tips
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
          <div>
            <p className="font-medium mb-1">• Daily Consistency</p>
            <p>Build your streak by reflecting daily. Even small insights count!</p>
          </div>
          <div>
            <p className="font-medium mb-1">• Pin Key Focus</p>
            <p>Turn your daily focus into actionable quests for tomorrow.</p>
          </div>
          <div>
            <p className="font-medium mb-1">• Use AI Assistant</p>
            <p>Generate insights from your trades and notes with AI assistance.</p>
          </div>
          <div>
            <p className="font-medium mb-1">• Complete Days</p>
            <p>Mark days complete to earn XP and celebrate your progress.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo Calendar View Component
const DemoCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [hoveredDay, setHoveredDay] = useState<any>(null);

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate demo calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    
    const calendarDays: any[] = [];
    const weeks: any[][] = [];
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      calendarDays.push({
        date,
        pnl: 0,
        tradesCount: 0,
        avgRR: 0,
        winRate: 0,
        hasReflection: false,
        isOtherMonth: true,
      });
    }
    
    // Current month days with demo data
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const hasTrades = !isWeekend && Math.random() > 0.3; // 70% chance of trades on weekdays
      
      const tradesCount = hasTrades ? Math.floor(Math.random() * 8) + 1 : 0;
      const pnl = hasTrades ? (Math.random() - 0.35) * 2000 : 0; // Slight positive bias
      const winRate = hasTrades ? 40 + Math.random() * 50 : 0; // 40-90% win rate
      const avgRR = hasTrades ? 1 + Math.random() * 2 : 0; // 1-3 R:R
      const hasReflection = hasTrades && Math.random() > 0.4; // 60% chance if traded
      
      calendarDays.push({
        date,
        pnl,
        tradesCount,
        avgRR,
        winRate,
        hasReflection,
        isOtherMonth: false,
      });
    }
    
    // Next month days to fill grid
    const totalCells = Math.ceil(calendarDays.length / 7) * 7;
    for (let day = 1; calendarDays.length < totalCells; day++) {
      const date = new Date(year, month + 1, day);
      calendarDays.push({
        date,
        pnl: 0,
        tradesCount: 0,
        avgRR: 0,
        winRate: 0,
        hasReflection: false,
        isOtherMonth: true,
      });
    }
    
    // Group into weeks
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    
    return { calendarDays, weeks };
  }, [currentDate]);

  // Calculate weekly summaries
  const weeklyData = useMemo(() => {
    return calendarData.weeks.map((week, index) => {
      const weekDays = week.filter(day => !day.isOtherMonth && day.tradesCount > 0);
      const totalPnl = weekDays.reduce((sum, day) => sum + day.pnl, 0);
      const totalTrades = weekDays.reduce((sum, day) => sum + day.tradesCount, 0);
      
      return {
        weekNumber: index + 1,
        totalPnl,
        activeDays: weekDays.length,
        totalTrades,
      };
    });
  }, [calendarData.weeks]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayClassName = (day: any) => {
    const isToday = new Date().toDateString() === day.date.toDateString();
    const isSelected = selectedDay?.date.toDateString() === day.date.toDateString();
    const isHovered = hoveredDay?.date.toDateString() === day.date.toDateString();
    
    return `relative p-3 rounded-xl border border-border/50 transition-all duration-200 cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 overflow-hidden aspect-[7/6] ${
      day.isOtherMonth ? 'opacity-40' : ''
    } ${
      isToday ? 'ring-2 ring-primary/50' : ''
    } ${
      isSelected ? 'bg-primary/10 border-primary' : ''
    } ${
      isHovered ? 'bg-accent/50' : ''
    } ${
      day.tradesCount > 0 ? 'bg-muted/30' : ''
    } ${
      day.pnl > 0 ? 'border-green-500/30 bg-green-50/10' : ''
    } ${
      day.pnl < 0 ? 'border-red-500/30 bg-red-50/10' : ''
    }`;
  };

  const formatPnL = (pnl: number) => {
    if (pnl === 0) return null;
    return (
      <div className={`text-sm font-bold ${pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
        {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}
      </div>
    );
  };

  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const monthlyPnL = weeklyData.reduce((sum, week) => sum + week.totalPnl, 0);

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            
            <h1 className="text-2xl font-bold text-foreground">
              {currentMonth} {currentYear}
            </h1>
            
            <motion.button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
          
          <motion.button
            onClick={goToToday}
            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            TODAY
          </motion.button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Monthly stats: <span className={`font-semibold ${monthlyPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {monthlyPnL >= 0 ? '+' : ''}${monthlyPnL.toFixed(0)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={redirectToSignup}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={redirectToSignup}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-8 gap-3">
        {/* Day Headers */}
        <div className="col-span-7 grid grid-cols-7 gap-3 mb-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Week Header */}
        <div className="text-center font-semibold text-muted-foreground py-2">
          Week
        </div>

        {/* Calendar Weeks */}
        {calendarData.weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {/* Week Days */}
            <div className="col-span-7 grid grid-cols-7 gap-3">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={`${weekIndex}-${dayIndex}`}
                  className={getDayClassName(day)}
                  onClick={() => {
                    setSelectedDay(day);
                    redirectToSignup();
                  }}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  whileHover={{ scale: 1.0 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col h-full space-y-1">
                    {/* Date */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground'
                      }`}>
                        {day.date.getDate()}
                      </span>
                      <div className="flex items-center gap-1">
                        {day.hasReflection && (
                          <BookOpen className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* P&L */}
                    {formatPnL(day.pnl)}
                    
                    {/* Trade Count */}
                    {day.tradesCount > 0 && (
                      <div className="text-xs text-muted-foreground truncate">
                        {day.tradesCount} trade{day.tradesCount > 1 ? 's' : ''}
                      </div>
                    )}
                    
                    {/* Metrics */}
                    {day.tradesCount > 0 && (
                      <div className="text-xs text-muted-foreground space-y-0.5 truncate">
                        <div>{day.avgRR.toFixed(1)}:1R, {day.winRate.toFixed(0)}%</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Weekly Summary */}
            <motion.div
              className="bg-muted/30 border border-border/50 rounded-xl p-4 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden aspect-[7/6] flex items-center justify-center"
              whileHover={{ scale: 1.01 }}
              onClick={redirectToSignup}
            >
              <div className="text-center space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Week {weeklyData[weekIndex]?.weekNumber}
                </div>
                <div className={`text-lg font-bold ${
                  weeklyData[weekIndex]?.totalPnl > 0 ? 'text-green-500' : 
                  weeklyData[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                }`}>
                  {weeklyData[weekIndex]?.totalPnl >= 0 ? '+' : ''}${(weeklyData[weekIndex]?.totalPnl || 0).toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {weeklyData[weekIndex]?.activeDays || 0} days
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Demo Trades View Component  
const DemoTradesView: React.FC = () => {
  const { demoTrades } = generateDemoData();
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trades</h1>
        <motion.button
          onClick={redirectToSignup}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Add Trade
        </motion.button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Recent Trades</h3>
        </div>
        <div className="divide-y divide-border">
          {demoTrades.map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => {/* Demo trade details would open here */}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="font-mono font-bold">{trade.symbol}</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      trade.type === 'Long' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {trade.type}
                    </span>
                    <span className="text-sm text-muted-foreground">{trade.quantity} shares</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{trade.date} {trade.time}</div>
                    <div className="text-xs text-muted-foreground">${trade.entry} → ${trade.exit}</div>
                  </div>
                  <div className={`font-mono font-bold ${
                    trade.pnl > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {trade.pnl > 0 ? '+' : ''}${trade.pnl}
                  </div>
                </div>
              </div>
              {trade.notes && (
                <div className="mt-2 text-sm text-muted-foreground">{trade.notes}</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PublicSharePage: React.FC = () => {
  const id = window.location.pathname.split('/').pop()!;
  const [data, setData] = React.useState<any | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [imagesByBlock, setImagesByBlock] = React.useState<{ [blockId: string]: string[] }>({});
  const [blocksById, setBlocksById] = React.useState<{ [blockId: string]: any }>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'notes' | 'insights'>('overview');
  const [collapsedSections, setCollapsedSections] = useState<{
    mood: boolean;
    reflection: boolean;
    insights: boolean;
    notes: boolean;
    quickNotes: boolean;
    moodTimeline: boolean;
    calendar: boolean;
  }>({
    mood: false,
    reflection: false,
    insights: false,
    notes: false,
    quickNotes: false,
    moodTimeline: false,
    calendar: false,
  });

  // App shell state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activityLogExpanded, setActivityLogExpanded] = useState(false);
  const [todoExpanded, setTodoExpanded] = useState(false);
  
  // Demo mode state - when modal is closed, show full demo app
  const [showModal, setShowModal] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [currentDemoView, setCurrentDemoView] = useState<'dashboard' | 'calendar' | 'trades' | 'journal' | 'notes' | 'analytics' | 'quests' | 'wellness' | 'coach'>('journal');

  React.useEffect(() => {
    (async () => {
      try {
        // Load main share data
        const snap = await getDoc(doc(db, 'publicShares', id));
        if (!snap.exists()) { 
          setNotFound(true); 
          return; 
        }
        
        const shareData: any = { id: snap.id, ...(snap.data() as any) };
        
        // Load images and full blocks separately
        const [images, rawBlocks] = await Promise.all([
          loadShareImages(id),
          loadShareBlocks(id)
        ]);
        // Resolve any inline storage links inside block HTML so images render correctly
        const blocks: { [blockId: string]: any } = {};
        await Promise.all(Object.keys(rawBlocks).map(async (bid) => {
          const blk = rawBlocks[bid];
          blocks[bid] = { ...blk, content: await resolveInlineStorageLinksInHtml(blk.content || '') };
        }));
        
        console.log('📖 Public share page - loaded data:', {
          hasInsightBlocks: !!shareData.insightBlocks,
          blockCount: shareData.insightBlocks?.length || 0,
          blocksWithImageCount: shareData.insightBlocks?.filter((b: any) => b.imageCount > 0).length || 0,
          allBlocks: shareData.insightBlocks?.map((b: any) => ({ 
            title: b.title, 
            imageCount: b.imageCount || 0,
            blockId: b.id 
          })),
          includeImages: shareData.options?.includeImages,
          loadedImageBlocks: Object.keys(images).length,
          totalLoadedImages: Object.values(images).reduce((sum, imgs) => sum + imgs.length, 0),
          loadedBlocks: Object.keys(blocks).length
        });
        
        setData(shareData);
        setImagesByBlock(images);
        setBlocksById(blocks);
      } catch (error) {
        console.error('Failed to load public share:', error);
        setNotFound(true);
      }
    })();
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-2xl font-bold mb-2">Journal Not Found</h1>
          <p className="text-muted-foreground">This journal entry may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading journal...</p>
        </div>
      </div>
    );
  }

  // Mock data for preview sections (removed trades - now using real data)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, badge: false },
    { id: 'trades', label: 'Trades', icon: TrendingUp, badge: (data?.trades?.length || 0) > 0 },
    { id: 'notes', label: 'Notes', icon: FileText, badge: data?.notes?.length > 0 },
    { id: 'insights', label: 'Insights', icon: Brain, badge: data?.insightBlocks?.length > 0 },
  ];

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDemoMode(true);
  };

  const renderDemoView = () => {
    switch (currentDemoView) {
      case 'dashboard':
        return <MockDashboard isDemo={true} />;
      case 'calendar':
        return <DemoCalendarView />;
      case 'trades':
        return <DemoTradesView />;
      case 'journal':
        return <DemoJournalView />;
      default:
        return <MockDashboard isDemo={true} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Full App Shell Background */}
      <MockSidebar 
        isExpanded={sidebarExpanded} 
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        isDemo={demoMode}
        currentView={demoMode ? currentDemoView : 'journal'}
        onViewChange={demoMode ? ((view: string) => setCurrentDemoView(view as any)) : undefined}
      />
      
      <MockActivityLog 
        isExpanded={activityLogExpanded} 
        onToggle={() => setActivityLogExpanded(!activityLogExpanded)} 
      />
      
      <MockTodoDrawer 
        isExpanded={todoExpanded} 
        onToggle={() => setTodoExpanded(!todoExpanded)}
        activityLogExpanded={activityLogExpanded}
      />

      {/* Main Content Area */}
      <main 
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarExpanded ? 280 : 80,
          marginRight: (activityLogExpanded ? 320 : 60) + (todoExpanded ? 360 : 60),
        }}
      >
        {demoMode ? renderDemoView() : <MockDashboard />}
      </main>

      {/* Journal Modal Overlay - Only show when not in demo mode */}
              {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <motion.div
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
          {/* Header - Exact replica */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{formatShareDate(data?.date)}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Trading Journal Preview</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Share button (disabled with CTA) */}
              <motion.button
                onClick={redirectToSignup}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm opacity-75 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Sign up to share your own journals"
              >
                <Share2 className="w-4 h-4" />
                Share
              </motion.button>

              {/* Close button - Enter demo mode */}
              <motion.button
                onClick={handleCloseModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Explore the full app with demo data"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Daily Analytics Section - Mobile Optimized */}
          {data?.stats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 sm:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl border border-border/50 bg-gradient-to-r from-background/50 to-muted/20"
            >
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-center">
                    <span className={`font-bold ${data.stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {data.stats.totalPnL >= 0 ? '+' : ''}{formatCurrency(data.stats.totalPnL)}
                    </span>
                    <span className="text-muted-foreground ml-1">P&L</span>
                  </div>
                  
                  <div className="text-center">
                    <span className="font-bold text-foreground">{data.stats.totalTrades}</span>
                    <span className="text-muted-foreground ml-1">Trades</span>
                  </div>
                  
                  <div className="text-center">
                    <span className="font-bold text-foreground">{data.stats.winRate}%</span>
                    <span className="text-muted-foreground ml-1">WR</span>
                  </div>
                  
                  <div className="text-center">
                    <span className="font-bold text-foreground">{data.stats.avgRR}:1</span>
                    <span className="text-muted-foreground ml-1">R:R</span>
                  </div>
                </div>
                
                <div className="text-muted-foreground">{formatShareDate(data.date)}</div>
              </div>
            </motion.div>
          )}

          {/* Tab Navigation - Exact replica */}
          <div className="flex border-b border-border bg-muted/20">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => tab.id === 'overview' ? null : redirectToSignup()}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-background/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                } ${tab.id !== 'overview' ? 'cursor-pointer opacity-75' : ''}`}
                whileHover={tab.id !== 'overview' ? { scale: 1.02 } : {}}
                whileTap={tab.id !== 'overview' ? { scale: 0.98 } : {}}
                title={tab.id !== 'overview' ? 'Sign up to access all features' : ''}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && (
                  <span className="w-2 h-2 bg-primary rounded-full" />
                )}
                {tab.id !== 'overview' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 rounded" />
                )}
              </motion.button>
            ))}
          </div>

          {/* Content Area - Scrollable with mobile optimization */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
            
            {/* Daily Reflection Section */}
            {data?.content?.reflectionPlain && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Daily Reflection</h3>
                  </div>
                  <motion.button
                    onClick={() => toggleSection('reflection')}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {collapsedSections.reflection ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </motion.button>
                </div>

                <AnimatePresence initial={false}>
                  {!collapsedSections.reflection && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                        <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
                          {data.content.reflectionPlain}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Insight Blocks Section */}
            {data?.insightBlocks && data.insightBlocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Trading Insights</h3>
                    <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                      {data.insightBlocks.length}
                    </span>
                  </div>
                  <motion.button
                    onClick={() => toggleSection('insights')}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {collapsedSections.insights ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </motion.button>
                </div>

                <AnimatePresence initial={false}>
                  {!collapsedSections.insights && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden space-y-4"
                    >
                      {data.insightBlocks.map((block: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-xl border border-border/50 bg-card/30 hover:bg-card/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-xl">{block.emoji || '📊'}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{block.title}</h4>
                              {block.tags && block.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {block.tags.map((tag: string, tagIndex: number) => (
                                    <span
                                      key={tagIndex}
                                      className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="prose dark:prose-invert max-w-none mb-3 text-sm prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-h4:text-sm prose-h5:text-xs prose-h6:text-xs prose-headings:mt-2 prose-headings:mb-1 prose-p:text-sm">
                            {/* Prefer full HTML from separate blocks collection if available */}
                            <div dangerouslySetInnerHTML={{ __html: (blocksById[block.id]?.content ?? block.content) }} />
                          </div>
                          
                          {/* Gallery hidden: inline images now render within content */}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Quick Notes Section - Always show with demo data if no real data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Quick Notes</h3>
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    {data?.notes?.length || 1}
                  </span>
                </div>
                <motion.button
                  onClick={() => toggleSection('quickNotes')}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {collapsedSections.quickNotes ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </motion.button>
              </div>

              <AnimatePresence initial={false}>
                {!collapsedSections.quickNotes && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                      {/* Show real notes if available, otherwise show demo note */}
                      {data?.notes && data.notes.length > 0 ? (
                        <div className="space-y-3">
                          {data.notes.map((note: any, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-border/30">
                              <div className="text-lg">😊</div>
                              <div className="flex-1">
                                <div className="text-sm text-foreground/90 mb-2">{note.content}</div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>5:52 PM</span>
                                  <span>•</span>
                                  <span className="text-green-500 font-medium">Excellent</span>
                                  <span>•</span>
                                  <span className="text-blue-500">Quick Note</span>
                                </div>
                                {note.tags && note.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {note.tags.map((tag: string, tagIndex: number) => (
                                      <span
                                        key={tagIndex}
                                        className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-border/30">
                          <div className="text-lg">😊</div>
                          <div className="flex-1">
                            <div className="text-sm text-foreground/90 mb-2">
                              Today was the first day of my set it and forget it risk management system. The idea is to put the trade on and close the chart and continue on with the day. Either TP or SL. This should help keep emotions out of the trade and encourage more rational decision making
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>5:52 PM</span>
                              <span>•</span>
                              <span className="text-green-500 font-medium">Excellent</span>
                              <span>•</span>
                              <span className="text-blue-500">Quick Note</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                                #wisdom
                              </span>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                                risk management
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Filter by Tags section */}
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Filter className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Filter by Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1">
                            #wisdom <span className="bg-blue-500/20 rounded-full px-1">2</span>
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center gap-1">
                            risk management <span className="bg-purple-500/20 rounded-full px-1">2</span>
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                            #smt <span className="bg-amber-500/20 rounded-full px-1">1</span>
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-1">
                            c2 <span className="bg-green-500/20 rounded-full px-1">1</span>
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20 flex items-center gap-1">
                            c4 <span className="bg-pink-500/20 rounded-full px-1">1</span>
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1">
                            tradeanalysis <span className="bg-indigo-500/20 rounded-full px-1">1</span>
                          </span>
                        </div>
                        
                        {/* Write a quick note input */}
                        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                          <input
                            type="text"
                            placeholder="Write a quick note..."
                            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground border-none outline-none"
                            onClick={redirectToSignup}
                            readOnly
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-lg">😀</span>
                            <span className="text-lg">😊</span>
                            <span className="text-lg">😐</span>
                            <span className="text-lg">😔</span>
                            <span className="text-lg">😤</span>
                            <button 
                              onClick={redirectToSignup}
                              className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Mood Timeline Section - Always show with demo data if no real data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Mood Timeline</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{data?.mood?.timeline?.length || 2} entries</span>
                    <span>—</span>
                    <span>Stable</span>
                  </div>
                </div>
                <motion.button
                  onClick={() => toggleSection('moodTimeline')}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {collapsedSections.moodTimeline ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </motion.button>
              </div>

              <AnimatePresence initial={false}>
                {!collapsedSections.moodTimeline && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-6">
                      {/* AI Summary */}
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Brain className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-base font-semibold text-blue-700 dark:text-blue-300 mb-2">AI Summary</div>
                          <div className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                            {data?.mood?.timeline && data.mood.timeline.length > 0 
                              ? "Mood started neutral, improved to good after journaling, declined to neutral after journaling."
                              : "Mood remained consistently excellent throughout the trading session."
                            }
                          </div>
                        </div>
                      </div>

                      {/* Mood Timeline Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                          <span className="text-lg font-semibold">Mood Timeline</span>
                        </div>
                        <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {data?.mood?.timeline?.length || 6} mood entries
                        </span>
                      </div>
                        
                      {/* Timeline Container */}
                      <div className="relative">
                        {/* Show real mood data if available, otherwise show demo */}
                        {data?.mood?.timeline && data.mood.timeline.length > 0 ? (
                          <div className="relative space-y-6">
                            {/* Timeline Line */}
                            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border"></div>
                            
                            {data.mood.timeline.map((entry: any, index: number) => {
                              const getMoodEmoji = (mood: string) => {
                                switch (mood?.toLowerCase()) {
                                  case 'excellent': return '😊';
                                  case 'good': return '🙂';
                                  case 'neutral': return '😐';
                                  case 'poor': return '😔';
                                  case 'terrible': return '😤';
                                  default: return '😐';
                                }
                              };
                              
                              const getMoodColor = (mood: string) => {
                                switch (mood?.toLowerCase()) {
                                  case 'excellent': return 'text-green-500';
                                  case 'good': return 'text-green-400';
                                  case 'neutral': return 'text-yellow-500';
                                  case 'poor': return 'text-orange-500';
                                  case 'terrible': return 'text-red-500';
                                  default: return 'text-yellow-500';
                                }
                              };
                              
                              const getSourceLabel = (trigger: string, relatedId: string) => {
                                const normalized = (trigger || '').toLowerCase();
                                if (!normalized || normalized === 'unknown') {
                                  return '';
                                }
                                if (normalized === 'trade' || normalized === 'losing_trade' || normalized === 'winning_trade') {
                                  return trigger === 'losing_trade' ? 'Losing Trade' : 
                                         trigger === 'winning_trade' ? 'Winning Trade' : 'Trade';
                                }
                                if (normalized === 'quick_note' || normalized === 'note') {
                                  return 'Quick Note';
                                }
                                if (normalized === 'wellness') {
                                  return 'Wellness Activity';
                                }
                                return 'Manual Entry';
                              };
                              
                              return (
                                <div key={index} className="relative flex items-start gap-4">
                                  {/* Mood Circle */}
                                  <div className="relative z-10 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center text-xl">
                                    {getMoodEmoji(entry.mood)}
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-3">
                                        <span className={`text-lg font-semibold capitalize ${getMoodColor(entry.mood)}`}>
                                          {entry.mood && entry.mood.toLowerCase() !== 'unknown' ? entry.mood : ''}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                          {(() => {
                                            const ts = formatTime(entry.timestamp as any);
                                            return ts !== 'Unknown' ? (
                                              <span className="text-sm text-muted-foreground">{ts}</span>
                                            ) : (
                                              <span className="text-sm text-muted-foreground">—</span>
                                            );
                                          })()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className={`${
                                          entry.trigger === 'losing_trade' ? 'text-red-500' :
                                          entry.trigger === 'winning_trade' ? 'text-green-500' :
                                          entry.trigger === 'quick_note' || entry.trigger === 'note' ? 'text-blue-500' :
                                          'text-muted-foreground'
                                        }`}>
                                          {getSourceLabel(entry.trigger, entry.relatedId)}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Source Info */}
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
                                      </div>
                                      <span className={`${
                                        entry.trigger === 'losing_trade' ? 'text-red-500' :
                                        entry.trigger === 'winning_trade' ? 'text-green-500' :
                                        entry.trigger === 'quick_note' || entry.trigger === 'note' ? 'text-blue-500' :
                                        'text-muted-foreground'
                                      }`}>
                                        {getSourceLabel(entry.trigger, entry.relatedId)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="relative space-y-6">
                            {/* Timeline Line */}
                            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border"></div>
                            
                            {/* Demo Timeline Entries */}
                            <div className="relative flex items-start gap-4">
                              <div className="relative z-10 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center text-xl">
                                😐
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg font-semibold text-yellow-500">Neutral</span>
                                    <span className="text-sm text-muted-foreground">10:02 AM</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">neutral</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-red-500">Losing Trade</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
                                  </div>
                                  <span className="text-red-500">Losing Trade</span>
                                </div>
                              </div>
                            </div>

                            <div className="relative flex items-start gap-4">
                              <div className="relative z-10 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center text-xl">
                                😐
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg font-semibold text-yellow-500">Neutral</span>
                                    <span className="text-sm text-muted-foreground">10:56 AM</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">neutral</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-blue-500">Quick Note</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
                                  </div>
                                  <span className="text-blue-500">Quick Note</span>
                                </div>
                              </div>
                            </div>

                            <div className="relative flex items-start gap-4">
                              <div className="relative z-10 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center text-xl">
                                🙂
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg font-semibold text-green-400">Good</span>
                                    <span className="text-sm text-muted-foreground">11:55 AM</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">good</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-blue-500">Quick Note</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
                                  </div>
                                  <span className="text-blue-500">Quick Note</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Mood Trend */}
                        <div className="mt-6 pt-4 border-t border-border/30">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-muted-foreground">Mood Trend:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-500 font-medium">neutral</span>
                              <ArrowRight className="w-4 h-4 text-green-500" />
                              <span className="text-green-400 font-medium">good</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Trades Section - Show actual trades if available */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Today's Trades</h3>
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    {data?.trades?.length || 0}
                  </span>
                </div>
                <motion.button
                  onClick={redirectToSignup}
                  className="text-xs text-primary hover:underline"
                  title="Sign up to track your trades"
                >
                  View All →
                </motion.button>
              </div>

              <div className="p-4 rounded-xl border border-border/50 bg-muted/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-primary/10" />
                <div className="relative space-y-2">
                  {data?.trades && data.trades.length > 0 ? (
                    data.trades.map((trade: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded bg-background/50 border border-border/30">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-medium">{trade.symbol}</span>
                          {trade.direction && trade.direction.toLowerCase() !== 'unknown' && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              trade.direction === 'long' 
                                ? 'bg-green-500/10 text-green-500' 
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {trade.direction.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <div className="text-xs text-muted-foreground">
                            {trade.riskRewardRatio ? `${trade.riskRewardRatio}:1 RR` : ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(() => {
                              const ts = formatTime(trade.entryTime as any);
                              return ts !== 'Unknown' ? (
                                <div className="text-xs text-muted-foreground">{ts}</div>
                              ) : (
                                <div className="text-xs text-muted-foreground">—</div>
                              );
                            })()}
                          </div>
                          <div className={`font-mono text-sm font-medium ${
                            (trade.pnl || 0) > 0 ? 'text-green-500' : (trade.pnl || 0) < 0 ? 'text-red-500' : 'text-muted-foreground'
                          }`}>
                            {(trade.pnl || 0) > 0 ? '+' : ''}{formatCurrency(trade.pnl || 0)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No trades recorded for this day</p>
                    </div>
                  )}
                  
                  <motion.button
                    onClick={redirectToSignup}
                    className="w-full p-3 border-2 border-dashed border-primary/30 rounded text-sm text-primary hover:bg-primary/5 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    + Add Your Trades
                  </motion.button>
                </div>
              </div>
            </motion.div>



            {/* Calendar Snapshot Section */}
            {data?.options?.includeCalendar && data?.calendar && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Trading Calendar</h3>
                    <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                      {data.calendar.monthName} {data.calendar.year}
                    </span>
                  </div>
                  <motion.button
                    onClick={() => toggleSection('calendar')}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {collapsedSections.calendar ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </motion.button>
                </div>

                <AnimatePresence initial={false}>
                  {!collapsedSections.calendar && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold">
                            {data.calendar.monthName} {data.calendar.year}
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            Trading Activity Overview
                          </div>
                        </div>

                    {/* Mobile-First Calendar Design */}
                    <div className="space-y-2 lg:space-y-4">
                      {/* Day Headers - Responsive */}
                      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 lg:gap-3">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'Week'].map((day, index) => (
                          <div key={index} className="text-center text-[10px] sm:text-xs lg:text-sm font-semibold text-muted-foreground py-1 lg:py-2">
                            <span className="lg:hidden">{day}</span>
                            <span className="hidden lg:inline">
                              {index < 6 ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][index] : 'Week'}
                            </span>
                          </div>
                        ))}
                      </div>

                          {/* Generate weeks from calendar data */}
                          {(() => {
                            // Group days into weeks
                            const weeks: any[][] = [];
                            const firstDay = new Date(data.calendar.year, data.calendar.month, 1);
                            const lastDay = new Date(data.calendar.year, data.calendar.month + 1, 0);
                            const startingDayOfWeek = firstDay.getDay();
                            const daysInMonth = lastDay.getDate();
                            
                            // Create full calendar grid including prev/next month days
                            const allDays: any[] = [];
                            
                            // Previous month days
                            const prevMonth = new Date(data.calendar.year, data.calendar.month - 1, 0);
                            for (let i = startingDayOfWeek - 1; i >= 0; i--) {
                              const date = new Date(data.calendar.year, data.calendar.month - 1, prevMonth.getDate() - i);
                              allDays.push({
                                date,
                                day: date.getDate(),
                                pnl: 0,
                                tradesCount: 0,
                                winRate: 0,
                                avgRR: 0,
                                hasReflection: false,
                                hasNotes: false,
                                isToday: false,
                                isOtherMonth: true
                              });
                            }
                            
                            // Current month days
                            data.calendar.days.forEach(dayData => {
                              const date = new Date(dayData.date);
                              allDays.push({
                                ...dayData,
                                date,
                                isOtherMonth: false
                              });
                            });
                            
                            // Next month days to fill grid
                            const totalCells = Math.ceil(allDays.length / 7) * 7;
                            for (let day = 1; allDays.length < totalCells; day++) {
                              const date = new Date(data.calendar.year, data.calendar.month + 1, day);
                              allDays.push({
                                date,
                                day: date.getDate(),
                                pnl: 0,
                                tradesCount: 0,
                                winRate: 0,
                                avgRR: 0,
                                hasReflection: false,
                                hasNotes: false,
                                isToday: false,
                                isOtherMonth: true
                              });
                            }
                            
                            // Group into weeks
                            for (let i = 0; i < allDays.length; i += 7) {
                              weeks.push(allDays.slice(i, i + 7));
                            }
                            
                            return weeks.map((week, weekIndex) => {
                              // Calculate weekly summary
                              const weekDays = week.filter(day => !day.isOtherMonth && day.tradesCount > 0);
                              const weekTotalPnl = weekDays.reduce((sum, day) => sum + day.pnl, 0);
                              const weekActiveDays = weekDays.length;
                              
                              return (
                                <div key={weekIndex}>
                                  {/* Week Summary Header - Mobile Only */}
                                  <div className="flex items-center justify-between px-2 py-1 bg-muted/20 rounded-lg lg:hidden mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">Week {weekIndex + 1}</span>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className={`font-medium ${
                                        weekTotalPnl > 0 ? 'text-green-500' : 
                                        weekTotalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                                      }`}>
                                        {weekTotalPnl !== 0 ? formatCurrency(weekTotalPnl) : '$0'}
                                      </span>
                                      <span className="text-muted-foreground">• {weekActiveDays}d</span>
                                    </div>
                                  </div>
                                  
                                  {/* Week Row - 6 Days + Week Summary */}
                                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1 lg:gap-3">
                                    {/* Sunday through Friday (first 6 days) */}
                                    {week.slice(0, 6).map((day, dayIndex) => {
                                      const getDayClassName = () => {
                                        let classes = 'relative p-1 sm:p-2 lg:p-3 rounded border border-border/30 transition-all duration-200 cursor-pointer hover:border-primary/50 aspect-square sm:aspect-[6/5] lg:aspect-[6/5] min-h-[84px] sm:min-h-[96px] lg:min-h-[110px] flex flex-col overflow-hidden';
                                        
                                        if (day.isOtherMonth) classes += ' opacity-30';
                                        if (day.isToday) classes += ' ring-1 ring-primary/50 bg-primary/5';
                                        if (day.tradesCount > 0) classes += ' bg-muted/20';
                                        if (day.pnl > 0) classes += ' border-green-500/40';
                                        if (day.pnl < 0) classes += ' border-red-500/40';
                                        
                                        return classes;
                                      };
                                      
                                      const formatPnL = (pnl) => {
                                        if (pnl === 0) return null;
                                        // Ultra-compact formatting for mobile
                                        const absVal = Math.abs(pnl);
                                        let displayValue;
                                        if (absVal >= 10000) displayValue = `${pnl > 0 ? '+' : ''}${Math.round(pnl / 1000)}k`;
                                        else if (absVal >= 1000) displayValue = `${pnl > 0 ? '+' : ''}${(pnl / 1000).toFixed(1)}k`;
                                        else displayValue = `${pnl > 0 ? '+' : ''}${Math.round(pnl)}`;
                                        
                                        return (
                                          <div className={`text-[8px] sm:text-xs lg:text-sm font-medium leading-none ${pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {displayValue}
                                          </div>
                                        );
                                      };
                                      
                                      return (
                                        <motion.div
                                          key={`${weekIndex}-${dayIndex}`}
                                          className={getDayClassName()}
                                          onClick={redirectToSignup}
                                          whileHover={{ scale: 1.0 }}
                                          whileTap={{ scale: 0.98 }}
                                          title="Sign up to view day details"
                                        >
                                                                                  <div className="h-full flex flex-col justify-between">
                                          {/* Top Row - Date and Indicator */}
                                          <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[10px] sm:text-xs lg:text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl font-medium ${
                                              day.isOtherMonth ? 'text-muted-foreground/60' : 'text-foreground'
                                            }`}>
                                              {day.day}
                                            </span>
                                            {day.hasReflection && (
                                              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-500"></div>
                                            )}
                                          </div>
                                          
                                          {/* Bottom Row - Compact: P&L and Trades */}
                                          <div className="flex flex-col items-center lg:items-start leading-tight">
                                            <div className={`text-[8px] sm:text-[10px] lg:text-xs 2xl:text-sm 3xl:text-base 4xl:text-lg font-bold ${day.pnl > 0 ? 'text-green-500' : day.pnl < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                              {Math.abs(day.pnl) > 999 ? `${day.pnl > 0 ? '+' : ''}${(day.pnl/1000).toFixed(1)}k` : `${day.pnl > 0 ? '+' : ''}${Math.round(day.pnl)}`}
                                            </div>
                                            <div className="text-[8px] sm:text-[10px] lg:text-[11px] 2xl:text-xs 3xl:text-sm 4xl:text-base text-muted-foreground">
                                              {day.tradesCount} trades
                                            </div>
                                          </div>
                                        </div>
                                        </motion.div>
                                      );
                                    })}
                                    
                                    {/* Week Summary Column (replaces Saturday) */}
                                    <motion.div
                                      className="bg-muted/30 border border-border/50 rounded p-1 sm:p-2 lg:p-4 hover:bg-muted/50 transition-colors cursor-pointer aspect-square sm:aspect-[6/5] lg:aspect-[6/5] min-h-[84px] sm:min-h-[96px] lg:min-h-[110px] flex flex-col justify-center overflow-hidden"
                                      onClick={redirectToSignup}
                                      whileHover={{ scale: 1.01 }}
                                      title="Sign up to view weekly details"
                                    >
                                      <div className="text-center space-y-0 sm:space-y-1 lg:space-y-2 pt-1 pb-1 leading-tight">
                                        <div className="text-[8px] sm:text-[10px] lg:text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl font-medium text-muted-foreground truncate">
                                          W{weekIndex + 1}
                                        </div>
                                        <div className={`text-[8px] sm:text-xs lg:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl font-bold leading-tight truncate whitespace-nowrap ${
                                          weekTotalPnl > 0 ? 'text-green-500' : 
                                          weekTotalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                                        }`}>
                                          {Math.abs(weekTotalPnl) > 999 ? 
                                            `${weekTotalPnl > 0 ? '+' : ''}${(weekTotalPnl/1000).toFixed(1)}k` : 
                                            weekTotalPnl !== 0 ? `${weekTotalPnl > 0 ? '+' : ''}${Math.round(weekTotalPnl)}` : '$0'
                                          }
                                        </div>
                                        <div className="text-[10px] lg:text-xs 2xl:text-sm 3xl:text-base 4xl:text-lg text-muted-foreground leading-tight">
                                          {weekActiveDays}d
                                        </div>
                                      </div>
                                    </motion.div>
                                  </div>
                                  
                                  {/* Saturday Data - Show separately if exists */}
                                  {week[6] && week[6].tradesCount > 0 && (
                                    <div className="mt-2 p-2 bg-muted/10 rounded-lg border border-border/20">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Sat {week[6].day}:</span>
                                        <div className="flex items-center gap-2">
                                          {week[6].pnl !== 0 && (
                                            <span className={`font-medium ${week[6].pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                              {formatCurrency(week[6].pnl)}
                                            </span>
                                          )}
                                          <span className="text-muted-foreground">{week[6].tradesCount}t</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}



            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Ready to Start Your Trading Journal?</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Get the full experience with trade tracking, analytics, and AI insights.
              </p>
              <motion.button
                onClick={redirectToSignup}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
        </div>
      )}
    </div>
  );
}


