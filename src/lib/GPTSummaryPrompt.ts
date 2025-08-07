import { Trade, QuickNote, MoodType, GPTSummaryPrompt } from '@/types';
import { formatDate, formatCurrency, getMoodEmoji } from './localStorageUtils';

/**
 * Generate a comprehensive prompt for GPT-4o to create daily trading summaries
 */
export const generateDailySummaryPrompt = (data: GPTSummaryPrompt): string => {
  const { trades, quickNotes, mood, date } = data;
  
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.result === 'win').length;
  const losingTrades = trades.filter(t => t.result === 'loss').length;
  const breakEvenTrades = trades.filter(t => t.result === 'breakeven').length;
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;
  const avgRR = trades.length > 0 
    ? trades.reduce((sum, t) => sum + t.riskRewardRatio, 0) / trades.length 
    : 0;

  const tradesSummary = trades.map(trade => {
    return `- ${trade.symbol} ${trade.direction.toUpperCase()}: ${trade.result} (${formatCurrency(trade.pnl || 0)}, RR: ${trade.riskRewardRatio}, Mood: ${getMoodEmoji(trade.mood)})${trade.notes ? ` - Note: ${trade.notes}` : ''}`;
  }).join('\n');

  const notesSummary = quickNotes.map(note => {
    return `- ${note.content}${note.mood ? ` (${getMoodEmoji(note.mood)})` : ''}${note.tags.length > 0 ? ` #${note.tags.join(' #')}` : ''}`;
  }).join('\n');

  const prompt = `
You are an expert trading coach and psychologist. Analyze the following trading day data and provide a comprehensive, actionable daily summary in exactly this format:

**TRADING DAY SUMMARY - ${formatDate(date)}**

## 📊 Performance Overview
- Total Trades: ${totalTrades}
- Win Rate: ${winRate}%
- P&L: ${formatCurrency(totalPnL)}
- Avg Risk/Reward: ${avgRR.toFixed(2)}
- Overall Mood: ${getMoodEmoji(mood)} ${mood}

## 🔍 Trade Analysis
${tradesSummary || 'No trades executed today.'}

## 📝 Quick Notes & Observations
${notesSummary || 'No quick notes recorded today.'}

## 🎯 Key Insights
Based on the data above, provide 3-4 bullet points highlighting:
- What went well today
- Areas for improvement
- Emotional patterns or psychological observations
- Market/setup observations

## 💡 Tomorrow's Focus
Provide 2-3 specific, actionable goals for tomorrow based on today's performance:
- Technical/strategy improvements
- Risk management adjustments
- Psychological/emotional goals

## 🏆 Suggested Quests
Recommend 2-3 specific quests/challenges for tomorrow that address any weaknesses or build on strengths shown today.

---

Important guidelines:
1. Be encouraging but honest about performance
2. Focus on process over outcomes
3. Identify concrete patterns and actionable improvements
4. Consider psychological aspects of trading
5. Keep the tone professional but supportive
6. Use specific numbers and observations from the data
7. If performance was poor, focus on learning opportunities
8. If performance was good, reinforce positive behaviors

Raw Trading Data for Analysis:
TRADES: ${JSON.stringify(trades, null, 2)}
QUICK NOTES: ${JSON.stringify(quickNotes, null, 2)}
MOOD: ${mood}
DATE: ${formatDate(date)}
`;

  return prompt;
};

/**
 * Generate a weekly summary prompt
 */
export const generateWeeklySummaryPrompt = (
  weeklyTrades: Trade[],
  weeklyNotes: QuickNote[],
  weekStart: Date,
  weekEnd: Date
): string => {
  const totalTrades = weeklyTrades.length;
  const winningTrades = weeklyTrades.filter(t => t.result === 'win').length;
  const totalPnL = weeklyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;

  const prompt = `
You are an expert trading coach. Analyze this week's trading performance and provide a comprehensive weekly review.

**WEEKLY TRADING REVIEW - ${formatDate(weekStart)} to ${formatDate(weekEnd)}**

## 📊 Weekly Performance
- Total Trades: ${totalTrades}
- Win Rate: ${winRate}%
- Weekly P&L: ${formatCurrency(totalPnL)}
  - Trading Days: ${new Set(weeklyTrades.map(t => new Date(t.entryTime).toDateString())).size}

## 🔍 Pattern Analysis
Analyze the trading patterns, identify:
- Most profitable setups
- Recurring mistakes
- Emotional trading patterns
- Market conditions impact

## 📈 Progress Assessment
Compare to previous weeks and highlight:
- Improvements made
- Consistency in execution
- Areas still needing work

## 🎯 Next Week's Priorities
Set 3-4 specific goals for next week based on this week's performance.

Raw Data:
TRADES: ${JSON.stringify(weeklyTrades, null, 2)}
NOTES: ${JSON.stringify(weeklyNotes, null, 2)}
`;

  return prompt;
};

/**
 * Generate a quest suggestion prompt
 */
export const generateQuestSuggestionPrompt = (
  recentTrades: Trade[],
  recentNotes: QuickNote[],
  currentMood: MoodType,
  completedQuests: string[]
): string => {
  const prompt = `
You are a gamification expert and trading coach. Based on the recent trading data and current mood, suggest 3-5 engaging quests that will help improve trading performance.

Current Mood: ${currentMood}
Recent Trading Performance: ${recentTrades.length} trades
Recently Completed Quests: ${completedQuests.join(', ') || 'None'}

Guidelines for quest creation:
1. Make quests specific, measurable, and achievable
2. Balance challenge with attainability
3. Include both technical and psychological elements
4. Consider current mood and adjust difficulty accordingly
5. Make quests engaging with clear rewards

Quest Categories:
- Risk Management
- Emotional Control
- Technical Analysis
- Consistency Building
- Learning & Development

Format each quest as:
{
  "title": "Quest Title",
  "description": "Detailed description",
  "type": "daily/weekly/monthly",
  "xpReward": number,
  "category": "category"
}

Raw Data:
TRADES: ${JSON.stringify(recentTrades.slice(-10), null, 2)}
NOTES: ${JSON.stringify(recentNotes.slice(-10), null, 2)}
`;

  return prompt;
};

/**
 * Generate a tilt detection prompt
 */
export const generateTiltDetectionPrompt = (
  recentTrades: Trade[],
  recentNotes: QuickNote[],
  currentMood: MoodType
): string => {
  const prompt = `
You are a trading psychology expert. Analyze the recent trading data and notes to detect signs of tilt or emotional trading.

Current Mood: ${currentMood}
Recent Activity: ${recentTrades.length} trades, ${recentNotes.length} notes

Look for signs of:
- Revenge trading
- Overtrading
- Ignoring risk management
- Emotional decision making
- Negative mood patterns
- Impulsive behavior

Provide:
1. Tilt Risk Score (0-100)
2. Specific warning signs identified
3. Recommended immediate actions
4. Wellness activities to suggest

Format response as JSON:
{
  "tiltScore": number,
  "riskLevel": "low/medium/high",
  "warningSigns": ["sign1", "sign2"],
  "recommendations": ["action1", "action2"],
  "wellnessActions": ["action1", "action2"]
}

Raw Data:
TRADES: ${JSON.stringify(recentTrades, null, 2)}
NOTES: ${JSON.stringify(recentNotes, null, 2)}
`;

  return prompt;
};

/**
 * Mock GPT-4o response for development
 */
export const mockGPTResponse = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (prompt.includes('TRADING DAY SUMMARY')) {
        resolve(`
## 🎯 Key Insights
• Strong discipline shown in position sizing and risk management
• Emotional control maintained throughout the session
• Good adaptation to changing market conditions
• Slight overtrading tendency towards session end

## 💡 Tomorrow's Focus
• Wait for higher probability setups (>70% confidence)
• Set maximum of 3 trades per session
• Take profit at first target more consistently

## 🏆 Suggested Quests
• "Patience Master": Wait for 3 A+ setups before entering any trades
• "Risk Guardian": Keep all trades under 2% account risk
• "Profit Taker": Take profits at first target on 2/3 trades
        `);
      } else if (prompt.includes('tilt')) {
        resolve(`{
  "tiltScore": 35,
  "riskLevel": "medium",
  "warningSigns": ["Increased trade frequency", "Larger position sizes"],
  "recommendations": ["Take a 15-minute break", "Review risk management rules"],
  "wellnessActions": ["Deep breathing exercise", "Quick walk"]
}`);
      } else {
        resolve('Analysis complete. Recommendations generated based on your trading patterns.');
      }
    }, 1000);
  });
}; 