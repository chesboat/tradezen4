/**
 * Generate suggested tags for a daily reflection using keyword analysis
 */
export async function generateReflectionTags(reflection: string): Promise<string[]> {
  if (!reflection.trim()) return [];

  try {
    // Simple keyword-based tag generation
    const text = reflection.toLowerCase();
    const suggestedTags: string[] = [];

    // Trading behavior keywords
    const behaviorKeywords = {
      'discipline': ['disciplined', 'patient', 'waited', 'stuck to plan', 'followed rules'],
      'impatience': ['rushed', 'hurried', 'impatient', 'jumped in', 'quick'],
      'overtrading': ['too many', 'overtraded', 'overtrade', 'excessive', 'too much'],
      'fomo': ['fomo', 'fear of missing', 'missed out', 'chased', 'jumping in'],
      'revenge trade': ['revenge', 'angry', 'frustrated', 'get back', 'loss back'],
      'risk management': ['risk', 'stop loss', 'position size', 'risk reward', 'r:r'],
      'entry timing': ['entry', 'entered', 'timing', 'too early', 'too late'],
      'exit strategy': ['exit', 'took profit', 'stopped out', 'holding', 'sold'],
    };

    // Market condition keywords
    const marketKeywords = {
      'volatile': ['volatile', 'volatility', 'choppy', 'whipsaw', 'erratic'],
      'trending': ['trend', 'trending', 'momentum', 'breakout', 'directional'],
      'news event': ['news', 'announcement', 'earnings', 'fed', 'economic'],
      'low volume': ['low volume', 'quiet', 'slow', 'thin trading'],
      'high volume': ['high volume', 'active', 'busy', 'lots of activity'],
    };

    // Emotional state keywords
    const emotionKeywords = {
      'confident': ['confident', 'sure', 'certain', 'good feeling', 'positive'],
      'anxious': ['anxious', 'nervous', 'worried', 'uncertain', 'stressed'],
      'calm': ['calm', 'relaxed', 'composed', 'steady', 'peaceful'],
      'frustrated': ['frustrated', 'annoyed', 'irritated', 'disappointed'],
      'focused': ['focused', 'concentrated', 'clear', 'sharp', 'attentive'],
    };

    // Performance keywords
    const performanceKeywords = {
      'profitable': ['profit', 'win', 'green', 'positive', 'successful'],
      'loss': ['loss', 'red', 'negative', 'losing', 'down'],
      'breakeven': ['breakeven', 'flat', 'neutral', 'break even'],
      'consistency': ['consistent', 'steady', 'regular', 'reliable'],
      'improvement': ['better', 'improved', 'progress', 'learning', 'growing'],
    };

    // Check for keyword matches
    const allKeywords = {
      ...behaviorKeywords,
      ...marketKeywords,
      ...emotionKeywords,
      ...performanceKeywords,
    };

    for (const [tag, keywords] of Object.entries(allKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        suggestedTags.push(tag);
      }
    }

    // If no specific matches, suggest some general tags based on length and content
    if (suggestedTags.length === 0) {
      if (text.includes('trade') || text.includes('trading')) {
        suggestedTags.push('trading');
      }
      if (text.includes('market')) {
        suggestedTags.push('market analysis');
      }
      if (text.includes('plan') || text.includes('strategy')) {
        suggestedTags.push('plan execution');
      }
      if (text.includes('learn') || text.includes('lesson')) {
        suggestedTags.push('learning');
      }
    }

    // Remove duplicates and limit to 5 tags
    const uniqueTags = [...new Set(suggestedTags)].slice(0, 5);
    
    // Add some delay to simulate processing (optional)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return uniqueTags;
  } catch (error) {
    console.error('Failed to generate reflection tags:', error);
    return [];
  }
}

/**
 * Common reflection tags for autocomplete suggestions
 */
export const COMMON_REFLECTION_TAGS = [
  // Trading Behaviors
  'Discipline',
  'Patience',
  'Overtrading',
  'Undertrading',
  'Good Entry',
  'Poor Entry',
  'Early Exit',
  'Late Exit',
  'Risk Management',
  'Position Sizing',
  
  // Emotional States
  'FOMO',
  'Revenge Trade',
  'Confident',
  'Anxious',
  'Calm',
  'Frustrated',
  'Excited',
  'Stressed',
  'Focused',
  'Distracted',
  
  // Market Conditions
  'Trending',
  'Volatile',
  'Choppy',
  'Low Volume',
  'High Volume',
  'News Event',
  'Earnings',
  'Economic Data',
  
  // Lessons & Improvements
  'Entry Timing',
  'Exit Strategy',
  'Stop Loss',
  'Take Profit',
  'Market Analysis',
  'Technical Analysis',
  'Fundamental Analysis',
  'Plan Execution',
  'Journal Review',
  'Learning',
  
  // Performance
  'Profitable',
  'Breakeven',
  'Loss',
  'Big Win',
  'Small Win',
  'Consistency',
  'Improvement',
  'Mistake',
]; 