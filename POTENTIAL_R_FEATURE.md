# Potential R Feature Guide

## Overview

The **Potential R** feature is a sophisticated analytics system designed to help you understand whether your profit targets are too conservative. It captures how far price actually ran past your target on winning trades, then uses AI analysis to suggest optimal target sizes.

## How It Works

### Step 1: Log Potential R on Winning Trades

After a winning trade closes, you can optionally record "Potential R" - the actual R value that price reached.

**Where:** On the `/trades` page:
1. Find a winning trade in the table
2. Click the three-dot menu (**Actions**)
3. Select **"Add Potential R"** (only appears for wins)
4. Enter the R value price actually reached
   - Example: If you targeted 0.75R but price ran to 1.2R, enter `1.2`
5. Click **Save**

### Step 2: View Analytics

Navigate to the **Analytics** dashboard (sidebar → Analytics).

You'll see the **Potential R Analysis** card which shows:

#### Main Insight
- AI-generated recommendation based on your patterns
- Tells you if your targets are too conservative
- Suggests a better target size to maximize wins

#### Target Performance Breakdown
- Shows each target size you've used (0.75R, 1.0R, etc.)
- Displays average actual R reached for that target
- Shows the "gap" (how much further price ran)

Example:
```
0.75R target (22 wins)
├─ Avg actual: 1.2R ↑
└─ Gap: +0.45R (price ran 45% further!)

1.0R target (15 wins)
├─ Avg actual: 1.5R ↑
└─ Gap: +0.5R
```

#### Scenario Modeling
- Shows what your average win would be if you targeted higher
- Based on historical data, not speculation
- Example: "Targeting 1.0R instead of 0.75R could increase avg win by +33%"

#### Statistics Summary
- **Wins tracked:** How many winning trades you've logged potential R for
- **Avg gap:** Average R overshoot across all targets
- **Target sizes:** How many different target sizes you use

## The Math Behind It

### How Potential R is Used

For each winning trade with potentialR:
1. Extract target R: `trade.riskRewardRatio`
2. Extract actual R: `trade.potentialR`
3. Calculate gap: `potentialR - riskRewardRatio`

### Grouping By Target

Trades are grouped by their target R:
```
Group by riskRewardRatio:
  0.75R group: [1.2R, 1.15R, 0.95R, ...] → avg 1.13R
  1.0R group:  [1.5R, 1.8R, 1.2R, ...] → avg 1.5R
```

### Scenario Modeling

When you calculate "what if you targeted higher":
```
Current: 0.75R target → avg 1.13R actual → avg win = $200

If you targeted: (0.75 + 1.13) / 2 = 0.94R
Your avg win would scale proportionally:
  New avg win = $200 × (0.94 / 0.75) = $251

Improvement: +$51 per win (+25%)
```

**Key assumption:** Your win rate and risk per trade stay the same - only the magnitude of wins increases.

### Why We Don't Factor In Losses

- Losses don't change based on target size (stop placement doesn't change)
- Win rate should remain consistent (you hit or miss support/resistance regardless)
- Only win magnitude grows when you capture more of a move
- This keeps the math simple and conservative

## AI Insight Logic

The analytics card generates one of three types of insights:

### 1. **Strong Recommendation** (gap > 0.5R)
```
"Your 0.75R targets typically run to 1.2R. 
Consider targeting 0.97R instead for +33% more per win."
```
→ Recommends midpoint between target and average actual

### 2. **Conservative Suggestion** (gap > 0.2R)
```
"Your 0.75R targets are conservative. Price typically 
runs 0.3R further. Consider increasing to 1.0R."
```
→ Recommends adding the gap to your target

### 3. **Well-Calibrated** (gap ≤ 0.2R)
```
"Your targets are well-calibrated. Price runs 0.78R 
on average vs. 0.75R target."
```
→ Affirms your current approach

## Data Requirements

For the analytics to work:
- ✅ At least 1 winning trade with potentialR data
- ✅ Mixed targets (e.g., some 0.75R, some 1.0R) shows most insight
- ✅ Minimum 5-10 trades per target size for statistical reliability

**Empty State:** If no potential R data exists, you'll see a prompt to start logging it.

## Best Practices

### When to Log Potential R
- ✅ After every win (optional but recommended)
- ✅ When you noticed price ran further than your exit
- ✅ When you wonder "did I leave money on the table?"

### How to Be Accurate
- Enter the **actual high** for longs (or low for shorts) price reached
- Calculate R from your risk amount: `(actualPrice - entryPrice) / riskAmount`
- Be honest - don't estimate or round
- If unsure, leave it blank for that trade

### Interpreting Results
- **Gap > 0.5R:** Consider raising targets significantly
- **Gap 0.2-0.5R:** You might be slightly conservative
- **Gap < 0.2R:** Your targets are well-calibrated
- **Gap < 0 (negative):** Price didn't reach your target - these shouldn't happen since potentialR only logs on wins!

## Example Workflow

**Day 1: Trade Some Longs**

| Trade | Entry | Exit | Target R | Actual Max | Win | Potential R |
|-------|-------|------|----------|-----------|-----|-------------|
| EUR/USD | 1.0900 | 1.0925 | 0.75R | 1.0928 | ✅ | 0.85R |
| GBP/USD | 1.2500 | 1.2520 | 0.75R | 1.2535 | ✅ | 1.05R |
| USD/JPY | 147.00 | 147.20 | 1.00R | 147.50 | ✅ | 1.43R |

**Day 2: Check Analytics**

The system analyzes:
- 0.75R target group (2 trades): avg potential = 0.95R, gap = +0.20R
- 1.00R target group (1 trade): avg potential = 1.43R, gap = +0.43R

**AI Insight Generated:**
> "Your 1.0R targets typically run to 1.43R. Consider targeting 1.2R instead for +19% more per win."

## Technical Details

### Storage
- Field: `Trade.potentialR` (optional number)
- Only set for winning trades
- Stored in Firestore alongside other trade data

### Persistence
- Data persists across sessions
- Included in exports/backups
- Can be edited anytime (click the menu again)

### Filtering
- Potential R analysis automatically filters by:
  - Selected period (7D, 30D, 90D, 1Y, All)
  - Selected account
  - Result = 'win' (losses excluded)
  - Trades with potentialR > 0

## Limitations & Considerations

1. **Sample Size Matters**
   - 1-2 trades per target size = noise
   - 10+ trades per target size = meaningful pattern
   - 20+ trades = high confidence

2. **Market Conditions**
   - Hot markets might run further than usual
   - Range-bound markets might stop at your target
   - Results reflect YOUR market conditions

3. **Historical Only**
   - Analysis is backward-looking
   - Tomorrow's market might behave differently
   - Use as guidance, not gospel

4. **Assumes Consistent Execution**
   - If your exits improve, results might change
   - If market conditions shift, adapt accordingly
   - Recommend re-checking every month

## Common Questions

**Q: Should I immediately change my targets based on this?**
A: Not necessarily. Look for patterns first. If you see +0.3R gap consistently over 20+ trades, then consider it. Don't chase one lucky day.

**Q: What if I have a mix of symbols?**
A: The analysis groups by target R across all symbols. If EUR typically runs further than GBP, it averages out. For finer analysis, consider filtering by symbol first.

**Q: Can I edit potentialR after logging it?**
A: Yes! Click the menu again on the trade and "Add Potential R" will edit the existing value.

**Q: What if I don't want to log potentialR for some trades?**
A: That's fine. Only trades with potentialR > 0 are analyzed. Leave blank if unsure.

**Q: Does this analyze every trade or just recent ones?**
A: You can control this with the period selector (7D, 30D, 90D, 1Y, All Time). Default is 90D for recent focus.

## Next Steps

1. **Start logging:** Click menu on a winning trade → "Add Potential R"
2. **Collect data:** Log for 10-20 wins to see patterns
3. **Check insights:** Go to Analytics to see your patterns
4. **Experiment:** Try a new target size based on the suggestion
5. **Iterate:** Log more data, refine targets, repeat

---

**Feature Version:** 1.0  
**Last Updated:** November 2024

