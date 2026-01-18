import { useState, useEffect } from 'react';
import { useUserProfileStore } from '@/store/useUserProfileStore';

/**
 * Style Theme System
 * 
 * Style themes control the overall visual aesthetic:
 * - Font family
 * - Background textures/colors
 * - Border and card styles
 * - Overall vibe
 * 
 * Works alongside useTheme (light/dark) and useAccentColor
 */

export type StyleTheme = 'default' | 'botanical';

export interface StyleThemeConfig {
  key: StyleTheme;
  name: string;
  description: string;
  fontFamily: string;
  fontFamilyMono: string;
  emoji: string;
  // Visual characteristics for preview
  preview: {
    bgColor: string;
    accentColor: string;
    fontPreview: string;
  };
}

export const styleThemes: Record<StyleTheme, StyleThemeConfig> = {
  default: {
    key: 'default',
    name: 'Default',
    description: 'Clean Apple-inspired design',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif',
    fontFamilyMono: 'SF Mono, ui-monospace, Menlo, monospace',
    emoji: '✨',
    preview: {
      bgColor: '#ffffff',
      accentColor: '#3b82f6',
      fontPreview: 'SF Pro',
    },
  },
  botanical: {
    key: 'botanical',
    name: 'Minimal',
    description: 'Bullet journal aesthetic with deep indigo',
    fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontFamilyMono: '"JetBrains Mono", "Fira Code", ui-monospace, Menlo, monospace',
    emoji: '🌿',
    preview: {
      bgColor: '#d3d3d3',
      accentColor: '#170895',
      fontPreview: 'JetBrains',
    },
  },
};

export const useStyleTheme = () => {
  const { profile, updateProfile, syncToFirestore } = useUserProfileStore();

  // Initialize from profile preferences, fallback to localStorage, then default
  const [styleTheme, setStyleThemeState] = useState<StyleTheme>(() => {
    // Priority 1: Profile preference
    if (profile?.preferences?.styleTheme) {
      return profile.preferences.styleTheme;
    }

    // Priority 2: localStorage
    const saved = localStorage.getItem('refine-style-theme') as StyleTheme;
    if (saved && styleThemes[saved]) {
      return saved;
    }

    // Priority 3: Default
    return 'default';
  });

  // Sync from profile when it loads - use JSON stringify to detect any preference change
  const profilePrefsJson = JSON.stringify(profile?.preferences || {});
  
  useEffect(() => {
    const profileTheme = profile?.preferences?.styleTheme;
    if (profileTheme && styleThemes[profileTheme]) {
      console.log('🎨 Profile preferences changed, style theme:', profileTheme);
      
      // Always apply CSS when profile preferences change
      const root = document.documentElement;
      const config = styleThemes[profileTheme];
      
      // Remove all style theme classes and add current
      Object.keys(styleThemes).forEach((key) => {
        root.classList.remove(`style-${key}`);
      });
      root.classList.add(`style-${profileTheme}`);
      root.style.setProperty('--font-primary', config.fontFamily);
      root.style.setProperty('--font-mono', config.fontFamilyMono);
      
      // Update state if different
      if (profileTheme !== styleTheme) {
        setStyleThemeState(profileTheme);
      }
      
      console.log('🎨 Applied style theme from profile:', profileTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePrefsJson]); // Watch entire preferences object for any changes

  // Apply style theme
  useEffect(() => {
    const root = document.documentElement;
    const config = styleThemes[styleTheme];

    console.log('🎨 Applying style theme:', styleTheme);

    // Remove all style theme classes
    Object.keys(styleThemes).forEach((key) => {
      root.classList.remove(`style-${key}`);
    });

    // Add current style theme class
    root.classList.add(`style-${styleTheme}`);

    // Set CSS custom properties for font
    root.style.setProperty('--font-primary', config.fontFamily);
    root.style.setProperty('--font-mono', config.fontFamilyMono);

    // Save to localStorage
    localStorage.setItem('refine-style-theme', styleTheme);

    // Sync to Firestore if different from profile
    if (profile && profile.preferences?.styleTheme !== styleTheme) {
      console.log('💾 Syncing style theme to Firestore:', styleTheme);
      updateProfile({
        preferences: {
          ...profile.preferences,
          styleTheme,
        },
      });
      syncToFirestore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleTheme]);

  const setStyleTheme = (theme: StyleTheme) => {
    console.log('🎨 Setting new style theme:', theme);
    setStyleThemeState(theme);
  };

  return {
    styleTheme,
    setStyleTheme,
    styleThemes,
    currentConfig: styleThemes[styleTheme],
  };
};
