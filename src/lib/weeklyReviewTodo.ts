import { useTodoStore } from '@/store/useTodoStore';
import { useWeeklyReviewStore } from '@/store/useWeeklyReviewStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';

/**
 * Checks if it's time to add a weekly review todo and adds it if needed.
 * Should be called on Friday after 4 PM local time through Sunday 11:59 PM.
 */
export const checkAndAddWeeklyReviewTodo = async (): Promise<void> => {
  const { selectedAccountId } = useAccountFilterStore.getState();
  const { getMondayOfWeek, isWeekReviewAvailable, getReviewByWeek } = useWeeklyReviewStore.getState();
  const { tasks, addTask } = useTodoStore.getState();
  
  if (!selectedAccountId) return;
  
  const now = new Date();
  const currentWeekMonday = getMondayOfWeek(now);
  
  // Check if weekly review is available for this week
  if (!isWeekReviewAvailable(currentWeekMonday, selectedAccountId)) {
    return;
  }
  
  // Check if review is already completed
  const existingReview = getReviewByWeek(currentWeekMonday, selectedAccountId);
  if (existingReview?.isComplete) {
    return;
  }
  
  // Check if we already have a weekly review todo for this week
  const weeklyReviewTodoExists = tasks.some(task => 
    task.text.includes('Complete Weekly Review') && 
    task.status === 'open' &&
    task.category === 'journal' &&
    task.scheduledFor &&
    new Date(task.scheduledFor).toISOString().split('T')[0] >= currentWeekMonday
  );
  
  if (weeklyReviewTodoExists) {
    return;
  }
  
  // Create the weekly review todo with a special URL that will trigger the modal
  const weekStartDate = new Date(currentWeekMonday);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  
  const weekRange = `${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  
  try {
    await addTask(`Complete Weekly Review (${weekRange})`, {
      priority: 'high',
      category: 'journal',
      scheduledFor: now.toISOString(),
      url: `#weekly-review:${currentWeekMonday}`, // Special URL format to trigger modal
      pinned: true
    });
    
    console.log('Added weekly review todo for week:', currentWeekMonday);
  } catch (error) {
    console.error('Failed to add weekly review todo:', error);
  }
};

/**
 * Checks if a URL is a weekly review trigger URL and extracts the week date
 */
export const parseWeeklyReviewUrl = (url: string): string | null => {
  if (url.startsWith('#weekly-review:')) {
    return url.replace('#weekly-review:', '');
  }
  return null;
};

/**
 * Opens the weekly review modal for a specific week
 */
export const openWeeklyReviewFromUrl = (url: string): boolean => {
  const weekOf = parseWeeklyReviewUrl(url);
  if (!weekOf) return false;
  
  // Dispatch a custom event that the calendar view can listen to
  window.dispatchEvent(new CustomEvent('openWeeklyReview', { 
    detail: { weekOf } 
  }));
  
  return true;
};
