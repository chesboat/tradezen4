# Multi-Account Calendar Share Feature

## Overview
Implemented an Apple-quality multi-account selector for the calendar share feature, allowing users to select any combination of accounts (active or archived) to view combined analytics in the calendar snapshot.

## What Changed

### 1. **New Component: MultiAccountSelector** (`src/components/MultiAccountSelector.tsx`)
A beautiful, Apple-style dropdown with checkboxes for selecting multiple accounts.

**Key Features:**
- ✅ Clean checkbox UI with smooth animations
- ✅ Grouped sections: Active Accounts and Archived Accounts
- ✅ Quick actions: "All" and "Clear" buttons
- ✅ Smart display text: Shows account name, "X accounts", or "All accounts"
- ✅ Visual feedback with motion animations
- ✅ Prevents deselecting all accounts (always keeps at least one)
- ✅ Shows account metadata (type, broker/firm, currency)

**Design Philosophy:**
- Thin, smooth lines (following user's Apple UI preference)
- Intuitive interactions with hover states
- Seamless dropdown experience
- Account icons for quick visual identification

### 2. **Updated CalendarView** (`src/components/CalendarView.tsx`)

**State Management:**
```typescript
// Multi-account selection for share modal
const [shareSelectedAccountIds, setShareSelectedAccountIds] = useState<string[]>(() => {
  if (selectedAccountId) {
    // If it's a group, expand to all accounts in the group
    const accountIds = getAccountIdsForSelection(selectedAccountId);
    return accountIds;
  }
  return [];
});
```

**Enhanced Calendar Data Generation:**
- Modified `createCalendarDay` to accept either:
  - `selectedAccountId` (string) for main calendar view
  - Array of account IDs (string[]) for share modal
- Added `shareCalendarData` and `shareWeeklyData` computed separately for share modal
- Filters trades, reflections, and notes based on selected accounts

**Key Changes:**
- Calendar data now supports flexible account filtering
- Share modal gets its own dedicated data stream
- Maintains backward compatibility with existing calendar view

### 3. **Enhanced CalendarShareModal** (`src/components/CalendarShareModal.tsx`)

**New Props:**
```typescript
interface CalendarShareModalProps {
  // ... existing props
  selectedAccountIds?: string[];
  onAccountSelectionChange?: (accountIds: string[]) => void;
}
```

**UI Improvements:**
- Added MultiAccountSelector in modal header
- Shows selected account names or count in subtitle
- Dynamic text: "Account Name" → "3 accounts" → "All accounts"
- Account selector positioned elegantly next to title

**Display Logic:**
```typescript
const accountDisplayText = selectedAccountIds.length === 1 
  ? selectedAccountNames
  : selectedAccountIds.length > 1 
    ? `${selectedAccountIds.length} accounts`
    : 'All accounts';
```

## User Experience

### Before:
- Calendar share showed only the currently selected account
- No way to combine archived accounts with active ones
- Limited to single account or group view

### After:
1. **Open Share Modal** → Click the share button on calendar
2. **Select Accounts** → Use the dropdown to pick any combination:
   - Mix active and archived accounts
   - Select specific accounts for comparison
   - View combined P&L across chosen accounts
3. **Share** → The calendar snapshot shows combined analytics for all selected accounts

## Example Use Cases

### Use Case 1: Compare Prop Firms
Select your FTMO account + Funded Next account to see combined performance

### Use Case 2: Include Archived Accounts
Select current live account + archived demo account to show your trading journey

### Use Case 3: Multi-Account Traders
Select all your active accounts to show total portfolio performance

## Technical Details

### Data Flow:
```
CalendarView
  ├─ shareSelectedAccountIds (state)
  ├─ createCalendarDay(date, isOtherMonth, accountIds[])
  ├─ shareCalendarData (computed)
  └─ shareWeeklyData (computed)
       ↓
CalendarShareModal
  ├─ MultiAccountSelector (component)
  ├─ selectedAccountIds (prop)
  └─ onAccountSelectionChange (callback)
```

### Performance:
- Uses `useMemo` for efficient recomputation
- Only recalculates when account selection changes
- Maintains separate data streams for main view vs share modal

### Accessibility:
- Keyboard navigation support
- Clear visual feedback
- Semantic HTML structure
- ARIA-friendly interactions

## Apple Design Principles Applied

1. **Simplicity** - One dropdown, clear purpose
2. **Intuitive** - Checkboxes everyone understands
3. **Seamless** - Smooth animations, no jarring transitions
4. **Informative** - Shows account details without clutter
5. **Flexible** - Works for any account combination
6. **Polished** - Thin lines, clean spacing, perfect alignment

## Future Enhancements (Optional)

- [ ] Remember last selected accounts in localStorage
- [ ] Add "Favorites" quick selection
- [ ] Show account balance/size in selector
- [ ] Add account color coding
- [ ] Support drag-to-reorder accounts

## Files Modified

1. `src/components/MultiAccountSelector.tsx` (NEW)
2. `src/components/CalendarView.tsx` (MODIFIED)
3. `src/components/CalendarShareModal.tsx` (MODIFIED)

## Testing Checklist

- [x] Select single account
- [x] Select multiple accounts
- [x] Select all accounts
- [x] Mix active and archived accounts
- [x] Calendar data updates correctly
- [x] Share modal shows correct account names
- [x] No linter errors
- [x] Smooth animations
- [x] Dropdown closes on outside click
- [x] At least one account always selected

---

**Implementation Date:** November 5, 2025  
**Status:** ✅ Complete  
**Design Quality:** 🍎 Apple-level

