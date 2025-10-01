# XP Race Condition Bug Fix

**Date:** October 1, 2025  
**Severity:** 🔴 Critical  
**Status:** ✅ Fixed

## 🐛 The Bug

User's Season XP would randomly reset to 4,411 after performing certain actions (specifically adding quick notes, but could happen with any action that triggered profile sync).

### Symptoms
- XP would increase correctly when earning XP
- Then suddenly snap back to 4,411 
- Happened after adding quick notes from journal
- Appeared intermittent but was actually predictable

---

## 🔍 Root Cause Analysis

### The Architecture
TradZen4 has a dual-location XP storage system:

1. **Legacy Location**: `userProfiles/{userId}` document has an embedded `xp` field
2. **Current Location**: `userProfiles/{userId}/xp/status` subcollection document (SSOT)

### The Problem
There were **TWO real-time subscriptions** running simultaneously:

#### Subscription 1: Profile Subscription
- **Path**: `userProfiles/{userId}`
- **Purpose**: Listen to profile changes (displayName, preferences, stats)
- **Bug**: Also reading and overwriting XP from the `xp` field in this document
- **Data**: Had stale XP value (4,411)

```typescript
// OLD CODE (BUGGY)
const unsubProfile = onSnapshot(profileDocRef, (snap) => {
  const data = snap.data();
  const rawXp: any = (data as any).xp || {};
  const seasonXp = Number(rawXp.seasonXp || 0);  // ❌ Reading stale XP!
  
  const nextProfile: UserProfile = {
    ...data,
    xp: {
      seasonXp: seasonXp,  // ❌ Overwriting with stale value!
      // ...
    }
  };
  set({ profile: nextProfile });
});
```

#### Subscription 2: XP Subscription
- **Path**: `userProfiles/{userId}/xp/status`
- **Purpose**: Listen to XP changes (the CORRECT source of truth)
- **Data**: Has current, up-to-date XP

```typescript
// This subscription is correct
const unsub = XpService.subscribe(({ total, seasonXp, level, prestige }) => {
  // Updates profile with current XP
  set({ profile: { ...current, xp: { seasonXp, ... } } });
});
```

### The Race Condition

**Timeline of events:**

1. ✅ **User earns XP** (e.g., completes reflection)
   - `XpService.addXp()` writes to `/xp/status`
   - XP Subscription fires → Updates local state
   - **Season XP: 4,411 → 4,481** ✅

2. ✅ **User adds quick note**
   - Quick note saved to Firestore
   - `addActivity()` called
   - `refreshStats()` triggered

3. ❌ **refreshStats() triggers syncToFirestore()**
   - Writes `stats` field to parent profile document
   - Parent document at `userProfiles/{userId}` gets updated
   - Profile subscription fires (because doc changed)
   - Profile subscription reads stale `xp` field (still 4,411)
   - **Profile subscription OVERWRITES Season XP: 4,481 → 4,411** ❌

4. ❌ **User sees XP reset back to 4,411**

### Why 4,411 Specifically?

4,411 was the XP value that was last written to the **parent profile document's** `xp` field. The parent document wasn't being updated with new XP values because:
- New XP system writes to `/xp/status` subcollection only
- Parent document's `xp` field became stale/frozen
- But profile subscription kept reading it and overwriting local state

---

## ✅ The Fix

### Strategy
The profile subscription should **never** read or update XP. XP is managed exclusively by the dedicated XP subscription to `/xp/status`.

### Implementation

```typescript
// NEW CODE (FIXED)
const unsubProfile = onSnapshot(profileDocRef, (snap) => {
  const data = snap.data();
  if (!data) return;
  
  const current = get().profile;
  
  // ✅ Preserve existing XP from state - do NOT overwrite
  // XP is managed exclusively by the xp/status subscription
  const nextProfile: UserProfile = {
    ...data,
    xp: current?.xp || {  // ✅ Use current XP from state!
      total: 0,
      seasonXp: 0,
      level: 1,
      prestige: 0,
      canPrestige: false,
      history: [],
    },
  };
  
  set({ profile: nextProfile });
  
  console.log('📡 Profile subscription update (XP preserved):', {
    preservedXp: nextProfile.xp.seasonXp
  });
});
```

### Key Changes
1. **Read current XP from state** instead of from Firestore document
2. **Preserve XP** when profile subscription updates other fields
3. **Added logging** to track when profile updates happen
4. **Added comment** explaining why XP must not be read from this doc

---

## 🧪 Testing

### Test Case 1: Basic XP Gain
1. Earn XP (complete reflection, trade, habit, etc.)
2. Verify XP increases
3. ✅ **Expected**: XP increases and stays increased

### Test Case 2: Quick Note After XP Gain
1. Earn XP (e.g., +75 XP from reflection)
2. Note current XP value
3. Add a quick note from journal
4. Check XP value
5. ✅ **Expected**: XP remains the same (doesn't reset)

### Test Case 3: Multiple Activities
1. Earn XP from multiple sources rapidly
2. Add quick notes between XP gains
3. Check XP after each action
4. ✅ **Expected**: XP only increases, never decreases

### Console Verification
Look for these logs:
```
✨ XP awarded: { delta: 75, newSeasonXp: 4486, level: X }
📊 XP update received: { seasonXp: 4486, ... }
📡 Profile subscription update (XP preserved): { preservedXp: 4486 }
```

The key is that `preservedXp` should match the `newSeasonXp` from the XP award.

---

## 🔄 Data Migration

### What About The Stale xp Field?

The parent profile document at `userProfiles/{userId}` still has a stale `xp` field. This is **intentional** and **safe** because:

1. ✅ We never read from it anymore
2. ✅ We never write to it anymore (syncToFirestore excludes it)
3. ✅ It's effectively deprecated/ignored
4. ✅ The real XP is in `/xp/status` subcollection

### Should We Clean It Up?

**No action required.** The stale field doesn't cause issues now that we're not reading it. Optionally, you could:

1. **Leave it** (recommended) - No harm, useful for debugging
2. **Delete it** - Run a one-time migration to remove `xp` field from all profile docs
3. **Keep it synced** - Make XP subscription write back to parent doc (adds complexity)

**Recommendation**: Leave it as-is. It's a harmless relic and might be useful for debugging or migration rollback.

---

## 🏗️ Architecture Improvements

### Current State (Post-Fix)
```
userProfiles/{userId}
├── displayName ✅ (Profile subscription reads/writes)
├── preferences ✅ (Profile subscription reads/writes)
├── stats ✅ (Profile subscription reads/writes)
└── xp 🗑️ (IGNORED - stale, not used)

userProfiles/{userId}/xp/status
├── total ✅ (XP subscription reads, XpService writes)
├── seasonXp ✅ (XP subscription reads, XpService writes)
├── level ✅ (XP subscription reads, XpService writes)
└── prestige ✅ (XP subscription reads, XpService writes)
```

### Subscription Responsibilities

| Subscription | Reads | Writes | Purpose |
|---|---|---|---|
| **Profile** | displayName, preferences, stats | (via syncToFirestore) | User settings & stats |
| **XP** | total, seasonXp, level, prestige | (via XpService.addXp) | XP & progression |

**No overlap** = No conflicts ✅

---

## 📊 Impact Assessment

### What Was Affected
- ❌ Quick notes (any activity that calls `refreshStats()`)
- ❌ Potentially other actions that trigger profile sync
- ❌ User's XP would appear to reset unpredictably

### What Works Now
- ✅ All XP-earning activities
- ✅ Quick notes no longer reset XP
- ✅ Profile updates (stats, preferences) don't affect XP
- ✅ XP subscription is the sole authority on XP values

### Performance
- **No performance change** - Same number of subscriptions
- **Better reliability** - Eliminated race condition
- **Clearer separation** - Each subscription has distinct responsibility

---

## 🚨 Prevention

### Code Review Checklist
When modifying profile or XP code, check:

- [ ] Does this code read XP from the profile document?
- [ ] Does this code write XP to the profile document?
- [ ] Should this use the XP subscription instead?
- [ ] Are we preserving XP state during profile updates?

### Testing Checklist
When testing XP features:

- [ ] Earn XP, then immediately do another action
- [ ] Add quick note after earning XP
- [ ] Complete multiple XP activities rapidly
- [ ] Check console logs for "XP preserved" messages
- [ ] Verify XP never decreases unexpectedly

---

## 📝 Related Files

### Files Modified
- `src/store/useUserProfileStore.ts` - Fixed profile subscription

### Files Examined (No Changes Needed)
- `src/store/useQuickNoteStore.ts` - Not the cause
- `src/store/useActivityLogStore.ts` - Correctly calls refreshStats
- `src/lib/xp/XpService.ts` - Working correctly
- `src/components/QuickNoteModal.tsx` - Working correctly

---

## 🎓 Lessons Learned

### 1. **Single Source of Truth**
Having XP in two places (parent doc + subcollection) created confusion. The fix clarifies that `/xp/status` is the SSOT.

### 2. **Subscription Isolation**
Multiple subscriptions to related data can cause race conditions. Each subscription should have exclusive ownership of its data.

### 3. **Defensive State Updates**
When updating state from external sources (Firestore), preserve unrelated fields from current state rather than overwriting everything.

### 4. **Logging Is Critical**
The comprehensive logging added in the XP audit made this bug much easier to diagnose.

---

## ✅ Resolution

**Status**: Fixed and tested  
**Risk**: Eliminated  
**Action Required**: None - users will see fix on next app load

**The XP system is now stable and reliable!** 🎉

