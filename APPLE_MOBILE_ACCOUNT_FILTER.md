# 🍎 Apple Design Meeting: Mobile Account Filtering

## Problem Statement
The new iOS-style mobile navigation (`AppleMobileNav`) lacks account filtering capability. Users with multiple trading accounts cannot switch between accounts on mobile, creating a critical UX gap.

## Current State
- **Desktop**: Account filter lives in the left sidebar, always visible when expanded
- **Old Mobile Drawer**: Had `AccountFilter` in the drawer (deprecated)
- **New iOS Mobile Nav**: No account filtering at all ❌

## Apple Design Principles to Consider

### 1. **Progressive Disclosure**
Don't overwhelm the clean bottom nav. Account switching is important but not primary.

### 2. **Thumb-First Design**
Mobile users hold phones one-handed. Account filter must be reachable.

### 3. **Contextual Clarity**
Users should always know which account they're viewing.

### 4. **Minimal Chrome**
The top bar is already minimal (logo + profile). Adding clutter breaks the aesthetic.

---

## Proposed Solutions

### Option A: **Account Badge in Top Bar** (Recommended ⭐)
**Philosophy**: "Glanceable context with intentional interaction"

```
┌─────────────────────────────────────┐
│ [Refine Logo] [2]  [Account Badge]  │ ← Tappable badge shows current account
│                           [Profile]  │
└─────────────────────────────────────┘
```

**Implementation**:
- Place a compact account badge next to the trades badge
- Badge shows: `🟢 Live` or account icon + short name
- Tap badge → bottom sheet with full `AccountFilter` component
- Badge color matches account type (green for live, blue for demo, etc.)

**Pros**:
- Always visible (glanceable)
- Follows iOS pattern (like Wi-Fi/Bluetooth in Control Center)
- Doesn't clutter the UI
- One tap to switch accounts
- Reuses existing `AccountFilter` component

**Cons**:
- Adds one more element to top bar (still minimal)

---

### Option B: **Add to Profile Sheet**
**Philosophy**: "Settings live in settings"

Add account filter to the existing profile bottom sheet (below theme toggle, above log out).

**Pros**:
- No UI changes to top bar
- Accounts feel like "settings"
- Reuses existing sheet

**Cons**:
- Two taps to switch accounts (profile → account)
- Accounts aren't really "settings" — they're core context
- Hidden from primary view

---

### Option C: **Swipe Gesture on Top Bar**
**Philosophy**: "Invisible until you need it"

Swipe left/right on the top bar to cycle through accounts. Long-press to open full selector.

**Pros**:
- Zero UI chrome
- Fast for power users
- Feels magical

**Cons**:
- Not discoverable (users won't know it exists)
- Conflicts with system gestures
- Doesn't show current account clearly

---

### Option D: **Floating Action Menu**
**Philosophy**: "Context-aware quick actions"

Long-press the center `+` button to reveal a radial menu with account switching + other quick actions.

**Pros**:
- Reuses existing prominent UI element
- Feels iOS-native (3D Touch vibes)

**Cons**:
- Overloads the `+` button semantics
- Accounts aren't "actions"
- Harder to implement

---

## Apple Team Recommendation

### **Option A: Account Badge in Top Bar**

This is the most Apple-like solution:
1. **Glanceable**: Users always see their current account context
2. **Intentional**: One deliberate tap opens the full account selector
3. **Familiar**: Mirrors iOS Control Center patterns
4. **Scalable**: Works for 1 account or 20 accounts
5. **Accessible**: Clear visual hierarchy, VoiceOver friendly

### Design Specs (Option A)

#### Top Bar Layout
```
┌──────────────────────────────────────────────┐
│  [Logo] Refine [2]  [🟢 Live]    [Profile]  │
│   ↑      ↑      ↑       ↑            ↑       │
│  Icon  Name  Trades  Account     Avatar      │
└──────────────────────────────────────────────┘
```

#### Account Badge Variants
- **Single Account**: `🟢 Live` (icon + type)
- **Multiple Accounts**: `🟢 Main` (icon + name, truncated)
- **Grouped Accounts**: `👥 Group` (group icon)
- **All Accounts**: `👥 All` (all accounts icon)

#### Interaction
1. **Tap badge** → Bottom sheet slides up (iOS style)
2. Sheet contains full `AccountFilter` component (reused from desktop)
3. Select account → Sheet dismisses → Badge updates
4. Smooth spring animation (Apple standard)

#### Visual Hierarchy
- Badge: `px-2.5 py-1 rounded-full` (pill shape)
- Background: `bg-primary/10` with `border border-primary/30`
- Text: `text-xs font-semibold`
- Icon: Account type emoji or `Users` icon for groups

---

## Implementation Checklist

### Phase 1: Account Badge (Core)
- [ ] Add account badge component to `AppleMobileNav` top bar
- [ ] Display current account name/type/icon
- [ ] Handle long names with truncation (max 8 chars)
- [ ] Add tap handler to open bottom sheet

### Phase 2: Bottom Sheet Selector
- [ ] Create `AccountSelectorSheet` component
- [ ] Embed full `AccountFilter` component (reuse desktop logic)
- [ ] iOS-style spring animation (match profile sheet)
- [ ] Handle backdrop dismiss
- [ ] Update badge on account change

### Phase 3: Polish
- [ ] Add haptic feedback on account switch (if supported)
- [ ] Smooth badge color transition on account change
- [ ] VoiceOver labels ("Current account: Live Trading")
- [ ] Reduced motion support
- [ ] Loading state for account data

### Phase 4: Edge Cases
- [ ] Handle zero accounts (show "Add Account" badge)
- [ ] Handle archived accounts (gray badge)
- [ ] Handle grouped accounts (group icon + count)
- [ ] Handle "All Accounts" selection (show count)

---

## Alternative: Hybrid Approach

If top bar feels too crowded, we can combine **Option A + Option B**:
- **Badge in top bar**: Shows current account (read-only, no tap)
- **Full selector in profile sheet**: Tap profile → see account filter

This gives glanceability without adding another tap target.

---

## Next Steps

1. **Prototype Option A** with account badge in top bar
2. **Test with real users** (1-2 accounts vs 5+ accounts)
3. **Measure**: Time to switch accounts, discoverability
4. **Iterate**: Adjust badge size/position based on feedback

---

## Design Philosophy

> "The best interface is no interface, but when you need one, it should feel inevitable."
> — Jony Ive (probably)

Account filtering is **essential context**, not optional. It deserves primary placement, but in a way that feels natural, not forced. The badge approach respects the user's attention while providing instant access when needed.

---

**Recommendation**: Implement **Option A** (Account Badge in Top Bar) with bottom sheet selector.

This aligns with Apple's design language: **simple, glanceable, intentional**.

