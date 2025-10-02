import React from 'react';
import { Crown, Lock, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'subtle' | 'inline' | 'icon-only';
type BadgeSize = 'sm' | 'md' | 'lg';

interface PremiumBadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  showIcon?: boolean;
  text?: string;
  className?: string;
  animate?: boolean;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  variant = 'default',
  size = 'sm',
  showIcon = true,
  text = 'Premium',
  className,
  animate = true,
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-1 gap-1',
    lg: 'text-sm px-3 py-1.5 gap-1.5',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  const variantClasses = {
    default: 'bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-md',
    subtle: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-medium rounded-md',
    inline: 'bg-transparent text-orange-500 font-semibold',
    'icon-only': 'bg-orange-500/10 text-orange-500 rounded-full p-1',
  };

  const baseClasses = cn(
    'inline-flex items-center justify-center',
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  const Icon = variant === 'default' ? Crown : Lock;

  const content = (
    <>
      {showIcon && variant !== 'icon-only' && (
        <Icon className={iconSizes[size]} />
      )}
      {variant === 'icon-only' ? (
        <Crown className={iconSizes[size]} />
      ) : (
        <span>{text}</span>
      )}
    </>
  );

  if (animate) {
    return (
      <motion.span
        className={baseClasses}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        {content}
      </motion.span>
    );
  }

  return <span className={baseClasses}>{content}</span>;
};

interface LockedFeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onUpgrade?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const LockedFeatureCard: React.FC<LockedFeatureCardProps> = ({
  title,
  description,
  icon,
  onUpgrade,
  children,
  className,
}) => {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl border-2 border-dashed border-border/50 bg-muted/20 p-6',
        onUpgrade && 'cursor-pointer hover:border-orange-500/30 hover:bg-muted/30 transition-all',
        className
      )}
      onClick={onUpgrade}
      whileHover={onUpgrade ? { scale: 1.01 } : undefined}
      whileTap={onUpgrade ? { scale: 0.99 } : undefined}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 pointer-events-none" />
      
      {/* Lock icon watermark */}
      <div className="absolute top-4 right-4 opacity-10">
        <Lock className="w-16 h-16 text-foreground" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <PremiumBadge variant="default" size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        {children}

        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="mt-4 w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Premium
          </button>
        )}
      </div>
    </motion.div>
  );
};

interface UpgradePromptProps {
  feature: string;
  tier: 'basic' | 'premium';
  onUpgrade: () => void;
  onDismiss?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  tier,
  onUpgrade,
  onDismiss,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)]"
    >
      <div className="bg-background border border-border rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">Upgrade to {tier === 'basic' ? 'Basic' : 'Premium'}</h4>
              <PremiumBadge variant="subtle" size="sm" text={tier === 'basic' ? '$19/mo' : '$39/mo'} showIcon={false} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {feature} is only available on {tier === 'basic' ? 'Basic' : 'Premium'} plan
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={onUpgrade}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
              >
                Upgrade Now
              </button>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-4 py-2 bg-muted/30 text-foreground rounded-lg font-medium hover:bg-muted/50 transition-colors text-sm"
                >
                  Maybe Later
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

