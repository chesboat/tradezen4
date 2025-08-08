import { DailyJournalData, CustomTemplate, TemplateBlock } from '@/types';
import { generateId } from '@/lib/localStorageUtils';
import OpenAI from 'openai';
import insightTemplatesData from '@/lib/insightTemplates.json';

interface AITemplateResponse {
  templateName: string;
  description: string;
  emoji: string;
  category: 'mindset' | 'performance' | 'learning' | 'custom';
  blocks: Array<{
    title: string;
    prompt: string;
    emoji: string;
    isRequired: boolean;
    placeholder?: string;
  }>;
}

// System prompt for AI template generation
const INSIGHT_TEMPLATE_SYSTEM_PROMPT = `You are an expert trading coach and psychologist specializing in trader development and insight generation. 

Your role is to analyze a trader's daily trading context and generate customized reflection templates that explore both mindset and execution patterns. 

CRITICAL: You MUST base your template on the specific trading data provided. DO NOT generate generic templates.

Key principles:
1. **Use Actual Data**: Base everything on the specific trades, P&L, and context provided
2. **Contextual Relevance**: If trades were taken, focus on trade analysis. If no trades, focus on market observation
3. **Specific Situations**: Address the actual win/loss patterns and trade count shown in the data
4. **Psychological depth**: Include blocks that explore emotions, triggers, and mental patterns
5. **Actionable insights**: Focus on extracting learnable lessons and improvement strategies

Template Generation Rules:
- If tradeCount > 0: Focus on trade execution, results analysis, and decision-making
- If tradeCount = 0: Focus on market observation, patience, and opportunity assessment
- If P&L positive: Analyze success factors and replication strategies
- If P&L negative: Focus on loss analysis and recovery plans
- Always reference specific trade results when available

Template Structure:
- 3-5 reflection blocks per template
- Mix of required and optional blocks
- Engaging, non-judgmental prompts
- Specific to the trading context provided

Categories:
- mindset: Focus on psychology, emotions, mental game
- performance: Technical execution, strategy, risk management
- learning: Growth, patterns, skill development
- custom: Mixed or unique situations

Return valid JSON only, no additional text.`;

export const generateInsightTemplate = async (
  context: DailyJournalData,
  customPrompt?: string
): Promise<CustomTemplate> => {
  try {
    // Check if API key is available
    const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY;
    console.log('🔑 OpenAI API Key Status:', apiKey ? 'CONFIGURED' : 'NOT CONFIGURED');
    console.log('📊 Context for AI:', {
      tradeCount: context.stats.tradeCount,
      pnl: context.stats.totalPnL,
      winRate: context.stats.winRate,
      tradesData: context.trades.map(t => ({ symbol: t.symbol, result: t.result, pnl: t.pnl })),
      notesCount: context.notes.length,
      notesPreview: context.notes.map(n => n.content.substring(0, 50))
    });
    
    if (apiKey) {
    console.log('🤖 Attempting AI generation with GPT-5-mini...');
      return await generateAIInsightTemplate(context, customPrompt);
    }
    
    console.log('⚡ Using local generation (no API key)');
    // Fallback to intelligent local generation
    return generateLocalInsightTemplate(context, customPrompt);
  } catch (error) {
    console.error('❌ Failed to generate AI insight template:', error);
    console.log('🛟 Using fallback template generation');
    return generateFallbackTemplate(context);
  }
};

// AI-powered template generation using OpenAI
const generateAIInsightTemplate = async (
  context: DailyJournalData,
  customPrompt?: string
): Promise<CustomTemplate> => {
  const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  // Analyze the trading context
  const { trades, notes, stats } = context;
  const pnl = stats.totalPnL;
  const tradeCount = stats.tradeCount;
  const winRate = stats.winRate;
  
  // Extract mood trend
  const moodIndicators = notes.flatMap(note => note.tags || [])
    .concat(trades.flatMap(trade => trade.tags || []));
  
  // Determine trading day characteristics
  const dayCharacteristics = analyzeTradingDay(context);
  
  // Create detailed context prompt
  const userPrompt = `
ACTUAL TRADING DAY DATA:
- Date Context: Trader's reflection for this specific trading session
- P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}
- Trade Activity: ${tradeCount} trades were actually executed (${winRate.toFixed(1)}% win rate)
- Day Classification: ${dayCharacteristics.dayType}
- Identified Patterns: ${dayCharacteristics.patterns.join(', ') || 'standard trading patterns'}
- Emotional Context: ${moodIndicators.slice(0, 5).join(', ') || 'neutral emotional state'}

SPECIFIC TRADE DETAILS:
${tradeCount > 0 ? 
  `- Executed Trades: ${trades.map(t => `${t.symbol} ${t.direction} (${t.result}, $${(t.pnl || 0).toFixed(2)})`).join(', ')}` :
  '- No trades were executed today'
}

TRADER NOTES:
${notes.length > 0 ? 
  `- Session Notes: ${notes.map(n => `"${n.content.substring(0, 60)}..."`).join(', ')}` :
  '- No specific notes recorded'
}

${customPrompt ? `CUSTOM REQUEST: ${customPrompt}` : ''}

INSTRUCTION: Generate a reflection template that directly addresses THIS SPECIFIC trading session. 
${tradeCount > 0 ? 
  `Since ${tradeCount} trades were executed, focus on trade analysis, execution quality, and decision-making patterns.` :
  'Since no trades were taken, focus on market observation, patience, and opportunity assessment.'
}

Do NOT generate generic templates. Reference the actual trades, P&L, and context above.

Return JSON format:
{
  "templateName": "descriptive name reflecting the actual session",
  "description": "when to use this template based on today's context",
  "emoji": "relevant emoji",
  "category": "mindset|performance|learning|custom",
  "blocks": [
    {
      "title": "specific to today's trading activity",
      "prompt": "reflection question referencing actual trades/situation",
      "emoji": "block emoji", 
      "isRequired": boolean,
      "placeholder": "hint text specific to today's context"
    }
  ]
}`;

  try {
    console.log('📤 Sending to GPT-5-mini:', {
      model: 'gpt-5-mini',
      contextSummary: `${tradeCount} trades, $${pnl.toFixed(2)} P&L, ${winRate.toFixed(1)}% win rate`,
      promptLength: userPrompt.length
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: INSIGHT_TEMPLATE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_completion_tokens: 1000,
      temperature: 0.6,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from AI');
    }

    console.log('📥 Raw AI Response:', responseContent);

    // Parse the AI response
    const aiResponse: AITemplateResponse = JSON.parse(responseContent);
    console.log('🧠 Parsed AI Template:', {
      templateName: aiResponse.templateName,
      category: aiResponse.category,
      blocks: aiResponse.blocks.map(b => b.title)
    });
    
    // Validate that the AI response is relevant to the context
    const isRelevant = validateAIResponseRelevance(aiResponse, context);
    if (!isRelevant) {
      console.warn('❌ AI generated irrelevant template, falling back to local generation');
      console.log('🔄 Validation failed - using smart local generation instead');
      return generateLocalInsightTemplate(context, customPrompt);
    }
    
    console.log('✅ AI template validated as relevant');
    // Convert to CustomTemplate format
    return convertAIResponseToTemplate(aiResponse);
    
  } catch (error) {
    console.error('❌ OpenAI API Error Details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      tradeCount: context.stats.tradeCount,
      apiKeyPresent: !!apiKey
    });
    
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('🔑 API Key Issue - Check your .env file and restart the dev server');
    }
    
    throw error;
  }
};

// Intelligent local template generation
const generateLocalInsightTemplate = (
  context: DailyJournalData,
  customPrompt?: string
): CustomTemplate => {
  const { trades, notes, stats } = context;
  const dayCharacteristics = analyzeTradingDay(context);
  
  // Select template strategy based on day characteristics
  let templateStrategy: string;
  let blocks: TemplateBlock[] = [];
  
  // CRITICAL: Always prioritize actual trade activity over other patterns
  if (stats.tradeCount === 0) {
    templateStrategy = 'No Trading Day Analysis';
    blocks = generateNoTradingBlocks(context);
  } else if (dayCharacteristics.dayType === 'big-loss-day') {
    templateStrategy = 'Loss Recovery & Learning';
    blocks = generateLossRecoveryBlocks(context);
  } else if (dayCharacteristics.dayType === 'big-win-day') {
    templateStrategy = 'Success Analysis';
    blocks = generateSuccessAnalysisBlocks(context);
  } else if (dayCharacteristics.patterns.includes('overtrading')) {
    templateStrategy = 'Discipline & Control';
    blocks = generateDisciplineBlocks(context);
  } else if (dayCharacteristics.patterns.includes('emotional-trading')) {
    templateStrategy = 'Emotional Regulation';
    blocks = generateEmotionalBlocks(context);
  } else if (stats.tradeCount > 0) {
    // Default for any day with trades
    templateStrategy = 'Trade Execution Review';
    blocks = generateTradeExecutionBlocks(context);
  } else {
    templateStrategy = 'Balanced Reflection';
    blocks = generateBalancedBlocks(context);
  }

  return {
    id: generateId(),
    name: `${templateStrategy} - ${new Date().toLocaleDateString()}`,
    description: `AI-generated template for ${dayCharacteristics.dayType} reflection`,
    emoji: getTemplateEmojiForStrategy(templateStrategy),
    category: getCategoryForStrategy(templateStrategy),
    blocks,
    isDefault: false,
    accountId: 'ai-generated',
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Validate that AI response is relevant to the trading context
const validateAIResponseRelevance = (
  aiResponse: AITemplateResponse, 
  context: DailyJournalData
): boolean => {
  const { stats } = context;
  const { blocks } = aiResponse;
  
  console.log('🔍 Validating AI response relevance:', {
    tradeCount: stats.tradeCount,
    blockTitles: blocks.map(b => b.title),
    templateName: aiResponse.templateName
  });
  
  // Expanded list of irrelevant terms for when trades were actually taken
  const noTradeTerms = [
    'evaluate the decision to not trade',
    'why no trades today',
    'decision to not trade',
    'not trading',
    'no trading',
    'market observation',
    'patience in waiting',
    'why you didn\'t trade',
    'sitting on the sidelines',
    'observation day',
    'no positions'
  ];
  
  // If trades were taken but AI suggests "no trade" analysis, it's irrelevant
  if (stats.tradeCount > 0) {
    for (const block of blocks) {
      const blockText = `${block.title} ${block.prompt}`.toLowerCase();
      
      for (const term of noTradeTerms) {
        if (blockText.includes(term)) {
          console.warn(`❌ Found irrelevant term "${term}" in block: "${block.title}"`);
          console.warn('Full block prompt:', block.prompt);
          console.warn('Context: Trader executed', stats.tradeCount, 'trades but AI suggested no-trade analysis');
          return false;
        }
      }
    }
  }
  
  // If no trades were taken but AI suggests specific trade analysis, it's irrelevant
  if (stats.tradeCount === 0) {
    const tradingAnalysisTerms = [
      'trade execution', 'winning trade', 'losing trade', 'trade performance',
      'your trades today', 'trade results', 'executed trades', 'trading session'
    ];
    
    for (const block of blocks) {
      const blockText = `${block.title} ${block.prompt}`.toLowerCase();
      
      for (const term of tradingAnalysisTerms) {
        if (blockText.includes(term)) {
          console.warn(`❌ Found trade-specific term "${term}" when no trades were taken`);
          console.warn('Block:', block.title);
          return false;
        }
      }
    }
  }
  
  console.log('✅ AI response passed relevance validation');
  return true;
};

// Analyze trading day to determine characteristics and patterns
const analyzeTradingDay = (context: DailyJournalData) => {
  const { trades, notes, stats } = context;
  const patterns: string[] = [];
  let dayType = 'normal-day';
  
  // Analyze P&L
  if (stats.totalPnL > 200) {
    dayType = 'big-win-day';
  } else if (stats.totalPnL < -200) {
    dayType = 'big-loss-day';
  } else if (Math.abs(stats.totalPnL) < 50) {
    dayType = 'flat-day';
  }
  
  // Analyze trade count
  if (stats.tradeCount > 8) {
    patterns.push('overtrading');
  } else if (stats.tradeCount === 0) {
    patterns.push('no-trades');
  }
  
  // Analyze win rate
  if (stats.winRate < 30) {
    patterns.push('low-win-rate');
  } else if (stats.winRate > 80) {
    patterns.push('high-win-rate');
  }
  
  // Analyze emotional indicators from tags
  const allTags = [
    ...trades.flatMap(t => t.tags || []),
    ...notes.flatMap(n => n.tags || [])
  ];
  
  const emotionalTags = ['fomo', 'revenge', 'tilt', 'fear', 'greed', 'impatience'];
  const disciplineTags = ['discipline', 'patience', 'plan', 'rules'];
  
  if (allTags.some(tag => emotionalTags.includes(tag.toLowerCase()))) {
    patterns.push('emotional-trading');
  }
  
  if (allTags.some(tag => disciplineTags.includes(tag.toLowerCase()))) {
    patterns.push('disciplined-trading');
  }
  
  return { dayType, patterns };
};

// Generate specific block types based on context
const generateLossRecoveryBlocks = (context: DailyJournalData): TemplateBlock[] => [
  {
    id: generateId(),
    title: 'What Went Wrong',
    prompt: 'Identify the specific decisions or factors that led to today\'s losses',
    emoji: '🔍',
    order: 1,
    isRequired: true,
    placeholder: 'Be honest about mistakes without being self-critical...'
  },
  {
    id: generateId(),
    title: 'Emotional Response',
    prompt: 'How did you handle the losses emotionally? What triggered negative reactions?',
    emoji: '🎭',
    order: 2,
    isRequired: true,
    placeholder: 'Describe your emotional journey through the losing trades...'
  },
  {
    id: generateId(),
    title: 'System Breakdown',
    prompt: 'Where did your trading system or rules break down today?',
    emoji: '⚙️',
    order: 3,
    isRequired: true,
    placeholder: 'Identify which rules were ignored or which systems failed...'
  },
  {
    id: generateId(),
    title: 'Recovery Plan',
    prompt: 'What specific steps will you take to bounce back from today?',
    emoji: '🚀',
    order: 4,
    isRequired: false,
    placeholder: 'Create actionable steps for tomorrow and beyond...'
  }
];

const generateSuccessAnalysisBlocks = (context: DailyJournalData): TemplateBlock[] => [
  {
    id: generateId(),
    title: 'Success Factors',
    prompt: 'What specific actions and decisions led to today\'s success?',
    emoji: '🏆',
    order: 1,
    isRequired: true,
    placeholder: 'Break down the elements that made today profitable...'
  },
  {
    id: generateId(),
    title: 'Mindset & Flow',
    prompt: 'Describe your mental state and how you maintained focus throughout the session',
    emoji: '🧠',
    order: 2,
    isRequired: true,
    placeholder: 'What mindset or mental approach worked well today?'
  },
  {
    id: generateId(),
    title: 'Replication Strategy',
    prompt: 'How can you systematize and repeat today\'s successful approach?',
    emoji: '🔄',
    order: 3,
    isRequired: true,
    placeholder: 'What patterns can you extract and turn into consistent practices?'
  },
  {
    id: generateId(),
    title: 'Scaling Considerations',
    prompt: 'How might you scale or improve upon today\'s performance?',
    emoji: '📈',
    order: 4,
    isRequired: false,
    placeholder: 'Consider position sizing, frequency, or strategy enhancements...'
  }
];

const generateDisciplineBlocks = (context: DailyJournalData): TemplateBlock[] => [
  {
    id: generateId(),
    title: 'Discipline Breakdown',
    prompt: 'Where did you deviate from your trading plan or rules today?',
    emoji: '⚠️',
    order: 1,
    isRequired: true,
    placeholder: 'Identify specific moments when discipline wavered...'
  },
  {
    id: generateId(),
    title: 'Trigger Analysis',
    prompt: 'What situations or emotions triggered the undisciplined behavior?',
    emoji: '⚡',
    order: 2,
    isRequired: true,
    placeholder: 'Look for patterns in what causes rule-breaking...'
  },
  {
    id: generateId(),
    title: 'Prevention Strategy',
    prompt: 'What systems or safeguards can prevent future discipline lapses?',
    emoji: '🛡️',
    order: 3,
    isRequired: true,
    placeholder: 'Design specific checks and balances...'
  }
];

const generateEmotionalBlocks = (context: DailyJournalData): TemplateBlock[] => [
  {
    id: generateId(),
    title: 'Emotional Timeline',
    prompt: 'Track your emotional state throughout the trading session',
    emoji: '📊',
    order: 1,
    isRequired: true,
    placeholder: 'Map how your emotions changed with each trade or market event...'
  },
  {
    id: generateId(),
    title: 'Trigger Events',
    prompt: 'What specific events or thoughts triggered strong emotional reactions?',
    emoji: '💥',
    order: 2,
    isRequired: true,
    placeholder: 'Identify the moments when emotions took control...'
  },
  {
    id: generateId(),
    title: 'Coping Strategies',
    prompt: 'What techniques helped (or could have helped) manage emotions?',
    emoji: '🧘',
    order: 3,
    isRequired: true,
    placeholder: 'List effective emotional regulation techniques...'
  }
];

const generateBalancedBlocks = (context: DailyJournalData): TemplateBlock[] => [
  {
    id: generateId(),
    title: 'Session Overview',
    prompt: 'Summarize the key events and outcomes of today\'s trading session',
    emoji: '📋',
    order: 1,
    isRequired: true,
    placeholder: 'Give a balanced overview of the day\'s trading...'
  },
  {
    id: generateId(),
    title: 'Best Decision',
    prompt: 'What was your best trading decision today and why?',
    emoji: '⭐',
    order: 2,
    isRequired: true,
    placeholder: 'Highlight a moment of good judgment or execution...'
  },
  {
    id: generateId(),
    title: 'Improvement Area',
    prompt: 'What\'s one specific area you can improve for tomorrow?',
    emoji: '🎯',
    order: 3,
    isRequired: true,
    placeholder: 'Focus on one clear, actionable improvement...'
  }
];

const generateNoTradingBlocks = (context: DailyJournalData): TemplateBlock[] => [
  {
    id: generateId(),
    title: 'Market Assessment',
    prompt: 'What prevented you from finding good trading opportunities today?',
    emoji: '🔍',
    order: 1,
    isRequired: true,
    placeholder: 'Analyze market conditions, setups, or personal factors...'
  },
  {
    id: generateId(),
    title: 'Patience & Discipline',
    prompt: 'How did you maintain discipline while waiting for the right setups?',
    emoji: '🧘',
    order: 2,
    isRequired: true,
    placeholder: 'Reflect on your emotional state and decision-making process...'
  },
  {
    id: generateId(),
    title: 'Learning Opportunities',
    prompt: 'What did you observe or learn from the markets today?',
    emoji: '📚',
    order: 3,
    isRequired: false,
    placeholder: 'Note any patterns, insights, or educational moments...'
  },
  {
    id: generateId(),
    title: 'Tomorrow\'s Preparation',
    prompt: 'How will you prepare for potential opportunities tomorrow?',
    emoji: '🎯',
    order: 4,
    isRequired: false,
    placeholder: 'Plan your approach, watchlist, or strategy adjustments...'
  }
];

const generateTradeExecutionBlocks = (context: DailyJournalData): TemplateBlock[] => {
  const { trades, stats } = context;
  const hasWinningTrades = trades.some(t => (t.pnl || 0) > 0);
  const hasLosingTrades = trades.some(t => (t.pnl || 0) < 0);
  
  return [
    {
      id: generateId(),
      title: 'Trade Execution Review',
      prompt: `Analyze your ${stats.tradeCount} trades today. What went well with your execution?`,
      emoji: '📊',
      order: 1,
      isRequired: true,
      placeholder: 'Review entry timing, position sizing, and exit decisions...'
    },
    {
      id: generateId(),
      title: hasWinningTrades ? 'Winning Trade Analysis' : 'Decision Process',
      prompt: hasWinningTrades 
        ? 'What made your winning trades successful? How can you replicate this?' 
        : 'What was your decision-making process for each trade today?',
      emoji: hasWinningTrades ? '🎯' : '🤔',
      order: 2,
      isRequired: true,
      placeholder: hasWinningTrades 
        ? 'Break down the factors that led to profitable trades...'
        : 'Analyze your entry/exit logic and reasoning...'
    },
    {
      id: generateId(),
      title: hasLosingTrades ? 'Loss Analysis' : 'Emotional Management',
      prompt: hasLosingTrades
        ? 'What can you learn from your losing trades to avoid similar mistakes?'
        : 'How did you manage your emotions throughout the trading session?',
      emoji: hasLosingTrades ? '🔍' : '🧠',
      order: 3,
      isRequired: true,
      placeholder: hasLosingTrades
        ? 'Identify specific mistakes and prevention strategies...'
        : 'Reflect on your mental state and emotional control...'
    },
    {
      id: generateId(),
      title: 'Tomorrow\'s Focus',
      prompt: 'Based on today\'s trading, what will be your main focus for the next session?',
      emoji: '🚀',
      order: 4,
      isRequired: false,
      placeholder: 'Set specific goals or areas of improvement for tomorrow...'
    }
  ];
};

// Helper functions
const getTemplateEmojiForStrategy = (strategy: string): string => {
  const emojiMap: Record<string, string> = {
    'Loss Recovery & Learning': '🔄',
    'Success Analysis': '🏆',
    'Discipline & Control': '🎯',
    'Emotional Regulation': '🧠',
    'Balanced Reflection': '⚖️',
    'No Trading Day Analysis': '🧘',
    'Trade Execution Review': '📊'
  };
  return emojiMap[strategy] || '📝';
};

const getCategoryForStrategy = (strategy: string): 'mindset' | 'performance' | 'learning' | 'custom' => {
  if (strategy.includes('Emotional') || strategy.includes('Mindset') || strategy.includes('No Trading')) return 'mindset';
  if (strategy.includes('Success') || strategy.includes('Discipline') || strategy.includes('Execution')) return 'performance';
  if (strategy.includes('Learning') || strategy.includes('Recovery')) return 'learning';
  return 'custom';
};

const convertAIResponseToTemplate = (aiResponse: AITemplateResponse): CustomTemplate => {
  const blocks: TemplateBlock[] = aiResponse.blocks.map((block, index) => ({
    id: generateId(),
    title: block.title,
    prompt: block.prompt,
    emoji: block.emoji,
    order: index + 1,
    isRequired: block.isRequired,
    placeholder: block.placeholder,
  }));

  return {
    id: generateId(),
    name: aiResponse.templateName,
    description: aiResponse.description,
    emoji: aiResponse.emoji,
    category: aiResponse.category,
    blocks,
    isDefault: false,
    accountId: 'ai-generated',
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Fallback template generation
const generateFallbackTemplate = (context: DailyJournalData): CustomTemplate => {
  return {
    id: generateId(),
    name: 'Daily Insight Reflection',
    description: 'General purpose reflection template',
    emoji: '💭',
    category: 'custom',
    blocks: [
      {
        id: generateId(),
        title: 'Key Takeaway',
        prompt: 'What was the most important lesson from today\'s session?',
        emoji: '💡',
        order: 1,
        isRequired: true,
        placeholder: 'Reflect on the primary insight you gained...'
      },
      {
        id: generateId(),
        title: 'Emotional Check',
        prompt: 'How did you handle emotions during key moments?',
        emoji: '🎭',
        order: 2,
        isRequired: true,
        placeholder: 'Describe your emotional state and control...'
      },
      {
        id: generateId(),
        title: 'Tomorrow\'s Focus',
        prompt: 'What will you prioritize in your next trading session?',
        emoji: '🎯',
        order: 3,
        isRequired: false,
        placeholder: 'Set your intention for the next session...'
      }
    ],
    isDefault: false,
    accountId: 'fallback',
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};