import { DailyJournalData } from '@/types';
import OpenAI from 'openai';
import { formatCurrency } from '@/lib/localStorageUtils';

// AI Summary Generation Prompt
const DAILY_SUMMARY_PROMPT = `You are a professional trading psychology coach and journaling assistant.  
Analyze a trader's daily performance and mindset using the provided data.  
Your goal is to generate a concise, practical daily reflection that helps the trader grow without judgment.

---

## 📊 Inputs

**Trades:**
A list of trades in this format:
- symbol
- direction (long/short)
- risk amount
- RR ratio
- result (win/loss/breakeven)
- linked mood or note if any

**Quick Notes:**
A list of any quick notes they wrote that day.  
Each note includes:
- note text
- tags (like "FOMO", "discipline", "mistake")
- mood emoji if present
- timestamp

**Daily Stats:**
- Total P&L for the day
- Win rate
- Total XP earned
- Mood trend for the day (e.g., neutral → excellent)

---

## 🎯 Output

✅ Write 3-5 short paragraphs.  
✅ Highlight:
- What went well today (focus on trade execution and rule-following)
- What didn't go well (mistakes, rule breaks, mindset slip-ups)
- Recurring patterns you notice from the notes/tags
- A single clear lesson or focus for tomorrow

✅ Use a friendly, coaching tone.  
✅ Be specific but short.  
✅ Avoid generic fluff — always tie comments to their real data.

---

## 📌 Example Output

"Nice work today! You executed 4 trades with a solid win rate of 75% and ended with a profit of $165. Your mood improved from neutral to excellent, showing good emotional control.

From your notes, I see you tagged 'discipline' and 'stick to plan' multiple times, which is a good sign you're building consistency. One note mentioned a manual lockout after a strong session — great discipline!

You did well not to revenge trade after a loss. Keep an eye on overtrading tomorrow, since you took more trades than your daily plan.

Focus tomorrow: stick to your risk levels, review setups before entering, and close the day early if you feel your edge is gone."

---

## 🧩 Return only the finished daily reflection text.`;

export const generateDailySummary = async (data: DailyJournalData): Promise<string> => {
  try {
    // Try AI first if API key is available
    const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      return await generateAISummaryWithAPI(data);
    }
    
    // Fallback to local generation
    return generateLocalSummary(data);
  } catch (error) {
    console.error('Failed to generate AI summary:', error);
    return generateFallbackSummary(data);
  }
};

const generateLocalSummary = (data: DailyJournalData): string => {
  const { trades, notes, stats } = data;
  
  if (trades.length === 0 && notes.length === 0) {
    return "No trading activity today. Sometimes the best trade is no trade! Use this time to study setups, review your rules, or work on your trading plan.";
  }
  
  // Handle notes-only case
  if (trades.length === 0 && notes.length > 0) {
    const paragraphs: string[] = [];
    
    paragraphs.push(`No trades today, but you took ${notes.length} thoughtful note${notes.length > 1 ? 's' : ''}. This shows great discipline in observation and learning.`);
    
    // Analyze notes
    const allTags = notes.flatMap(note => note.tags || []);
    const commonTags = getCommonTags(allTags);
    
    if (commonTags.length > 0) {
      paragraphs.push(`Your notes focused on ${commonTags.slice(0, 3).map(tag => `"${tag}"`).join(', ')}. ${getTagInsight(commonTags[0])}`);
    }
    
    paragraphs.push('Keep this habit of documenting your thoughts and observations - it\'s building your trading intuition even on non-trading days.');
    
    return paragraphs.join('\n\n');
  }

  const paragraphs: string[] = [];
  
  // Performance Summary
  if (trades.length > 0) {
    const winRate = Math.round((stats.winRate || 0) * 100) / 100;
    const profitLoss = stats.totalPnL >= 0 ? 'profit' : 'loss';
    const emotion = stats.totalPnL >= 0 ? 'Great job!' : 'Keep your head up!';
    
    paragraphs.push(
      `${emotion} You executed ${trades.length} trade${trades.length > 1 ? 's' : ''} today with a ${winRate}% win rate and ended with a ${profitLoss} of ${formatCurrency(Math.abs(stats.totalPnL))}. ${getMoodTrendText(stats.moodTrend)}`
    );
  }

  // Notes Analysis
  if (notes.length > 0) {
    const allTags = notes.flatMap(note => note.tags || []);
    const commonTags = getCommonTags(allTags);
    
    if (commonTags.length > 0) {
      paragraphs.push(
        `From your notes, I noticed you tagged ${commonTags.slice(0, 3).map(tag => `"${tag}"`).join(', ')} frequently. ${getTagInsight(commonTags[0])}`
      );
    }
  }

  // Specific Trade Analysis
  if (trades.length > 0) {
    const winners = trades.filter(t => t.result === 'win');
    const losers = trades.filter(t => t.result === 'loss');
    
    if (winners.length > losers.length) {
      paragraphs.push(
        `You showed good discipline with more winners than losers. ${getWinnerInsight()}`
      );
    } else if (losers.length > 0) {
      paragraphs.push(
        `You had some losses today, but that's part of trading. ${getLoserInsight()} The key is learning from each trade.`
      );
    }
  }

  // Tomorrow's Focus
  paragraphs.push(
    `${getTomorrowFocus(trades, notes, stats)}`
  );

  return paragraphs.join('\n\n');
};

const generateFallbackSummary = (data: DailyJournalData): string => {
  const { trades, stats } = data;
  
  if (trades.length === 0) {
    return "No trades today. Use this time to review your strategy and prepare for tomorrow's opportunities.";
  }

  return `You completed ${trades.length} trade${trades.length > 1 ? 's' : ''} today with a P&L of ${formatCurrency(stats.totalPnL)}. ${stats.winRate >= 50 ? 'Good execution!' : 'Focus on quality setups tomorrow.'} Remember to stick to your risk management rules.`;
};

const getMoodTrendText = (moodTrend: string): string => {
  if (moodTrend.includes('→')) {
    const [, end] = moodTrend.split('→').map(s => s.trim());
    if (end === 'excellent' || end === 'good') {
      return 'Your mood improved throughout the day, showing good emotional control.';
    } else if (end === 'poor' || end === 'terrible') {
      return 'Your mood declined during the day - consider taking breaks between trades.';
    }
  }
  return 'Your emotional state remained stable throughout the session.';
};

const getCommonTags = (tags: string[]): string[] => {
  const tagCounts = tags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([tag]) => tag);
};

const getTagInsight = (tag: string): string => {
  const tagInsights: Record<string, string> = {
    'discipline': 'This shows you\'re building consistency in following your rules.',
    'fomo': 'Watch out for FOMO entries - they often lead to poor risk management.',
    'patience': 'Great patience! Waiting for quality setups usually pays off.',
    'revenge': 'Revenge trading is dangerous - take a break after losses.',
    'breakout': 'You\'re spotting breakout patterns well - keep refining your entry timing.',
    'support': 'Support level trades can be profitable - ensure you have proper confirmation.',
    'resistance': 'Trading resistance levels requires precision - nice work identifying them.',
    'overtrading': 'Overtrading can hurt performance - stick to your daily trade limit.',
    'risk-management': 'Good risk management is the foundation of profitable trading.',
    'stop-loss': 'Proper stop-loss placement is crucial - you\'re on the right track.',
  };
  
  return tagInsights[tag] || 'This pattern in your notes shows areas for continued focus.';
};

const getWinnerInsight = (): string => {
  const insights = [
    'Keep doing what you\'re doing with your winning trades.',
    'Your winning trades show good setup recognition.',
    'You\'re letting your winners run - that\'s key to profitability.',
    'Your entries on winning trades were well-timed.',
  ];
  
  return insights[Math.floor(Math.random() * insights.length)];
};

const getLoserInsight = (): string => {
  const insights = [
    'Your stop-losses helped limit damage on losing trades.',
    'Cut your losses quickly - that\'s what separates pros from amateurs.',
    'Losing trades are learning opportunities - review what went wrong.',
    'Your risk management kept losses manageable.',
  ];
  
  return insights[Math.floor(Math.random() * insights.length)];
};

const getTomorrowFocus = (_trades: any[], _notes: any[], _stats: any): string => {
  const focuses = [
    'Focus tomorrow: stick to your risk levels and review setups before entering.',
    'Tomorrow\'s goal: wait for A+ setups and avoid FOMO entries.',
    'Focus area: maintain discipline and follow your trading plan.',
    'Priority tomorrow: quality over quantity in your trade selection.',
    'Keep tomorrow simple: risk management first, profits second.',
  ];
  
  // Customize based on performance
  if (_stats.totalPnL < 0) {
    return 'Focus tomorrow: smaller position sizes and higher probability setups. Quality over quantity.';
  } else if (_trades.length > 5) {
    return 'You traded frequently today. Tomorrow, focus on being more selective with your entries.';
  }
  
  return focuses[Math.floor(Math.random() * focuses.length)];
};

// Real AI Integration with OpenAI
export const generateAISummaryWithAPI = async (data: DailyJournalData): Promise<string> => {
  const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Note: In production, you'd want this to go through your backend
  });

  try {
    // Prefer widely available model first to avoid empty responses
    const invoke = (model: string) => openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: DAILY_SUMMARY_PROMPT,
        },
        {
          role: 'user',
          content: JSON.stringify(data, null, 2),
        },
      ],
      max_completion_tokens: 700,
    });

    let completion = await invoke('gpt-4o-mini');
    let content = completion.choices[0]?.message?.content || '';
    if (!content.trim()) {
      console.warn('Empty content from gpt-4o-mini, retrying with gpt-4o');
      completion = await invoke('gpt-4o');
      content = completion.choices[0]?.message?.content || '';
    }
    return content || generateFallbackSummary(data);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error; // Re-throw to trigger fallback in parent function
  }
}; 