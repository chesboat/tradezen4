import { PRESTIGE_THEMES, OBSIDIAN_THEME, PrestigeTheme } from './constants';

/**
 * Get prestige theme for a given prestige level
 * Caps at Obsidian theme for prestige 10+
 */
export function getPrestigeTheme(prestige: number): PrestigeTheme {
  if (prestige <= 0) {
    // No prestige - return a default theme
    return {
      key: 'bronze',
      label: 'Trader',
      colors: {
        border: 'transparent',
        glow: 'transparent',
        gradient: { from: 'transparent', to: 'transparent' }
      },
      iconName: ''
    };
  }
  
  if (prestige >= 10) {
    return OBSIDIAN_THEME;
  }
  
  return PRESTIGE_THEMES[prestige] || PRESTIGE_THEMES[1];
}

/**
 * Get prestige display text
 */
export function getPrestigeDisplayText(prestige: number): string {
  if (prestige <= 0) return '';
  
  const theme = getPrestigeTheme(prestige);
  return `${theme.label} ${prestige > 10 ? prestige : ''}`.trim();
}

/**
 * Check if prestige level has a special theme
 */
export function hasPrestigeTheme(prestige: number): boolean {
  return prestige > 0;
}

/**
 * Get all available prestige themes (for UI display)
 */
export function getAllPrestigeThemes(): PrestigeTheme[] {
  const themes = Object.values(PRESTIGE_THEMES);
  themes.push(OBSIDIAN_THEME);
  return themes;
}
