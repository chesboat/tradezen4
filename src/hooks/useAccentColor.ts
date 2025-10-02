import { useState, useEffect } from 'react';

export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'mono';

// Define color palettes for light and dark modes
export const accentColorPalettes = {
  blue: {
    name: 'Ocean Blue',
    emoji: '🔵',
    isPremium: false,
    light: {
      primary: '221.2 83.2% 53.3%',      // hsl format for CSS
      primaryForeground: '210 40% 98%',
      ring: '221.2 83.2% 53.3%',
    },
    dark: {
      primary: '217 91% 60%',
      primaryForeground: '0 0% 100%',
      ring: '217 91% 60%',
    }
  },
  purple: {
    name: 'Royal Purple',
    emoji: '🟣',
    isPremium: true,
    light: {
      primary: '271 91% 65%',
      primaryForeground: '210 40% 98%',
      ring: '271 91% 65%',
    },
    dark: {
      primary: '271 91% 70%',
      primaryForeground: '0 0% 100%',
      ring: '271 91% 70%',
    }
  },
  green: {
    name: 'Trading Green',
    emoji: '🟢',
    isPremium: true,
    light: {
      primary: '142 76% 36%',
      primaryForeground: '0 0% 100%',
      ring: '142 76% 36%',
    },
    dark: {
      primary: '142 71% 45%',
      primaryForeground: '0 0% 100%',
      ring: '142 71% 45%',
    }
  },
  orange: {
    name: 'Sunset Orange',
    emoji: '🟠',
    isPremium: true,
    light: {
      primary: '25 95% 53%',
      primaryForeground: '0 0% 100%',
      ring: '25 95% 53%',
    },
    dark: {
      primary: '25 95% 58%',
      primaryForeground: '0 0% 100%',
      ring: '25 95% 58%',
    }
  },
  red: {
    name: 'Power Red',
    emoji: '🔴',
    isPremium: true,
    light: {
      primary: '0 84% 60%',
      primaryForeground: '0 0% 100%',
      ring: '0 84% 60%',
    },
    dark: {
      primary: '0 84% 65%',
      primaryForeground: '0 0% 100%',
      ring: '0 84% 65%',
    }
  },
  mono: {
    name: 'Monochrome',
    emoji: '⚫',
    isPremium: true,
    light: {
      primary: '0 0% 20%',
      primaryForeground: '0 0% 100%',
      ring: '0 0% 20%',
    },
    dark: {
      primary: '0 0% 85%',
      primaryForeground: '0 0% 10%',
      ring: '0 0% 85%',
    }
  }
};

export const useAccentColor = () => {
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('refine-accent-color');
    return (saved as AccentColor) || 'blue';
  });

  // Apply accent color to CSS variables
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = root.classList.contains('dark');
    const palette = accentColorPalettes[accentColor];
    const colors = isDark ? palette.dark : palette.light;

    // Update CSS custom properties with !important to override @layer base
    root.style.setProperty('--primary', colors.primary, 'important');
    root.style.setProperty('--primary-foreground', colors.primaryForeground, 'important');
    root.style.setProperty('--ring', colors.ring, 'important');

    // Save to localStorage
    localStorage.setItem('refine-accent-color', accentColor);
  }, [accentColor]);

  // Re-apply when theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const root = window.document.documentElement;
      const isDark = root.classList.contains('dark');
      const palette = accentColorPalettes[accentColor];
      const colors = isDark ? palette.dark : palette.light;

      // Update with !important to override @layer base
      root.style.setProperty('--primary', colors.primary, 'important');
      root.style.setProperty('--primary-foreground', colors.primaryForeground, 'important');
      root.style.setProperty('--ring', colors.ring, 'important');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [accentColor]);

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
  };

  return { 
    accentColor, 
    setAccentColor,
    accentColorPalettes 
  };
};

