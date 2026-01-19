import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserProfileStore } from '@/store/useUserProfileStore';

/**
 * Custom Colors System - Premium Feature
 * Allows users to set their own background and accent colors
 * Supports separate colors for light and dark modes
 */

export interface CustomColorSet {
  background: string | null; // Hex color or null for default
  accent: string | null; // Hex color or null for default
}

export interface CustomColors {
  light: CustomColorSet;
  dark: CustomColorSet;
}

// Legacy format for migration
interface LegacyCustomColors {
  background: string | null;
  accent: string | null;
}

// Convert hex to HSL string for CSS variables
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 50%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Calculate contrasting foreground color
function getContrastColor(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 100%';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark colors, dark for light colors
  return luminance > 0.5 ? '0 0% 10%' : '0 0% 100%';
}

// Lighten a color for card backgrounds
function lightenHex(hex: string, amount: number = 0.1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  
  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Darken a color for borders
function darkenHex(hex: string, amount: number = 0.1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  
  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const defaultCustomColors: CustomColors = {
  light: { background: null, accent: null },
  dark: { background: null, accent: null },
};

// Helper to extract color set from object
function extractColorSet(obj: unknown): CustomColorSet {
  if (!obj || typeof obj !== 'object') {
    return { background: null, accent: null };
  }
  const o = obj as Record<string, unknown>;
  return {
    background: typeof o.background === 'string' ? o.background : null,
    accent: typeof o.accent === 'string' ? o.accent : null,
  };
}

// Migrate legacy format to new format
function migrateCustomColors(saved: unknown): CustomColors {
  if (!saved || typeof saved !== 'object') {
    return defaultCustomColors;
  }
  
  const obj = saved as Record<string, unknown>;
  
  // Check if it's already in new format (has light and dark objects)
  if ('light' in obj && 'dark' in obj && typeof obj.light === 'object' && typeof obj.dark === 'object') {
    return {
      light: extractColorSet(obj.light),
      dark: extractColorSet(obj.dark),
    };
  }
  
  // Legacy format: { background, accent } - apply to both modes
  const legacyColors = extractColorSet(obj);
  
  if (legacyColors.background || legacyColors.accent) {
    return {
      light: { ...legacyColors },
      dark: { ...legacyColors },
    };
  }
  
  return defaultCustomColors;
}

export const useCustomColors = () => {
  const { profile, updateProfile, syncToFirestore } = useUserProfileStore();
  
  // Track current theme mode
  const [isDark, setIsDark] = useState(() => 
    document.documentElement.classList.contains('dark')
  );
  
  // Initialize from profile or localStorage
  const [customColors, setCustomColorsState] = useState<CustomColors>(() => {
    // Try profile first
    if (profile?.preferences?.customColors) {
      return migrateCustomColors(profile.preferences.customColors);
    }
    
    // Try localStorage
    const saved = localStorage.getItem('refine-custom-colors');
    if (saved) {
      try {
        return migrateCustomColors(JSON.parse(saved));
      } catch {}
    }
    
    return defaultCustomColors;
  });
  
  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const newIsDark = document.documentElement.classList.contains('dark');
          setIsDark(newIsDark);
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);
  
  // Sync from profile when it loads
  const profilePrefsJson = JSON.stringify(profile?.preferences || {});
  
  useEffect(() => {
    const profileColors = profile?.preferences?.customColors;
    if (profileColors) {
      const migrated = migrateCustomColors(profileColors);
      console.log('🎨 Profile custom colors loaded:', migrated);
      setCustomColorsState(migrated);
    }
  }, [profilePrefsJson]);
  
  // Get current mode's colors
  const currentColors = isDark ? customColors.dark : customColors.light;
  
  // Track if this is user-initiated change vs initial load
  const isUserChangeRef = useRef(false);
  const lastSyncedColorsRef = useRef<string | null>(null);
  
  // Apply custom colors as CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply custom background for current mode
    if (currentColors.background) {
      const bgHsl = hexToHsl(currentColors.background);
      const cardColor = isDark 
        ? lightenHex(currentColors.background, 0.08) 
        : lightenHex(currentColors.background, 0.05);
      const borderColor = isDark
        ? lightenHex(currentColors.background, 0.15)
        : darkenHex(currentColors.background, 0.1);
      const mutedColor = isDark
        ? lightenHex(currentColors.background, 0.12)
        : darkenHex(currentColors.background, 0.05);
      
      root.style.setProperty('--background', bgHsl, 'important');
      root.style.setProperty('--card', hexToHsl(cardColor), 'important');
      root.style.setProperty('--popover', hexToHsl(cardColor), 'important');
      root.style.setProperty('--muted', hexToHsl(mutedColor), 'important');
      root.style.setProperty('--border', hexToHsl(borderColor), 'important');
      root.style.setProperty('--input', hexToHsl(borderColor), 'important');
      
      // Calculate foreground based on background luminance
      const fgHsl = getContrastColor(currentColors.background);
      root.style.setProperty('--foreground', fgHsl, 'important');
      root.style.setProperty('--card-foreground', fgHsl, 'important');
      root.style.setProperty('--popover-foreground', fgHsl, 'important');
      
      console.log(`🎨 Applied custom ${isDark ? 'dark' : 'light'} background:`, currentColors.background);
    } else {
      // Remove custom background styles
      root.style.removeProperty('--background');
      root.style.removeProperty('--card');
      root.style.removeProperty('--popover');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--border');
      root.style.removeProperty('--input');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--popover-foreground');
    }
    
    // Apply custom accent for current mode
    if (currentColors.accent) {
      const accentHsl = hexToHsl(currentColors.accent);
      const accentFg = getContrastColor(currentColors.accent);
      
      root.style.setProperty('--primary', accentHsl, 'important');
      root.style.setProperty('--primary-foreground', accentFg, 'important');
      root.style.setProperty('--ring', accentHsl, 'important');
      
      console.log(`🎨 Applied custom ${isDark ? 'dark' : 'light'} accent:`, currentColors.accent);
    } else {
      // Remove custom accent styles (let accent color system handle it)
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--ring');
    }
    
    // Save to localStorage
    localStorage.setItem('refine-custom-colors', JSON.stringify(customColors));
  }, [customColors, currentColors, isDark]);
  
  // Separate effect for syncing to profile (only on user changes)
  useEffect(() => {
    const colorsJson = JSON.stringify(customColors);
    
    // Skip if this is the same as what we last synced
    if (lastSyncedColorsRef.current === colorsJson) {
      return;
    }
    
    // Only sync if user made a change (not on initial load from profile)
    if (isUserChangeRef.current && profile) {
      lastSyncedColorsRef.current = colorsJson;
      updateProfile({
        preferences: {
          ...profile.preferences,
          customColors,
        },
      });
      syncToFirestore();
      console.log('🎨 Synced custom colors to profile');
    }
  }, [customColors, profile, updateProfile, syncToFirestore]);
  
  // Set background for specific mode or current mode
  const setCustomBackground = useCallback((color: string | null, mode?: 'light' | 'dark') => {
    isUserChangeRef.current = true; // Mark as user change
    const targetMode = mode || (isDark ? 'dark' : 'light');
    setCustomColorsState(prev => ({
      ...prev,
      [targetMode]: { ...prev[targetMode], background: color },
    }));
  }, [isDark]);
  
  // Set accent for specific mode or current mode
  const setCustomAccent = useCallback((color: string | null, mode?: 'light' | 'dark') => {
    isUserChangeRef.current = true; // Mark as user change
    const targetMode = mode || (isDark ? 'dark' : 'light');
    setCustomColorsState(prev => ({
      ...prev,
      [targetMode]: { ...prev[targetMode], accent: color },
    }));
  }, [isDark]);
  
  // Clear colors for specific mode or all
  const clearCustomColors = useCallback((mode?: 'light' | 'dark') => {
    isUserChangeRef.current = true; // Mark as user change
    if (mode) {
      setCustomColorsState(prev => ({
        ...prev,
        [mode]: { background: null, accent: null },
      }));
    } else {
      setCustomColorsState(defaultCustomColors);
    }
  }, []);
  
  return {
    customColors,
    currentColors, // Colors for current mode
    isDark,
    setCustomBackground,
    setCustomAccent,
    clearCustomColors,
    hasCustomColors: !!(currentColors.background || currentColors.accent),
    hasAnyCustomColors: !!(
      customColors.light.background || customColors.light.accent ||
      customColors.dark.background || customColors.dark.accent
    ),
  };
};
