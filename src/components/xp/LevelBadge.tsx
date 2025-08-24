import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { PrestigeIcon } from './PrestigeIcon';
import { getPrestigeTheme, hasPrestigeTheme } from '@/lib/xp/prestige';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  prestige: number;
  className?: string;
  showPrestigeText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  prestige,
  className = '',
  showPrestigeText = true,
  size = 'md'
}) => {
  const theme = getPrestigeTheme(prestige);
  const hasPrestige = hasPrestigeTheme(prestige);
  
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'sm',
      gap: 'gap-1'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'md', 
      gap: 'gap-2'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'lg',
      gap: 'gap-2'
    }
  } as const;

  const sizeConfig = sizeClasses[size];

  return (
    <motion.div
      className={cn(
        'inline-flex items-center rounded-lg font-medium transition-all duration-300',
        sizeConfig.container,
        sizeConfig.gap,
        hasPrestige ? 'border-2' : 'border border-primary/20',
        hasPrestige ? 'bg-gradient-to-r from-background/80 to-background/60' : 'bg-primary/5',
        className
      )}
      style={hasPrestige ? {
        borderColor: theme.colors.border,
        boxShadow: `0 0 8px ${theme.colors.glow}20`
      } : {}}
      whileHover={hasPrestige ? { 
        scale: 1.02,
        boxShadow: `0 0 12px ${theme.colors.glow}40`
      } : { scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {hasPrestige ? (
        <PrestigeIcon 
          theme={theme} 
          size={sizeConfig.icon as 'sm' | 'md' | 'lg'} 
        />
      ) : (
        <Trophy className={cn(
          'text-primary',
          size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
        )} />
      )}
      
      <span className="text-foreground font-semibold">
        Level {level}
      </span>
      
      {hasPrestige && showPrestigeText && (
        <span 
          className="text-xs font-medium opacity-80"
          style={{ color: theme.colors.border }}
        >
          {theme.label}
          {prestige > 10 && ` ${prestige}`}
        </span>
      )}
    </motion.div>
  );
};
