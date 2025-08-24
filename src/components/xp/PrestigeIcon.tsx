import React from 'react';
import { PrestigeTheme } from '@/lib/xp/constants';

interface PrestigeIconProps {
  theme: PrestigeTheme;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PrestigeIcon: React.FC<PrestigeIconProps> = ({ 
  theme, 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  if (!theme.iconName) {
    return null;
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`gradient-${theme.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.colors.gradient.from} />
            <stop offset="100%" stopColor={theme.colors.gradient.to} />
          </linearGradient>
          <filter id={`glow-${theme.key}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Medal base shape - geometric and clean */}
        <circle
          cx="12"
          cy="12"
          r="10"
          fill={`url(#gradient-${theme.key})`}
          stroke={theme.colors.border}
          strokeWidth="1"
          filter={`url(#glow-${theme.key})`}
        />
        
        {/* Inner geometric pattern based on prestige level */}
        {theme.key === 'bronze' && (
          <polygon
            points="12,6 15,10 12,14 9,10"
            fill="rgba(255,255,255,0.3)"
          />
        )}
        
        {theme.key === 'silver' && (
          <>
            <polygon points="12,6 15,10 12,14 9,10" fill="rgba(255,255,255,0.3)" />
            <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.2)" />
          </>
        )}
        
        {theme.key === 'gold' && (
          <>
            <polygon points="12,5 16,9 16,15 12,19 8,15 8,9" fill="rgba(255,255,255,0.3)" />
            <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.4)" />
          </>
        )}
        
        {theme.key === 'platinum' && (
          <>
            <polygon points="12,4 17,8 17,16 12,20 7,16 7,8" fill="rgba(255,255,255,0.3)" />
            <polygon points="12,8 14,10 12,16 10,10" fill="rgba(255,255,255,0.2)" />
          </>
        )}
        
        {theme.key === 'diamond' && (
          <>
            <polygon points="12,4 18,12 12,20 6,12" fill="rgba(255,255,255,0.4)" />
            <polygon points="12,7 15,12 12,17 9,12" fill="rgba(255,255,255,0.2)" />
          </>
        )}
        
        {theme.key === 'ruby' && (
          <>
            <polygon points="12,3 19,10 15,21 9,21 5,10" fill="rgba(255,255,255,0.3)" />
            <polygon points="12,6 16,11 12,18 8,11" fill="rgba(255,255,255,0.2)" />
          </>
        )}
        
        {theme.key === 'emerald' && (
          <>
            <polygon points="12,3 20,8 18,16 12,21 6,16 4,8" fill="rgba(255,255,255,0.3)" />
            <polygon points="12,6 17,10 15,14 12,18 9,14 7,10" fill="rgba(255,255,255,0.2)" />
          </>
        )}
        
        {theme.key === 'sapphire' && (
          <>
            <polygon points="12,2 21,9 19,15 12,22 5,15 3,9" fill="rgba(255,255,255,0.3)" />
            <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.2)" />
            <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.3)" />
          </>
        )}
        
        {theme.key === 'onyx' && (
          <>
            <polygon points="12,2 22,12 12,22 2,12" fill="rgba(255,255,255,0.2)" />
            <polygon points="12,5 19,12 12,19 5,12" fill="rgba(255,255,255,0.1)" />
            <polygon points="12,8 16,12 12,16 8,12" fill="rgba(255,255,255,0.2)" />
          </>
        )}
        
        {theme.key === 'obsidian' && (
          <>
            <polygon points="12,1 23,12 12,23 1,12" fill="rgba(138,43,226,0.3)" />
            <polygon points="12,4 20,12 12,20 4,12" fill="rgba(138,43,226,0.2)" />
            <polygon points="12,7 17,12 12,17 7,12" fill="rgba(138,43,226,0.4)" />
            <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.6)" />
          </>
        )}
      </svg>
    </div>
  );
};
