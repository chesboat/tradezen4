import { MoodType, Quest } from '@/types';

const getMoodCategory = (mood: MoodType): 'negative' | 'neutral' | 'positive' => {
  switch (mood) {
    case 'terrible':
    case 'poor':
      return 'negative';
    case 'neutral':
      return 'neutral';
    case 'good':
    case 'excellent':
      return 'positive';
  }
};

export async function generateDailyFocus(currentMood: MoodType): Promise<Quest[]> {
  const moodCategory = getMoodCategory(currentMood);
  
  const quests: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  // Generate mood-based quests
  if (moodCategory === 'negative') {
    quests.push({
      title: 'Take a Break',
      description: 'Step away from trading for 15 minutes to clear your mind.',
      type: 'daily',
      status: 'pending',
      progress: 0,
      maxProgress: 1,
      xpReward: 50,
      accountId: 'system'
    });
  }

  if (moodCategory === 'positive') {
    quests.push({
      title: 'Maintain Focus',
      description: 'Complete 3 trades with strict adherence to your strategy.',
      type: 'daily',
      status: 'pending',
      progress: 0,
      maxProgress: 3,
      xpReward: 100,
      accountId: 'system'
    });
  }

  // Add default quests
  quests.push({
    title: 'Daily Journal',
    description: 'Write a reflection on your trading day.',
    type: 'daily',
    status: 'pending',
    progress: 0,
    maxProgress: 1,
    xpReward: 50,
    accountId: 'system'
  });

  return quests as Quest[];
}