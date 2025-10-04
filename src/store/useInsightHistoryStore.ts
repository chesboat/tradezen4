/**
 * Insight History Store
 * Stores all daily insights for premium users
 * Apple-style: Simple, persistent, searchable
 */

import { create } from 'zustand';
import { getDocs, collection, addDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { DailyInsight } from '@/lib/dailyInsightEngine';

export interface StoredInsight extends DailyInsight {
  id: string;
  userId: string;
  date: string; // ISO date string
  createdAt: Date;
  viewed: boolean;
}

interface InsightHistoryState {
  insights: StoredInsight[];
  loading: boolean;
  error: string | null;
  
  // Actions
  saveInsight: (insight: DailyInsight, date: string) => Promise<void>;
  loadHistory: (accountId?: string) => Promise<void>;
  markViewed: (insightId: string) => Promise<void>;
  getInsightsByType: (type: string) => StoredInsight[];
  getInsightsByDateRange: (startDate: string, endDate: string) => StoredInsight[];
  searchInsights: (query: string) => StoredInsight[];
}

export const useInsightHistoryStore = create<InsightHistoryState>((set, get) => ({
  insights: [],
  loading: false,
  error: null,
  
  saveInsight: async (insight: DailyInsight, date: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) return;
      
      // Check if insight for this date already exists
      const existingInsight = get().insights.find(
        i => i.date === date && i.type === insight.type
      );
      
      if (existingInsight) {
        console.log('Insight for this date already exists, skipping save');
        return;
      }
      
      // Save to Firestore (exclude undefined fields)
      const docData: any = {
        userId: currentUser.uid,
        date,
        type: insight.type,
        title: insight.title,
        message: insight.message,
        suggestion: insight.suggestion,
        metric: insight.metric,
        icon: insight.icon,
        severity: insight.severity,
        createdAt: Timestamp.now(),
        viewed: false,
      };
      
      // Only include optional fields if they're defined
      if (insight.actionType !== undefined) {
        docData.actionType = insight.actionType;
      }
      
      const docRef = await addDoc(collection(db, 'insightHistory'), docData);
      
      // Update local state
      const storedInsight: StoredInsight = {
        ...insight,
        id: docRef.id,
        userId: currentUser.uid,
        date,
        createdAt: new Date(),
        viewed: false,
      };
      
      set(state => ({
        insights: [storedInsight, ...state.insights],
      }));
      
      console.log('✅ Insight saved to history:', insight.title);
    } catch (error) {
      console.error('Failed to save insight:', error);
      set({ error: 'Failed to save insight' });
    }
  },
  
  loadHistory: async (accountId?: string) => {
    try {
      set({ loading: true, error: null });
      
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) {
        set({ loading: false });
        return;
      }
      
      // Query Firestore
      const q = query(
        collection(db, 'insightHistory'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(100) // Limit to last 100 insights
      );
      
      const snapshot = await getDocs(q);
      const insights: StoredInsight[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        insights.push({
          id: doc.id,
          userId: data.userId,
          date: data.date,
          type: data.type,
          title: data.title,
          message: data.message,
          suggestion: data.suggestion,
          metric: data.metric,
          icon: data.icon,
          severity: data.severity,
          actionType: data.actionType,
          confidence: data.confidence || 50,
          impact: data.impact || 50,
          habitId: data.habitId,
          actions: data.actions,
          createdAt: data.createdAt?.toDate() || new Date(),
          viewed: data.viewed || false,
        });
      });
      
      set({ insights, loading: false });
      console.log(`✅ Loaded ${insights.length} insights from history`);
    } catch (error) {
      console.error('Failed to load insight history:', error);
      set({ error: 'Failed to load history', loading: false });
    }
  },
  
  markViewed: async (insightId: string) => {
    // TODO: Implement mark as viewed in Firestore
    set(state => ({
      insights: state.insights.map(i =>
        i.id === insightId ? { ...i, viewed: true } : i
      ),
    }));
  },
  
  getInsightsByType: (type: string) => {
    return get().insights.filter(i => i.type === type);
  },
  
  getInsightsByDateRange: (startDate: string, endDate: string) => {
    return get().insights.filter(i => i.date >= startDate && i.date <= endDate);
  },
  
  searchInsights: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return get().insights.filter(i =>
      i.title.toLowerCase().includes(lowerQuery) ||
      i.message.toLowerCase().includes(lowerQuery) ||
      i.suggestion?.toLowerCase().includes(lowerQuery)
    );
  },
}));

