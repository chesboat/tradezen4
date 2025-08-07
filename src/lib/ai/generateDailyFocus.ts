import OpenAI from 'openai';
import { Trade, QuickNote, MoodType } from '@/types';

interface DailyFocusRequest {
  recentTrades: Trade[];
  recentNotes: QuickNote[];
  currentMood: MoodType;
  previousFocusAreas: string[];
  completedQuests: string[];
  winRate: number;
  totalPnL: number;
  avgRiskAmount: number;
}

interface AIFocusSuggestion {
  focus: string;
  reasoning: string;
  category: 'mindset' | 'risk_management' | 'execution' | 'learning' | 'discipline';
  difficulty: 'easy' | 'medium' | 'challenging';
}

const DAILY_FOCUS_SYSTEM_PROMPT = `You are an elite trading coach and performance psychologist specializing in personalized daily focus areas for traders.

Your role is to analyze a trader's recent performance, emotional state, and trading patterns to generate a highly specific, actionable daily focus area that will most benefit their trading today.

CRITICAL RULES:
1. Base focus on ACTUAL trading data provided - never generic advice
2. Consider recent performance patterns and emotional state
3. Avoid repeating previous focus areas unless critical
4. Make focus specific, measurable, and achievable in one day
5. Reference actual trade outcomes, risk levels, and patterns when relevant

Focus Categories:
- mindset: Mental game, confidence, emotional control
- risk_management: Position sizing, stop losses, risk-reward
- execution: Entry timing, exit discipline, setup quality
- learning: Pattern recognition, mistake analysis, skill building
- discipline: Following rules, avoiding bad habits, consistency

Difficulty Levels:
- easy: Confidence-building, simple behavioral changes
- medium: Moderate skill improvement, process refinement
- challenging: Advanced concepts, breaking bad patterns

Return JSON format:
{
  "focus": "Specific, actionable focus area for today",
  "reasoning": "Why this focus helps based on their recent data",
  "category": "category",
  "difficulty": "difficulty_level"
}`;

export const generateDailyFocus = async (
  request: DailyFocusRequest
): Promise<string> => {
  try {
    const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('⚡ No API key - using smart local focus generation');
      return generateSmartLocalFocus(request);
    }

    console.log('🎯 Generating AI daily focus...');
    return await generateAIFocus(request, apiKey);
    
  } catch (error) {
    console.error('❌ Failed to generate AI focus:', error);
    console.log('🛟 Falling back to smart local generation');
    return generateSmartLocalFocus(request);
  }
};

const generateAIFocus = async (
  request: DailyFocusRequest,
  apiKey: string
): Promise<string> => {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  const userPrompt = `
Analyze this trader's recent performance and generate a personalized daily focus:

PERFORMANCE DATA:
- Recent Trades: ${request.recentTrades.length}
- Win Rate: ${request.winRate.toFixed(1)}%
- Total P&L: $${request.totalPnL.toFixed(2)}
- Average Risk: $${request.avgRiskAmount.toFixed(2)}
- Current Mood: ${request.currentMood}
- Previous Focus Areas: ${request.previousFocusAreas.join(', ') || 'None'}
- Completed Quests: ${request.completedQuests.join(', ') || 'None'}

RECENT TRADES ANALYSIS:
${request.recentTrades.slice(-5).map(trade => 
  `- ${trade.symbol} ${trade.direction}: ${trade.result} ($${trade.pnl?.toFixed(2)}, Risk: $${trade.riskAmount})`
).join('\n')}

RECENT NOTES/REFLECTIONS:
${request.recentNotes.slice(-3).map(note => 
  `- "${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}" (Mood: ${note.mood || 'N/A'})`
).join('\n')}

Generate ONE specific daily focus area that will most benefit this trader today based on their recent patterns and emotional state.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: DAILY_FOCUS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 400,
    temperature: 0.7,
  });

  const responseContent = completion.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error('No response from AI');
  }

  // Clean the response by removing markdown code blocks
  const cleanedResponse = responseContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const aiSuggestion: AIFocusSuggestion = JSON.parse(cleanedResponse);
  console.log('🧠 Generated AI focus:', aiSuggestion.focus);

  return aiSuggestion.focus;
};

const generateSmartLocalFocus = (request: DailyFocusRequest): string => {
  const { recentTrades, winRate, totalPnL, avgRiskAmount, currentMood, previousFocusAreas } = request;

  // Analyze recent performance patterns
  const hasRecentLosses = recentTrades.slice(-3).some(t => t.result === 'loss');
  const hasHighRisk = avgRiskAmount > 300;
  const isLowWinRate = winRate < 40;
  const isNegativePnL = totalPnL < 0;
  const recentBigLoss = recentTrades.some(t => t.pnl && t.pnl < -500);

  let focusAreas: string[] = [];

  // Emotional state based focuses
  if (currentMood === 'frustrated' || currentMood === 'anxious') {
    focusAreas.push(
      "Take three deep breaths before every trade entry to maintain emotional clarity",
      "Focus on process over profit - execute your plan regardless of recent outcomes",
      "Limit trading to 2 high-conviction setups to avoid emotional overtrading"
    );
  } else if (currentMood === 'excellent' || currentMood === 'confident') {
    focusAreas.push(
      "Channel confidence into disciplined execution - avoid overleverage",
      "Use today's positive energy to refine your A+ setup criteria",
      "Document what's working well to replicate in future sessions"
    );
  }

  // Performance-based focuses
  if (hasRecentLosses || isNegativePnL) {
    focusAreas.push(
      "Wait for 3 confirmation signals before entering any trade",
      "Cut losses at exactly your predetermined stop - no second chances",
      "Focus on capital preservation - risk no more than 1% per trade today"
    );
  }

  if (hasHighRisk) {
    focusAreas.push(
      `Limit all position sizes to maximum $250 risk (your recent average: $${avgRiskAmount.toFixed(0)})`,
      "Calculate exact position size before looking at charts to avoid sizing bias",
      "Use 1:3 risk-reward minimum to compensate for recent higher risk trades"
    );
  }

  if (isLowWinRate) {
    focusAreas.push(
      "Quality over quantity - wait for only A+ setups that meet ALL your criteria",
      "Skip borderline setups - if you're not 80% confident, don't trade",
      "Focus on improving entry timing - wait for clear momentum confirmation"
    );
  }

  // Recent big loss recovery
  if (recentBigLoss) {
    focusAreas.push(
      "Start with micro positions to rebuild confidence after recent big loss",
      "Focus on proper process execution rather than trying to recover losses",
      "Take profit at first target to secure green trades and rebuild momentum"
    );
  }

  // Default focuses if no specific issues
  if (focusAreas.length === 0) {
    focusAreas.push(
      "Maintain your current momentum with disciplined risk management",
      "Focus on perfect execution of your trading plan",
      "Document one key lesson from each trade for continuous improvement"
    );
  }

  // Filter out recently used focuses
  const availableFocuses = focusAreas.filter(focus => 
    !previousFocusAreas.some(prev => focus.toLowerCase().includes(prev.toLowerCase().split(' ')[0]))
  );

  const selectedFocus = availableFocuses.length > 0 
    ? availableFocuses[Math.floor(Math.random() * availableFocuses.length)]
    : focusAreas[Math.floor(Math.random() * focusAreas.length)];

  console.log('⚡ Generated smart local focus:', selectedFocus);
  return selectedFocus;
};