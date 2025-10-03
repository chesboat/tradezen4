import { Trade, QuickNote, MoodType, Quest } from '@/types';
import { authenticatedFetch } from '../apiClient';

interface QuestSuggestionRequest {
  recentTrades: Trade[];
  recentNotes: QuickNote[];
  currentMood: MoodType;
  completedQuests: string[];
  winRate: number;
  totalPnL: number;
  avgRiskAmount: number;
}

interface AIQuestSuggestion {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  xpReward: number;
  category: 'risk_management' | 'emotional_control' | 'technical_analysis' | 'consistency' | 'learning';
  maxProgress: number;
  reasoning: string;
}

const QUEST_GENERATION_SYSTEM_PROMPT = `You are a gamification expert and elite trading coach specializing in trader development through quest-based challenges.

Your role is to analyze a trader's performance data and psychological state to generate personalized, engaging quests that will improve their trading performance.

CRITICAL RULES:
1. Base ALL quests on the specific trading data provided - no generic suggestions
2. Consider current mood and adjust difficulty/type accordingly
3. Make quests specific, measurable, and achievable within the timeframe
4. Balance technical skills with psychological development
5. Reference actual performance patterns (win rate, P&L, risk amounts)

Quest Categories:
- risk_management: Position sizing, stop losses, risk-reward ratios
- emotional_control: Discipline, patience, avoiding revenge trading
- technical_analysis: Setup quality, entry/exit timing, pattern recognition  
- consistency: Regular trading habits, routine building
- learning: Education, review processes, skill development

Difficulty Guidelines:
- If mood is poor/frustrated: Easier, confidence-building quests
- If mood is excellent: More challenging, stretch goals
- If recent losses: Focus on process over profit
- If recent wins: Focus on maintaining discipline

Return STRICT JSON as an object with a single key "quests" containing an array of 3-5 suggestions. No commentary outside JSON:
{
  "quests": [
    {
      "title": "Specific quest name",
      "description": "Clear, actionable description referencing actual data",
      "type": "daily|weekly|monthly",
      "xpReward": 25,
      "category": "risk_management|emotional_control|technical_analysis|consistency|learning",
      "maxProgress": 1,
      "reasoning": "Why this quest helps based on their data"
    }
  ]
}`;

export const generateQuestSuggestions = async (
  request: QuestSuggestionRequest
): Promise<Quest[]> => {
  try {
    const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('⚡ No API key - using smart local quest generation');
      return generateSmartLocalQuests(request);
    }

    console.log('🤖 Generating AI quest suggestions...');
    const result = await generateAIQuests(request, apiKey);
    console.log('✅ AI quest generation completed, generated:', result.length, 'quests');
    return result;
    
  } catch (error) {
    console.error('❌ Failed to generate AI quests:', error);
    console.log('🛟 Falling back to smart local generation');
    return generateSmartLocalQuests(request);
  }
};

const generateAIQuests = async (
  request: QuestSuggestionRequest,
  apiKey: string
): Promise<Quest[]> => {
  const userPrompt = `
Analyze this trader's recent performance and generate personalized quest suggestions:

PERFORMANCE DATA:
- Recent Trades: ${request.recentTrades.length}
- Win Rate: ${request.winRate.toFixed(1)}%
- Total P&L: $${request.totalPnL.toFixed(2)}
- Average Risk: $${request.avgRiskAmount.toFixed(2)}
- Current Mood: ${request.currentMood}
- Completed Quests: ${request.completedQuests.join(', ') || 'None'}

RECENT TRADES ANALYSIS:
${request.recentTrades.slice(-5).map(trade => 
  `- ${trade.symbol} ${trade.direction}: ${trade.result} ($${(trade.pnl || 0).toFixed(2)}, Risk: $${trade.riskAmount})`
).join('\n')}

RECENT NOTES:
${request.recentNotes.slice(-3).map(note => 
  `- "${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}" (Mood: ${note.mood || 'N/A'})`
).join('\n')}

Generate 3-4 specific quests that address this trader's current needs and performance patterns.
Focus on improvement areas based on the actual data provided.`;

  console.log('🔄 Calling secure backend API...');
  
  const response = await authenticatedFetch('/api/generate-ai-quests', {
    method: 'POST',
    body: JSON.stringify({
      systemPrompt: QUEST_GENERATION_SYSTEM_PROMPT,
      userPrompt: userPrompt,
      model: 'gpt-4o-mini',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate AI quests');
  }

  const result = await response.json();
  const responseContent = result.content || '';
  
  if (!responseContent.trim()) {
    throw new Error('No response from AI');
  }

  console.log('📝 Raw AI response:', responseContent);
  
  // Parse either {quests: []} or []
  let aiSuggestions: AIQuestSuggestion[] = [];
  try {
    const parsed = JSON.parse(responseContent);
    if (Array.isArray(parsed)) aiSuggestions = parsed as AIQuestSuggestion[];
    else if (parsed && Array.isArray(parsed.quests)) aiSuggestions = parsed.quests as AIQuestSuggestion[];
  } catch (_) {
    // Strip code fences and retry
    const cleaned = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) aiSuggestions = parsed as AIQuestSuggestion[];
    else if (parsed && Array.isArray(parsed.quests)) aiSuggestions = parsed.quests as AIQuestSuggestion[];
  }

  if (!aiSuggestions || aiSuggestions.length === 0) {
    throw new Error('Empty AI suggestions');
  }
  console.log('🧠 Generated AI quest suggestions:', aiSuggestions.map(q => q.title));

  // Convert AI suggestions to Quest format
  return aiSuggestions.map(suggestion => ({
    title: suggestion.title,
    description: suggestion.description,
    type: suggestion.type,
    status: 'pending' as const,
    progress: 0,
    maxProgress: Math.max(1, Number.isFinite(suggestion.maxProgress as any) ? (suggestion.maxProgress as number) : 1),
    xpReward: suggestion.xpReward,
    dueDate: suggestion.type === 'daily' 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : suggestion.type === 'weekly'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    accountId: 'all',
    id: '', // Will be set by store
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

const generateSmartLocalQuests = (request: QuestSuggestionRequest): Promise<Quest[]> => {
  const { recentTrades, winRate, totalPnL, avgRiskAmount, currentMood } = request;
  const quests: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  // Analyze recent performance
  const hasRecentLosses = recentTrades.slice(-3).some(t => t.result === 'loss');
  const hasHighRisk = avgRiskAmount > 300;
  const isLowWinRate = winRate < 40;
  const isNegativePnL = totalPnL < 0;

  // Risk Management Quests
  if (hasHighRisk || isNegativePnL) {
    quests.push({
      title: 'Risk Discipline',
      description: `Keep position size under $250 per trade (your recent avg: $${avgRiskAmount.toFixed(0)})`,
      type: 'daily',
      status: 'pending',
      progress: 0,
      maxProgress: 3,
      xpReward: 75,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      accountId: 'all',
    });
  }

  // Emotional Control Quests
  if (currentMood === 'terrible' || currentMood === 'poor' || hasRecentLosses) {
    quests.push({
      title: 'Patience Builder',
      description: 'Wait at least 10 minutes between trades to avoid emotional decisions',
      type: 'daily',
      status: 'pending',
      progress: 0,
      maxProgress: 1,
      xpReward: 50,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      accountId: 'all',
    });
  }

  // Quality Focus Quests
  if (isLowWinRate) {
    quests.push({
      title: 'Quality Over Quantity',
      description: `Focus on high-probability setups - limit to 3 trades today (recent win rate: ${winRate.toFixed(1)}%)`,
      type: 'daily',
      status: 'pending',
      progress: 0,
      maxProgress: 1,
      xpReward: 100,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      accountId: 'all',
    });
  }

  // Learning Quest
  if (recentTrades.length > 0) {
    quests.push({
      title: 'Trade Review Master',
      description: 'Add detailed notes to every trade explaining your reasoning and lessons learned',
      type: 'daily',
      status: 'pending',
      progress: 0,
      maxProgress: recentTrades.length > 5 ? 3 : 1,
      xpReward: 40,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      accountId: 'all',
    });
  }

  // Default fallback quest
  if (quests.length === 0) {
    quests.push({
      title: 'Fresh Start',
      description: 'Begin with one well-planned trade and detailed notes',
      type: 'daily',
      status: 'pending',
      progress: 0,
      maxProgress: 1,
      xpReward: 50,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      accountId: 'all',
    });
  }

  console.log('⚡ Generated smart local quests:', quests.map(q => q.title));
  return Promise.resolve(quests.map(quest => ({
    ...quest,
    id: '',
    createdAt: new Date(),
    updatedAt: new Date()
  })));
};