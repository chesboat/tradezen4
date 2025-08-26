import { useState, useCallback } from 'react';
import { XpService } from '@/lib/xp/XpService';
import { useUserProfileStore } from '@/store/useUserProfileStore';

export const useXpRewards = () => {
  const [showLevelUpToast, setShowLevelUpToast] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null);
  const { profile } = useUserProfileStore();

  const awardXp = useCallback(async (delta: number, meta?: any) => {
    const oldLevel = profile?.xp?.level || 1;
    
    try {
      await XpService.addXp(delta, meta);
      
      // Check if user leveled up
      const newProfile = useUserProfileStore.getState().profile;
      const newLevel = newProfile?.xp?.level || 1;
      
      if (newLevel > oldLevel) {
        setLevelUpData({ level: newLevel });
        setShowLevelUpToast(true);
      }
    } catch (error) {
      console.error('Failed to award XP:', error);
    }
  }, [profile?.xp?.level]);

  const closeLevelUpToast = useCallback(() => {
    setShowLevelUpToast(false);
    setLevelUpData(null);
  }, []);

  return {
    awardXp,
    showLevelUpToast,
    levelUpData,
    closeLevelUpToast,
    canPrestige: profile?.xp?.canPrestige ?? false,
    currentLevel: profile?.xp?.level || 1,
    prestige: profile?.xp?.prestige || 0
  };
};
