import { useState, useEffect } from 'react';
import { useUserProfileStore } from '@/store/useUserProfileStore';

export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'mono';

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
  pink: {
    name: 'Hot Pink',
    emoji: '💗',
    isPremium: true,
    light: {
      primary: '330 81% 60%',
      primaryForeground: '0 0% 100%',
      ring: '330 81% 60%',
    },
    dark: {
      primary: '330 81% 65%',
      primaryForeground: '0 0% 100%',
      ring: '330 81% 65%',
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
  const { profile, updateProfile, syncToFirestore } = useUserProfileStore();
  
  // Initialize from profile preferences, fallback to localStorage, then default to blue
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    if (profile?.preferences?.accentColor) {
      return profile.preferences.accentColor;
    }
    const saved = localStorage.getItem('refine-accent-color');
    return (saved as AccentColor) || 'blue';
  });

  // Sync from profile when it loads
  useEffect(() => {
    if (profile?.preferences?.accentColor && profile.preferences.accentColor !== accentColor) {
      console.log('🎨 Loading accent color from profile:', profile.preferences.accentColor);
      setAccentColorState(profile.preferences.accentColor);
    }
  }, [profile?.preferences?.accentColor]);

  // Apply accent color by setting data attribute AND CSS variables
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = root.classList.contains('dark');
    const palette = accentColorPalettes[accentColor];
    const colors = isDark ? palette.dark : palette.light;

    console.log('🎨 Applying accent color:', accentColor, 'isDark:', isDark, 'colors:', colors);

    // Set data attribute for CSS targeting
    root.setAttribute('data-accent', accentColor);

    // Update CSS custom properties (these should override @layer base)
    root.style.setProperty('--primary', colors.primary, 'important');
    root.style.setProperty('--primary-foreground', colors.primaryForeground, 'important');
    root.style.setProperty('--ring', colors.ring, 'important');
    
    console.log('✅ CSS variables set:', {
      primary: root.style.getPropertyValue('--primary'),
      primaryForeground: root.style.getPropertyValue('--primary-foreground'),
      ring: root.style.getPropertyValue('--ring')
    });

    // Save to localStorage (for immediate persistence)
    localStorage.setItem('refine-accent-color', accentColor);
    
    // Save to Firestore (for cross-device sync)
    if (profile) {
      updateProfile({
        preferences: {
          ...profile.preferences,
          accentColor,
        },
      });
      // Sync to Firestore (debounced in the background)
      syncToFirestore();
    }
  }, [accentColor, profile, updateProfile, syncToFirestore]);

  // Re-apply when theme changes (watch for class changes on html element)
  useEffect(() => {
    let isApplying = false; // Prevent infinite loop
    
    const observer = new MutationObserver((mutations) => {
      // Check if the mutation is actually a theme change (class change)
      const themeChanged = mutations.some(mutation => {
        if (mutation.attributeName === 'class') {
          const oldClasses = mutation.oldValue?.split(' ') || [];
          const newClasses = Array.from((mutation.target as HTMLElement).classList);
          const themeWasLight = oldClasses.includes('light');
          const themeWasDark = oldClasses.includes('dark');
          const themeIsLight = newClasses.includes('light');
          const themeIsDark = newClasses.includes('dark');
          return (themeWasLight !== themeIsLight) || (themeWasDark !== themeIsDark);
        }
        return false;
      });

      if (themeChanged && !isApplying) {
        isApplying = true;
        
        // Read DIRECTLY from localStorage to avoid stale closure
        const currentAccentColor = (localStorage.getItem('refine-accent-color') as AccentColor) || 'blue';
        console.log('🌗 Theme changed, re-applying accent color:', currentAccentColor);
        
        const root = window.document.documentElement;
        const isDark = root.classList.contains('dark');
        const palette = accentColorPalettes[currentAccentColor];
        const colors = isDark ? palette.dark : palette.light;

        root.style.setProperty('--primary', colors.primary, 'important');
        root.style.setProperty('--primary-foreground', colors.primaryForeground, 'important');
        root.style.setProperty('--ring', colors.ring, 'important');
        
        setTimeout(() => { isApplying = false; }, 100);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true // Track old value to detect actual changes
    });

    return () => observer.disconnect();
  }, []); // Empty deps - observer only needs to be set up once

  const setAccentColor = (color: AccentColor) => {
    console.log('🎨 Setting new accent color:', color);
    setAccentColorState(color);
  };

  return { 
    accentColor, 
    setAccentColor,
    accentColorPalettes 
  };
};

