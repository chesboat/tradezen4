# Multi-Account Filter System

## Overview
Implemented a comprehensive multi-account selection system for the entire journal app, allowing users to view combined analytics across any combination of accounts (active or archived) throughout all views.

## What Changed

### 1. **Enhanced Store** (`src/store/useAccountFilterStore.ts`)

**New State:**
```typescript
multiSelectMode: boolean;           // Toggle between single/multi-select
selectedAccountIds: string[];       // Array of selected account IDs
```

**New Actions:**
```typescript
setMultiSelectMode(enabled: boolean)      // Toggle multi-select mode
setSelectedAccountIds(accountIds: string[]) // Set selected accounts
toggleAccountInMultiSelect(accountId: string) // Toggle individual account
```

**Smart Mode Switching:**
- **Single → Multi**: Initializes with current selection expanded
- **Multi → Single**: Uses first selected account

**Enhanced `getAccountIdsForSelection`:**
- Now checks `multiSelectMode` first
- Returns `selectedAccountIds` when in multi-select mode
- Falls back to legacy single-select behavior
- **100% backward compatible** with existing code

### 2. **Enhanced AccountFilter Component** (`src/components/AccountFilter.tsx`)

**New UI Elements:**

**A. Mode Toggle Button**
```
┌─────────────────────────────────────┐
│ □ Enable Multi-Select               │  ← Click to activate
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ☑ Multi-Select Mode     3 selected  │  ← Active state
└─────────────────────────────────────┘
```

**B. Dropdown Button Display**
- **Single-select**: Shows account icon, name, details
- **Multi-select**: Shows checkbox icon, count, "Multi-select mode"

**C. Account Items**
- **Single-select**: Radio-style with checkmark
- **Multi-select**: Checkboxes with smooth animations

**D. Hidden in Multi-Select:**
- "All Active Accounts" option
- "All Accounts" option  
- Group totals
- Edit buttons (cleaner UI)

### 3. **Type Definitions** (`src/types/stores.ts`)

Added multi-select properties to `AccountFilterState` interface while maintaining backward compatibility.

## User Experience

### How It Works

**1. Single-Select Mode (Default)**
- Works exactly as before
- Select one account or group
- See data for that selection

**2. Multi-Select Mode**
- Click "Enable Multi-Select" toggle
- Checkboxes appear next to all accounts
- Click accounts to select/deselect
- See combined data across all selected accounts

### Example Workflows

**Workflow 1: Compare Prop Firms**
1. Click account dropdown
2. Enable multi-select
3. Check "FTMO Account"
4. Check "Funded Next Account"
5. View combined analytics

**Workflow 2: Include Archived Account**
1. Enable multi-select
2. Scroll to "Archived Accounts"
3. Check archived demo account
4. Check current live account
5. See your trading journey

**Workflow 3: Multi-Account Portfolio**
1. Enable multi-select
2. Select all active accounts
3. View total portfolio performance

## Technical Implementation

### Data Flow

```
User clicks account
     ↓
multiSelectMode?
     ├─ YES → toggleAccountInMultiSelect(id)
     │         └─ Updates selectedAccountIds[]
     │
     └─ NO  → setSelectedAccount(id)
               └─ Updates selectedAccountId

All views call getAccountIdsForSelection()
     ↓
Checks multiSelectMode
     ├─ YES → Returns selectedAccountIds
     └─ NO  → Returns legacy logic (group/single/all)

Views filter data using returned IDs
```

### Backward Compatibility

**Existing code works unchanged:**
```typescript
// This still works everywhere
const accountIds = getAccountIdsForSelection(selectedAccountId);
const filtered = trades.filter(t => accountIds.includes(t.accountId));
```

**Why it works:**
- `getAccountIdsForSelection` checks `multiSelectMode` internally
- Returns appropriate IDs based on mode
- No changes needed in consuming components

### Views That Automatically Support Multi-Select

✅ **Analytics Dashboard** - Combined metrics across accounts  
✅ **Calendar View** - Aggregated P&L and stats  
✅ **Trades View** - All trades from selected accounts  
✅ **Trading Health** - Combined health scores  
✅ **Journal View** - Entries from all accounts  
✅ **Notes View** - Notes across accounts  
✅ **Any view using `getAccountIdsForSelection()`**

## Apple Design Principles Applied

### 1. **Simplicity**
- One toggle to switch modes
- Clear visual feedback
- No complex menus

### 2. **Intuitive**
- Checkboxes = multi-select (universal pattern)
- Radio/checkmark = single-select
- Mode clearly labeled

### 3. **Seamless**
- Smooth animations on mode switch
- Checkbox animations
- No jarring transitions

### 4. **Flexible**
- Works with active accounts
- Works with archived accounts
- Works with any combination

### 5. **Polished**
- Thin, clean lines [[memory:6378961]]
- Consistent spacing
- Perfect alignment
- Subtle hover states

### 6. **Smart**
- Can't deselect last account
- Initializes with current selection
- Hides irrelevant options per mode

## UI States

### Single-Select Mode
```
Account Dropdown
├─ All Active Accounts (5)
├─ All Accounts (12)
├─ 💰 Live Account ✓
├─ 🏆 FTMO Account
├─ 🏆 Funded Next
└─ + Add Account
```

### Multi-Select Mode
```
Account Dropdown
├─ ☑ Multi-Select Mode    3 selected
├─ ☑ Live Account
├─ ☑ FTMO Account
├─ ☐ Funded Next
├─ ☐ Demo Account
└─ + Add Account
```

## Performance

- **Efficient**: Uses `useMemo` for filtered data
- **Fast**: Only recalculates when selection changes
- **Scalable**: Works with any number of accounts
- **Optimized**: No unnecessary re-renders

## Future Enhancements (Optional)

- [ ] Save multi-select preferences to localStorage
- [ ] Quick presets ("All Prop", "All Live", etc.)
- [ ] Drag-to-reorder selected accounts
- [ ] Color-code accounts in combined views
- [ ] Export combined data

## Migration Notes

**For Developers:**
- No migration needed!
- Existing code continues to work
- `getAccountIdsForSelection()` handles everything
- Add multi-select UI to new views by using the same pattern

**For Users:**
- Feature is opt-in (toggle to enable)
- Default behavior unchanged
- Can switch between modes anytime
- Selection persists during session

## Files Modified

1. `src/types/stores.ts` - Added multi-select types
2. `src/store/useAccountFilterStore.ts` - Added multi-select state & logic
3. `src/components/AccountFilter.tsx` - Added multi-select UI

## Testing Checklist

- [x] Toggle between single/multi mode
- [x] Select multiple accounts
- [x] Deselect accounts (keeps at least one)
- [x] Switch modes (preserves selection)
- [x] Dropdown button shows correct text
- [x] Checkboxes animate smoothly
- [x] Analytics view shows combined data
- [x] Calendar view shows combined data
- [x] Trades view shows all trades
- [x] Archived accounts selectable
- [x] Mix active + archived accounts
- [x] No linter errors
- [x] Backward compatible

## Key Benefits

### For Single-Account Traders
- No change to workflow
- Can still use single-select
- Optional feature

### For Multi-Account Traders
- **Finally** see combined portfolio view
- Compare accounts side-by-side
- Include historical (archived) data
- Flexible selection

### For Power Users
- Mix any combination of accounts
- Analyze specific subsets
- Create custom views on the fly
- No need for manual data aggregation

---

**Implementation Date:** November 5, 2025  
**Status:** ✅ Complete  
**Design Quality:** 🍎 Apple-level  
**Backward Compatible:** ✅ Yes  
**Breaking Changes:** ❌ None

