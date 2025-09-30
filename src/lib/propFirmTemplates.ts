export interface PropAccountSize {
  size: number;
  dailyLossLimit: number;
  maxDrawdown: number;
  profitTarget: number; // For evaluation accounts
  displayName: string;
}

export interface PropFirmTemplate {
  name: string;
  sizes: PropAccountSize[];
  profitSplit: number; // Default profit split percentage
  minTradingDays: number;
  description?: string;
}

export const PROP_FIRM_TEMPLATES: Record<string, PropFirmTemplate> = {
  'Topstep': {
    name: 'Topstep',
    profitSplit: 90,
    minTradingDays: 5,
    description: 'Topstep Trader',
    sizes: [
      {
        size: 50000,
        dailyLossLimit: 2000,
        maxDrawdown: 2000,
        profitTarget: 3000,
        displayName: '$50K'
      },
      {
        size: 100000,
        dailyLossLimit: 3000,
        maxDrawdown: 3000,
        profitTarget: 6000,
        displayName: '$100K'
      },
      {
        size: 150000,
        dailyLossLimit: 4500,
        maxDrawdown: 4500,
        profitTarget: 9000,
        displayName: '$150K'
      }
    ]
  },
  'FTMO': {
    name: 'FTMO',
    profitSplit: 80,
    minTradingDays: 4,
    description: 'FTMO Trader',
    sizes: [
      {
        size: 10000,
        dailyLossLimit: 500,
        maxDrawdown: 1000,
        profitTarget: 1000,
        displayName: '$10K'
      },
      {
        size: 25000,
        dailyLossLimit: 1250,
        maxDrawdown: 2500,
        profitTarget: 2500,
        displayName: '$25K'
      },
      {
        size: 50000,
        dailyLossLimit: 2500,
        maxDrawdown: 5000,
        profitTarget: 5000,
        displayName: '$50K'
      },
      {
        size: 100000,
        dailyLossLimit: 5000,
        maxDrawdown: 10000,
        profitTarget: 10000,
        displayName: '$100K'
      },
      {
        size: 200000,
        dailyLossLimit: 10000,
        maxDrawdown: 20000,
        profitTarget: 20000,
        displayName: '$200K'
      }
    ]
  },
  'Apex Trader Funding': {
    name: 'Apex Trader Funding',
    profitSplit: 90,
    minTradingDays: 0, // No minimum trading days
    description: 'Apex Trader Funding',
    sizes: [
      {
        size: 25000,
        dailyLossLimit: 1000,
        maxDrawdown: 1500,
        profitTarget: 1500,
        displayName: '$25K'
      },
      {
        size: 50000,
        dailyLossLimit: 2000,
        maxDrawdown: 2500,
        profitTarget: 3000,
        displayName: '$50K'
      },
      {
        size: 100000,
        dailyLossLimit: 4000,
        maxDrawdown: 5000,
        profitTarget: 6000,
        displayName: '$100K'
      },
      {
        size: 150000,
        dailyLossLimit: 6000,
        maxDrawdown: 7500,
        profitTarget: 9000,
        displayName: '$150K'
      },
      {
        size: 250000,
        dailyLossLimit: 10000,
        maxDrawdown: 12500,
        profitTarget: 15000,
        displayName: '$250K'
      }
    ]
  },
  'Tradify': {
    name: 'Tradify',
    profitSplit: 80,
    minTradingDays: 5,
    description: 'Tradify',
    sizes: [
      {
        size: 25000,
        dailyLossLimit: 1250,
        maxDrawdown: 2500,
        profitTarget: 2000,
        displayName: '$25K'
      },
      {
        size: 50000,
        dailyLossLimit: 2000,
        maxDrawdown: 2500,
        profitTarget: 3000,
        displayName: '$50K'
      },
      {
        size: 100000,
        dailyLossLimit: 4000,
        maxDrawdown: 5000,
        profitTarget: 5000,
        displayName: '$100K'
      },
      {
        size: 200000,
        dailyLossLimit: 8000,
        maxDrawdown: 10000,
        profitTarget: 10000,
        displayName: '$200K'
      }
    ]
  },
  'MyForexFunds': {
    name: 'MyForexFunds',
    profitSplit: 80,
    minTradingDays: 5,
    description: 'MyForexFunds',
    sizes: [
      {
        size: 5000,
        dailyLossLimit: 250,
        maxDrawdown: 500,
        profitTarget: 400,
        displayName: '$5K'
      },
      {
        size: 10000,
        dailyLossLimit: 500,
        maxDrawdown: 1000,
        profitTarget: 800,
        displayName: '$10K'
      },
      {
        size: 25000,
        dailyLossLimit: 1250,
        maxDrawdown: 2500,
        profitTarget: 2000,
        displayName: '$25K'
      },
      {
        size: 50000,
        dailyLossLimit: 2500,
        maxDrawdown: 5000,
        profitTarget: 4000,
        displayName: '$50K'
      },
      {
        size: 100000,
        dailyLossLimit: 5000,
        maxDrawdown: 10000,
        profitTarget: 8000,
        displayName: '$100K'
      },
      {
        size: 200000,
        dailyLossLimit: 10000,
        maxDrawdown: 20000,
        profitTarget: 16000,
        displayName: '$200K'
      }
    ]
  },
  'FundedNext': {
    name: 'FundedNext',
    profitSplit: 90,
    minTradingDays: 5,
    description: 'Funded Next',
    sizes: [
      {
        size: 6000,
        dailyLossLimit: 360,
        maxDrawdown: 360,
        profitTarget: 360,
        displayName: '$6K'
      },
      {
        size: 15000,
        dailyLossLimit: 900,
        maxDrawdown: 900,
        profitTarget: 900,
        displayName: '$15K'
      },
      {
        size: 25000,
        dailyLossLimit: 1500,
        maxDrawdown: 1500,
        profitTarget: 1500,
        displayName: '$25K'
      },
      {
        size: 50000,
        dailyLossLimit: 3000,
        maxDrawdown: 3000,
        profitTarget: 3000,
        displayName: '$50K'
      },
      {
        size: 100000,
        dailyLossLimit: 6000,
        maxDrawdown: 6000,
        profitTarget: 6000,
        displayName: '$100K'
      },
      {
        size: 200000,
        dailyLossLimit: 12000,
        maxDrawdown: 12000,
        profitTarget: 12000,
        displayName: '$200K'
      }
    ]
  },
  'The5ers': {
    name: 'The5ers',
    profitSplit: 80,
    minTradingDays: 6,
    description: 'The 5%ers',
    sizes: [
      {
        size: 6000,
        dailyLossLimit: 300,
        maxDrawdown: 360,
        profitTarget: 360,
        displayName: '$6K'
      },
      {
        size: 20000,
        dailyLossLimit: 1000,
        maxDrawdown: 1200,
        profitTarget: 1200,
        displayName: '$20K'
      },
      {
        size: 40000,
        dailyLossLimit: 2000,
        maxDrawdown: 2400,
        profitTarget: 2400,
        displayName: '$40K'
      },
      {
        size: 100000,
        dailyLossLimit: 5000,
        maxDrawdown: 6000,
        profitTarget: 6000,
        displayName: '$100K'
      }
    ]
  },
  'E8 Funding': {
    name: 'E8 Funding',
    profitSplit: 80,
    minTradingDays: 5,
    description: 'E8 Funding',
    sizes: [
      {
        size: 25000,
        dailyLossLimit: 1500,
        maxDrawdown: 2000,
        profitTarget: 2000,
        displayName: '$25K'
      },
      {
        size: 50000,
        dailyLossLimit: 3000,
        maxDrawdown: 4000,
        profitTarget: 4000,
        displayName: '$50K'
      },
      {
        size: 100000,
        dailyLossLimit: 6000,
        maxDrawdown: 8000,
        profitTarget: 8000,
        displayName: '$100K'
      },
      {
        size: 250000,
        dailyLossLimit: 15000,
        maxDrawdown: 20000,
        profitTarget: 20000,
        displayName: '$250K'
      }
    ]
  }
};

export const getTemplate = (firmName: string): PropFirmTemplate | null => {
  return PROP_FIRM_TEMPLATES[firmName] || null;
};

export const getAccountSize = (firmName: string, size: number): PropAccountSize | null => {
  const template = getTemplate(firmName);
  if (!template) return null;
  return template.sizes.find(s => s.size === size) || null;
};

export const getAllFirmNames = (): string[] => {
  return Object.keys(PROP_FIRM_TEMPLATES);
};
