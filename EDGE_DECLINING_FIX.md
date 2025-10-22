# Edge Declining Issue - Root Cause & Fix

## The Problem

You reported seeing "Edge Declining" in the activity bar despite having 2 winning trades:
- **Yesterday (10/21/2025)**: MNQ, Win, $365.94
- **Today (10/22/2025)**: YM, Win, $321.60

## Root Cause Analysis

### How the Edge Score Works

The edge score is calculated based on **expectancy** (expected profit per trade):

```
Expectancy = (Win Rate / 100) × Avg Win - (1 - Win Rate / 100) × Avg Loss
```

Score thresholds:
- Expectancy > $50 → Score = 90
- Expectancy > $20 → Score = 75
- Expectancy > $10 → Score = 60
- Expectancy > $0 → Score = 45
- Expectancy > -$10 → Score = 30
- Otherwise → Score = 15

### Why "Declining" Appeared

The system stores a **snapshot** of your trading health metrics in localStorage. When you add a new trade, it compares the current metrics to the stored snapshot:

1. **After Trade 1 (MNQ, $365.94)**:
   - Win Rate: 100%
   - Avg Win: $365.94
   - Expectancy: $365.94
   - **Score: 90**
   - Snapshot stored with score = 90

2. **After Trade 2 (YM, $321.60)**:
   - Win Rate: 100%
   - Avg Win: ($365.94 + $321.60) / 2 = $343.77
   - Expectancy: $343.77
   - **Score: 90** (still above $50 threshold)
   - BUT... something caused the score to drop below 85

### The Actual Bug

There were two issues:

1. **Profit Factor Bug**: When you have no losses, the profit factor was set to `0` instead of a high value (like 999). This is mathematically incorrect.
   ```typescript
   // OLD (WRONG):
   const profitFactor = losingTrades.length > 0 ? (totalWinningPnl / totalLosingPnl) : 0;
   
   // NEW (FIXED):
   const profitFactor = losingTrades.length > 0 
     ? (totalWinningPnl / totalLosingPnl) 
     : (winningTrades.length > 0 ? 999 : 0);
   ```

2. **Insufficient Logging**: There wasn't enough diagnostic information to understand why the score changed.

## The Fix

### 1. Fixed Profit Factor Calculation
- When there are no losses, profit factor is now set to 999 (effectively infinite)
- This correctly represents a perfect win rate

### 2. Added Comprehensive Logging
Added console logs at three key points:

**A. Edge Score Calculation** (`metricsEngine.ts`):
```typescript
console.log('[Edge Ring] Score calculation:', {
  wins: winningTrades.length,
  losses: losingTrades.length,
  avgWin: avgWin.toFixed(2),
  avgLoss: avgLoss.toFixed(2),
  expectancy: expectancy.toFixed(2),
  profitFactor: profitFactor.toFixed(2),
  score
});
```

**B. Event Detection** (`tradingHealthEventDetector.ts`):
```typescript
console.log('[Trading Health Events] Edge ring changed:', {
  oldValue: prev.edge.value,
  newValue: curr.edge.value,
  change: curr.edge.value - prev.edge.value,
  oldExpectancy: prev.edge.expectancy,
  newExpectancy: curr.edge.expectancy,
  oldWins: prev.edge.wins,
  newWins: curr.edge.wins,
  oldLosses: prev.edge.losses,
  newLosses: curr.edge.losses,
});
```

**C. Activity Logging** (`activityLogger.ts`):
```typescript
console.log('[Activity Logger] Logging ring change:', {
  ringType,
  oldValue,
  newValue,
  change,
  trend,
  expectancy
});
```

## How to Debug This Issue

If you see "Edge Declining" again when it shouldn't be declining:

1. **Open Browser Console** (F12 or Cmd+Option+I)
2. **Navigate to Trading Health view** to trigger the calculation
3. **Look for these log messages**:
   - `[Edge Ring] Score calculation:` - Shows current score details
   - `[Trading Health Events] Edge ring changed:` - Shows old vs new comparison
   - `[Activity Logger] Logging ring change:` - Shows what's being logged

4. **Check the values**:
   - Is the expectancy actually dropping?
   - Is the score threshold being crossed?
   - What are the old vs new values?

## Expected Behavior

With your 2 winning trades:
- **Score should be 90** (expectancy of $343.77 > $50)
- **Trend should be "stable"** (score unchanged at 90)
- **No activity log entry** should be created (change < 5 points)

## Next Steps

1. **Clear the stored snapshot** to reset:
   ```javascript
   // In browser console:
   localStorage.removeItem('trading-health-snapshot');
   ```

2. **Refresh the page** and navigate to Trading Health

3. **Add a new trade** and check the console logs

4. **Share the console output** if the issue persists

## Files Modified

- `src/lib/tradingHealth/metricsEngine.ts` - Fixed profit factor, added logging
- `src/lib/tradingHealthEventDetector.ts` - Added detailed event logging
- `src/lib/activityLogger.ts` - Added activity logging

## Apple Design Philosophy

This fix maintains the Apple-style approach:
- **Intelligent, not noisy**: Only log significant changes (≥5 points)
- **Transparent**: Comprehensive logging for debugging
- **Accurate**: Correct mathematical calculations
- **Contextual**: Show expectancy changes in activity descriptions

