import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'md', 
  showLabel = false 
}) => {
  const { theme, toggleTheme } = useTheme();
  
  const sizeClasses = {
    sm: 'w-10 h-6',
    md: 'w-12 h-7',
    lg: 'w-12 h-7'
  };
  
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 14
  };

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {theme === 'light' ? 'Light' : 'Dark'}
        </span>
      )}
      
      <button
        onClick={toggleTheme}
        className={`
          relative ${sizeClasses[size]} rounded-full p-1 transition-all duration-300
          ${theme === 'light' 
            ? 'bg-gray-200 hover:bg-gray-300' 
            : 'bg-gray-700 hover:bg-gray-600'
          }
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${theme === 'light' ? 'focus:ring-offset-white' : 'focus:ring-offset-gray-900'}
        `}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <motion.div
          className={`
            absolute inset-1 rounded-full bg-white dark:bg-gray-900 shadow-md
            flex items-center justify-center transition-transform duration-300
            ${theme === 'light' ? 'translate-x-0' : `translate-x-[${sizeClasses[size].split(' ')[0].replace('w-', '').replace('10', '16').replace('12', '20').replace('14', '24')}px]`}
          `}
          animate={{ 
            x: theme === 'light' ? 0 : size === 'sm' ? 16 : 20 
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {theme === 'light' ? (
            <Sun 
              size={iconSizes[size]} 
              className="text-yellow-500 transition-colors duration-300" 
            />
          ) : (
            <Moon 
              size={iconSizes[size]} 
              className="text-blue-400 transition-colors duration-300" 
            />
          )}
        </motion.div>
      </button>
    </div>
  );
}; 