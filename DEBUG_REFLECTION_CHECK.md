# Debug Steps for Missing Streak Icon

## Issue
User has text in daily reflection but streak icon isn't showing on calendar.

## Quick Checks:

1. **Open Browser Console** (F12 or Cmd+Option+I)
   - Look for any errors related to reflections or calendar
   - Check for failed Firebase reads/writes

2. **Verify Data is Saved:**
   ```javascript
   // Paste this in browser console:
   const reflections = JSON.parse(localStorage.getItem('dailyReflections-storage') || '{}');
   console.log('Today\'s reflection:', reflections.state?.reflections?.filter(r => r.date === new Date().toISOString().split('T')[0]));
   ```

3. **Check which fields you filled:**
   - Did you fill: Daily Reflection, Key Focus, Goals, or Lessons?
   - Are they in the daily modal (DayDetailModalApple)?

4. **Try this:**
   - Refresh the page (Cmd+R)
   - Navigate away from calendar and back
   - Check if the data persists after refresh

## Potential Issues:

### Issue 1: Using Wrong Modal
There are multiple reflection entry points:
- ✅ **DayDetailModalApple** (the main daily journal) - THIS ONE counts
- ❌ Insight Blocks (separate feature, doesn't count for streak)
- ❌ Quick Notes (doesn't count for streak)

### Issue 2: Account Mismatch
If you're in "All Accounts" view but wrote the reflection in a specific account, it might not show.

### Issue 3: Date Timezone Issue
The calendar uses `toISOString().split('T')[0]` which might differ from local date.

## Test Case:
1. Open today in daily journal
2. Type "test" in the Daily Reflection field
3. Close modal
4. Calendar should show 🔥 immediately

If it doesn't, there's a bug we need to fix!

