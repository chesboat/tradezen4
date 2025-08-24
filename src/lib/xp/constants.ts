// XP System Constants
export const MAX_LEVEL = 30;
export const BASE_XP = 200;
export const INCREMENT_XP = 100;

// Prestige theme keys
export type PrestigeKey = 
  | 'bronze' 
  | 'silver' 
  | 'gold' 
  | 'platinum' 
  | 'diamond' 
  | 'ruby' 
  | 'emerald' 
  | 'sapphire' 
  | 'onyx' 
  | 'obsidian';

export interface PrestigeTheme {
  key: PrestigeKey;
  label: string;
  colors: {
    border: string;
    glow: string;
    gradient: {
      from: string;
      to: string;
    };
  };
  iconName: string;
}

// Prestige themes mapping (serious & sleek)
export const PRESTIGE_THEMES: Record<number, PrestigeTheme> = {
  1: {
    key: 'bronze',
    label: 'Bronze',
    colors: {
      border: '#CD7F32',
      glow: '#CD7F32',
      gradient: { from: '#CD7F32', to: '#8B4513' }
    },
    iconName: 'bronze-medal'
  },
  2: {
    key: 'silver',
    label: 'Silver',
    colors: {
      border: '#C0C0C0',
      glow: '#C0C0C0',
      gradient: { from: '#C0C0C0', to: '#A8A8A8' }
    },
    iconName: 'silver-medal'
  },
  3: {
    key: 'gold',
    label: 'Gold',
    colors: {
      border: '#FFD700',
      glow: '#FFD700',
      gradient: { from: '#FFD700', to: '#FFA500' }
    },
    iconName: 'gold-medal'
  },
  4: {
    key: 'platinum',
    label: 'Platinum',
    colors: {
      border: '#E5E4E2',
      glow: '#E5E4E2',
      gradient: { from: '#E5E4E2', to: '#D3D3D3' }
    },
    iconName: 'platinum-medal'
  },
  5: {
    key: 'diamond',
    label: 'Diamond',
    colors: {
      border: '#B9F2FF',
      glow: '#B9F2FF',
      gradient: { from: '#B9F2FF', to: '#87CEEB' }
    },
    iconName: 'diamond-medal'
  },
  6: {
    key: 'ruby',
    label: 'Ruby',
    colors: {
      border: '#E0115F',
      glow: '#E0115F',
      gradient: { from: '#E0115F', to: '#CC0000' }
    },
    iconName: 'ruby-medal'
  },
  7: {
    key: 'emerald',
    label: 'Emerald',
    colors: {
      border: '#50C878',
      glow: '#50C878',
      gradient: { from: '#50C878', to: '#228B22' }
    },
    iconName: 'emerald-medal'
  },
  8: {
    key: 'sapphire',
    label: 'Sapphire',
    colors: {
      border: '#0F52BA',
      glow: '#0F52BA',
      gradient: { from: '#0F52BA', to: '#003366' }
    },
    iconName: 'sapphire-medal'
  },
  9: {
    key: 'onyx',
    label: 'Onyx',
    colors: {
      border: '#353839',
      glow: '#353839',
      gradient: { from: '#353839', to: '#1C1C1C' }
    },
    iconName: 'onyx-medal'
  }
};

// Obsidian theme for prestige 10+ (cap visuals)
export const OBSIDIAN_THEME: PrestigeTheme = {
  key: 'obsidian',
  label: 'Obsidian',
  colors: {
    border: '#0B0B0B',
    glow: '#4B0082',
    gradient: { from: '#0B0B0B', to: '#4B0082' }
  },
  iconName: 'obsidian-medal'
};

// Feature flag - defaults to enabled, can be disabled via env var
export const FEATURE_XP_PRESTIGE = true; // Always enabled for now
