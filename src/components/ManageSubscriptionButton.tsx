import { useState } from 'react';
import { CreditCard, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToCustomerPortal } from '@/lib/stripe';
import toast from 'react-hot-toast';

interface ManageSubscriptionButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const ManageSubscriptionButton = ({ 
  variant = 'secondary',
  size = 'md',
  fullWidth = false 
}: ManageSubscriptionButtonProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    if (!currentUser) {
      toast.error('Please sign in to manage subscription');
      return;
    }

    setLoading(true);
    try {
      await redirectToCustomerPortal(currentUser.uid);
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error(error.message || 'Failed to open subscription management');
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-2.5 px-5 text-base',
    lg: 'py-3 px-6 text-lg',
  };

  const variantClasses = {
    primary: 'bg-[var(--accent-color)] text-white hover:opacity-90',
    secondary: 'bg-[var(--background-secondary)] text-[var(--text-primary)] hover:bg-[var(--background-tertiary)]',
    ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-secondary)]',
  };

  return (
    <button
      onClick={handleManageSubscription}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
      `}
    >
      <CreditCard className="w-4 h-4" />
      {loading ? 'Loading...' : 'Manage Subscription'}
      <ExternalLink className="w-3 h-3 opacity-50" />
    </button>
  );
};

