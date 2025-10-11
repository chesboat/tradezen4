import { motion } from 'framer-motion';
import { Zap, Crown, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUserProfileStore } from '@/store/useUserProfileStore';

export const TrialCountdown = () => {
  const { tier, isTrial } = useSubscription();
  const { setCurrentView } = useNavigationStore();
  const { profile } = useUserProfileStore();

  // Early return if no trial or no profile data
  if (!isTrial || !profile?.trialEndsAt) return null;

  // Calculate days remaining
  const trialEnd = profile.trialEndsAt;
  
  // Handle Firestore Timestamp objects
  let endDate: Date;
  try {
    if (trialEnd instanceof Date) {
      endDate = trialEnd;
    } else if (typeof trialEnd === 'object' && 'toDate' in trialEnd) {
      // Firestore Timestamp
      endDate = (trialEnd as any).toDate();
    } else {
      endDate = new Date(trialEnd);
    }
    
    // Validate the date
    if (isNaN(endDate.getTime())) {
      return null;
    }
  } catch (error) {
    console.error('Error parsing trial end date:', error);
    return null;
  }

  const now = new Date();
  const endDate = trialEnd instanceof Date ? trialEnd : new Date(trialEnd);
  const msRemaining = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));

  // Don't show if trial expired
  if (daysRemaining < 0) return null;

  const isExpiringSoon = daysRemaining <= 2;
  const isLastDay = daysRemaining <= 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl p-3 border
        ${isLastDay 
          ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30' 
          : isExpiringSoon
          ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
          : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${isLastDay 
            ? 'bg-gradient-to-br from-orange-500 to-red-500' 
            : 'bg-gradient-to-br from-blue-500 to-purple-500'
          }
        `}>
          <Zap className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Premium Trial
            </span>
            {isExpiringSoon && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 font-medium">
                Ending Soon
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
            {isLastDay
              ? hoursRemaining === 1 
                ? '1 hour left'
                : `${hoursRemaining} hours left`
              : daysRemaining === 1
              ? '1 day left'
              : `${daysRemaining} days left`
            }
          </div>
        </div>

        <button
          onClick={() => setCurrentView('pricing')}
          className="px-3 py-1.5 bg-[var(--accent-color)] text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1 whitespace-nowrap"
        >
          Upgrade
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {isExpiringSoon && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-xs text-[var(--text-secondary)]">
            {isLastDay
              ? '🎯 Last chance! Keep your AI Coach, unlimited features, and all your data.'
              : '✨ Upgrade now to keep unlimited AI Coach, insights, and premium features.'
            }
          </p>
        </div>
      )}
    </motion.div>
  );
};

// Compact version for sidebar
export const TrialCountdownCompact = () => {
  const { tier, isTrial } = useSubscription();
  const { setCurrentView } = useNavigationStore();
  const { profile } = useUserProfileStore();

  // Early return if no trial or no profile data
  if (!isTrial || !profile?.trialEndsAt) return null;

  const trialEnd = profile.trialEndsAt;
  
  // Handle Firestore Timestamp objects
  let endDate: Date;
  try {
    if (trialEnd instanceof Date) {
      endDate = trialEnd;
    } else if (typeof trialEnd === 'object' && 'toDate' in trialEnd) {
      // Firestore Timestamp
      endDate = (trialEnd as any).toDate();
    } else {
      endDate = new Date(trialEnd);
    }
    
    // Validate the date
    if (isNaN(endDate.getTime())) {
      return null;
    }
  } catch (error) {
    console.error('Error parsing trial end date:', error);
    return null;
  }

  const now = new Date();
  const msRemaining = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return null;

  const isExpiringSoon = daysRemaining <= 2;

  return (
    <button
      onClick={() => setCurrentView('pricing')}
      className={`
        w-full p-2.5 rounded-lg border transition-all
        ${isExpiringSoon
          ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 hover:border-orange-500/50'
          : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:border-blue-500/50'
        }
      `}
    >
      <div className="flex items-center gap-2">
        <Zap className={`w-4 h-4 ${isExpiringSoon ? 'text-orange-500' : 'text-blue-500'}`} />
        <div className="flex-1 text-left">
          <div className="text-xs font-medium text-[var(--text-primary)]">
            Trial: {daysRemaining}d left
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">
            Tap to upgrade
          </div>
        </div>
        <Crown className="w-3.5 h-3.5 text-[var(--accent-color)]" />
      </div>
    </button>
  );
};

