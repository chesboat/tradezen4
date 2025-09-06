import { useTodoStore } from '@/store/useTodoStore';
import { useWeeklyReviewStore } from '@/store/useWeeklyReviewStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useNavigationStore } from '@/store/useNavigationStore';

// Remove duplicate weekly-review todos for the same week
export const cleanupWeeklyReviewTodos = async (): Promise<void> => {
  const { tasks, deleteTask } = useTodoStore.getState();
  const seen = new Set<string>();
  for (const t of tasks) {
    if (!t.url) continue;
    const weekOf = parseWeeklyReviewUrl(t.url);
    if (!weekOf) continue;
    const key = `weekly:${weekOf}`;
    if (seen.has(key)) {
      // keep the earliest pinned/open one; delete extras
      await deleteTask(t.id);
    } else {
      seen.add(key);
    }
  }
};

/**
 * Checks if it's time to add a weekly review todo and adds it if needed.
 * Should be called on Friday after 4 PM local time through Sunday 11:59 PM.
 */
export const checkAndAddWeeklyReviewTodo = async (): Promise<void> => {
  const { selectedAccountId } = useAccountFilterStore.getState();
  const { getMondayOfWeek, isWeekReviewAvailable, getReviewByWeek } = useWeeklyReviewStore.getState();
  const { tasks, addTask } = useTodoStore.getState();
  
  if (!selectedAccountId) return;
  // First, clean up any duplicate weekly-review todos
  await cleanupWeeklyReviewTodos();
  
  const now = new Date();
  const currentWeekMonday = getMondayOfWeek(now);
  
  // Check if weekly review is available for this week
  if (!isWeekReviewAvailable(currentWeekMonday, selectedAccountId)) {
    return;
  }
  
  // Check if review is already completed
  const existingReview = getReviewByWeek(currentWeekMonday, selectedAccountId);
  if (existingReview?.isComplete) {
    // If it's already complete, ensure any related todos are marked done
    const url = `#weekly-review:${currentWeekMonday}`;
    const related = tasks.filter(t => t.url === url && t.status !== 'done');
    const { updateTask } = useTodoStore.getState();
    await Promise.all(related.map(t => updateTask(t.id, { status: 'done', completedAt: new Date().toISOString() as any })));
    return;
  }
  
  // Check if we already have a weekly review todo for this week (any status)
  const weeklyUrl = `#weekly-review:${currentWeekMonday}`;
  const weeklyReviewTodoExists = tasks.some(task => task.url === weeklyUrl);
  
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
      url: weeklyUrl, // Special URL format to trigger modal
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
  // Ensure we are on the calendar view
  try {
    const { setCurrentView } = useNavigationStore.getState();
    setCurrentView('calendar');
  } catch {}

  // If CalendarView is not yet mounted, stash the intent globally
  (window as any).__pendingOpenWeeklyReview = weekOf;

  // Dispatch after a short delay to give CalendarView time to mount
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('openWeeklyReview', { detail: { weekOf } }));
  }, 150);

  return true;
};
