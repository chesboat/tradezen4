import { useState, useEffect } from 'react';
import { useUserProfileStore } from '@/store/useUserProfileStore';

/**
 * Custom Colors System - Premium Feature
 * Allows users to set their own background and accent colors
 */

export interface CustomColors {
  background: string | null; // Hex color or null for default
  accent: string | null; // Hex color or null for default
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

export const useCustomColors = () => {
  const { profile, updateProfile, syncToFirestore } = useUserProfileStore();
  
  // Initialize from profile or localStorage
  const [customColors, setCustomColorsState] = useState<CustomColors>(() => {
    // Try profile first
    if (profile?.preferences?.customColors) {
      return profile.preferences.customColors;
    }
    
    // Try localStorage
    const saved = localStorage.getItem('refine-custom-colors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    
    return { background: null, accent: null };
  });
  
  // Sync from profile when it loads (more robust detection)
  useEffect(() => {
    const profileColors = profile?.preferences?.customColors;
    if (profileColors) {
      console.log('🎨 Profile loaded with custom colors:', profileColors);
      setCustomColorsState(profileColors);
    }
  }, [profile?.id, profile?.preferences?.customColors]); // Watch profile.id to detect when profile loads
  
  // Apply custom colors as CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    
    // Apply custom background
    if (customColors.background) {
      const bgHsl = hexToHsl(customColors.background);
      const cardColor = isDark 
        ? lightenHex(customColors.background, 0.08) 
        : lightenHex(customColors.background, 0.05);
      const borderColor = isDark
        ? lightenHex(customColors.background, 0.15)
        : darkenHex(customColors.background, 0.1);
      const mutedColor = isDark
        ? lightenHex(customColors.background, 0.12)
        : darkenHex(customColors.background, 0.05);
      
      root.style.setProperty('--background', bgHsl, 'important');
      root.style.setProperty('--card', hexToHsl(cardColor), 'important');
      root.style.setProperty('--popover', hexToHsl(cardColor), 'important');
      root.style.setProperty('--muted', hexToHsl(mutedColor), 'important');
      root.style.setProperty('--border', hexToHsl(borderColor), 'important');
      root.style.setProperty('--input', hexToHsl(borderColor), 'important');
      
      // Calculate foreground based on background luminance
      const fgHsl = getContrastColor(customColors.background);
      root.style.setProperty('--foreground', fgHsl, 'important');
      root.style.setProperty('--card-foreground', fgHsl, 'important');
      root.style.setProperty('--popover-foreground', fgHsl, 'important');
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
    
    // Apply custom accent
    if (customColors.accent) {
      const accentHsl = hexToHsl(customColors.accent);
      const accentFg = getContrastColor(customColors.accent);
      
      root.style.setProperty('--primary', accentHsl, 'important');
      root.style.setProperty('--primary-foreground', accentFg, 'important');
      root.style.setProperty('--ring', accentHsl, 'important');
    } else {
      // Remove custom accent styles (let accent color system handle it)
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--ring');
    }
    
    // Save to localStorage
    localStorage.setItem('refine-custom-colors', JSON.stringify(customColors));
    
    // Sync to profile
    if (profile && JSON.stringify(profile.preferences?.customColors) !== JSON.stringify(customColors)) {
      updateProfile({
        preferences: {
          ...profile.preferences,
          customColors,
        },
      });
      syncToFirestore();
    }
  }, [customColors, profile]);
  
  const setCustomBackground = (color: string | null) => {
    setCustomColorsState(prev => ({ ...prev, background: color }));
  };
  
  const setCustomAccent = (color: string | null) => {
    setCustomColorsState(prev => ({ ...prev, accent: color }));
  };
  
  const clearCustomColors = () => {
    setCustomColorsState({ background: null, accent: null });
  };
  
  return {
    customColors,
    setCustomBackground,
    setCustomAccent,
    clearCustomColors,
    hasCustomColors: !!(customColors.background || customColors.accent),
  };
};
