import { useEffect } from 'react';

/**
 * Apple-style theme detection for public pages
 * Detects and respects the viewer's system preference (light/dark mode)
 * Automatically updates when system theme changes
 */
export const useSystemTheme = () => {
  useEffect(() => {
    const detectAndApplyTheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      
      // Apply system preference
      root.classList.add(prefersDark ? 'dark' : 'light');
      
      console.log('🎨 System theme applied:', prefersDark ? 'dark' : 'light');
    };

    // Apply theme on mount
    detectAndApplyTheme();

    // Listen for system theme changes (when user changes OS theme)
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
      console.log('🎨 System theme changed:', e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener('change', handleThemeChange);
      return () => darkModeQuery.removeEventListener('change', handleThemeChange);
    } 
    // Fallback for older browsers
    else if (darkModeQuery.addListener) {
      darkModeQuery.addListener(handleThemeChange);
      return () => darkModeQuery.removeListener(handleThemeChange);
    }
  }, []);
};

