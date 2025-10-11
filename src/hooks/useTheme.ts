import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('tradzen-theme');
    if (savedTheme) {
      return savedTheme as Theme;
    }
    // 🍎 APPLE WAY: First-time users get system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme
    root.classList.remove('light', 'dark');
    
    // Add current theme
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('tradzen-theme', theme);
  }, [theme]);

  // 🍎 APPLE WAY: Listen for system theme changes (only if user hasn't manually toggled)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-update if user hasn't manually set a preference
      const hasManualPreference = localStorage.getItem('tradzen-theme-manual') === 'true';
      if (!hasManualPreference) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const toggleTheme = () => {
    // Mark as manual preference so system changes don't override
    localStorage.setItem('tradzen-theme-manual', 'true');
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}; 