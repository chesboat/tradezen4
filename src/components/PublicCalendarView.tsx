import React, { useEffect, useState } from 'react';
import { ShareCalendarSnapshot } from './ShareCalendarSnapshot';
import { Zap } from 'lucide-react';

export const PublicCalendarView: React.FC = () => {
  // Extract shareId from URL path
  const path = window.location.pathname;
  const shareId = path.split('/').pop();
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShareData = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const { db } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        
        const shareRef = doc(db, 'publicShares', shareId);
        const shareDoc = await getDoc(shareRef);

        if (!shareDoc.exists()) {
          setError('Calendar not found');
          setLoading(false);
          return;
        }

        const data = shareDoc.data();
        if (data.type !== 'calendar') {
          setError('Invalid share type');
          setLoading(false);
          return;
        }

        setShareData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading share:', err);
        setError('Failed to load calendar');
        setLoading(false);
      }
    };

    loadShareData();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold mb-2">Calendar Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'This calendar may have expired or been removed.'}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Zap className="w-4 h-4" />
            Start Your Trading Journal
          </a>
        </div>
      </div>
    );
  }

  // Render the calendar with the share data
  // Build URL params for ShareCalendarSnapshot component
  const { calendarData, theme, accentColor } = shareData;
  const dataParam = encodeURIComponent(btoa(JSON.stringify(calendarData)));
  
  // Temporarily construct URL params and pass to existing ShareCalendarSnapshot
  return (
    <div className="relative">
      <ShareCalendarSnapshot 
        data={calendarData}
        theme={theme || 'dark'}
        accentColor={accentColor || 'blue'}
      />
    </div>
  );
};

