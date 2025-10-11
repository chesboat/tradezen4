# 🍎 Apple-Style Subscription Access Control

## The Apple Philosophy

**Tim Cook:** *"If they cancel, they paid for the month—they keep access until it ends. That's fair."*

**Jon Ive:** *"But once it truly expires? Lock it down. Show them what they're missing, make reactivating seamless."*

**Craig Federighi:** *"We need clear states: active, canceled-but-active, expired, past_due. Each handled differently."*

---

## Subscription States & Access

### 1. **`active`** ✅
- **Status:** Subscription is active
- **Access:** Full access to all features
- **UI:** Normal app experience

### 2. **`trialing`** ✅
- **Status:** In free trial period
- **Access:** Full access to all features
- **UI:** Trial countdown banner (optional)

### 3. **`canceled`** ⚠️
- **Status:** User canceled, but period hasn't ended yet
- **Access:** **STILL HAS FULL ACCESS** until `currentPeriodEnd`
- **UI:** Settings shows "Subscription canceled" with end date
- **Reason:** They paid for the month, they deserve the month

### 4. **`expired`** ⛔
- **Status:** `canceled` + `currentPeriodEnd` < now
- **Access:** **NO ACCESS** - App locked
- **UI:** Expired subscription modal shown
- **Data:** Kept for 30 days, then deleted

### 5. **`past_due`** ⚠️
- **Status:** Payment failed
- **Access:** Grace period of 7 days after `currentPeriodEnd`
- **UI:** Warning banner, limited features
- **Reason:** Give them time to update payment

### 6. **`incomplete` / `incomplete_expired` / `unpaid`** ⛔
- **Status:** Signup never completed or payment never went through
- **Access:** **NO ACCESS**
- **UI:** Treat as trial

---

## Implementation

### 1. `useSubscription.ts`

#### New Function: `hasActiveAccess()`
```typescript
function hasActiveAccess(profile: any): boolean {
  if (!profile?.subscriptionStatus) return false;
  
  const status = profile.subscriptionStatus;
  
  // Active and trialing = full access
  if (['active', 'trialing'].includes(status)) {
    return true;
  }
  
  // Canceled but still within paid period = full access
  if (status === 'canceled' && profile.currentPeriodEnd) {
    const periodEnd = profile.currentPeriodEnd.toDate();
    return periodEnd > new Date(); // Still in paid period
  }
  
  // Past due gets a 7-day grace period
  if (status === 'past_due' && profile.currentPeriodEnd) {
    const periodEnd = profile.currentPeriodEnd.toDate();
    const graceEndDate = new Date(periodEnd.getTime() + (7 * 24 * 60 * 60 * 1000));
    return graceEndDate > new Date();
  }
  
  // All other statuses = no access
  return false;
}
```

#### New Return Values:
```typescript
return {
  tier,                  // 'trial' | 'basic' | 'premium'
  hasAccess,            // 🆕 Boolean: Can they use the app?
  hasFeatureAccess,     // Function: Check specific features
  isExpired,            // 🆕 Boolean: Is subscription truly expired?
  isPremium,
  isBasic,
  isTrial,
  ...
};
```

### 2. `App.tsx`

#### Expired Subscription Check:
```typescript
const { tier, hasAccess, isExpired } = useSubscription();
const [showExpiredModal, setShowExpiredModal] = React.useState(false);

React.useEffect(() => {
  if (!loading && currentUser && !hasAccess && isExpired) {
    console.log('⛔ Subscription expired - showing paywall');
    setShowExpiredModal(true);
  } else if (hasAccess) {
    setShowExpiredModal(false);
  }
}, [loading, currentUser, hasAccess, isExpired]);
```

### 3. `ExpiredSubscriptionModal.tsx`

#### Apple-Style Expired Modal:
- **Warning Icon** - Orange triangle (urgent, not angry)
- **Clear Message** - "Subscription Expired"
- **Data Retention** - "Your data is safe for 30 days"
- **What's Missing** - Show list of features they've lost
- **Primary CTA** - "Reactivate Subscription" (blue, prominent)
- **Secondary CTA** - "Log Out" (gray, subtle)
- **No close button blocking** - User can dismiss modal (trust)

---

## User Experience Flows

### Flow 1: User Cancels Subscription
1. User clicks **"Manage Subscription"** in Settings
2. Stripe Portal opens
3. User clicks **"Cancel plan"**
4. Stripe webhook updates Firestore: `subscriptionStatus: 'canceled'`
5. User returns to app
6. **Access continues** - They can still use the app
7. Settings shows: "Subscription canceled - Access until [date]"
8. When date passes → `isExpired: true` → Modal shows

### Flow 2: Subscription Expires
1. `currentPeriodEnd` date passes
2. `hasActiveAccess()` returns `false`
3. `isExpired` becomes `true`
4. **ExpiredSubscriptionModal** shows on app load
5. User sees:
   - "Subscription Expired"
   - "Data safe for 30 days"
   - List of lost features
6. Options:
   - **Reactivate** → Pricing page → Stripe → Back to app
   - **Log Out** → Returns to marketing site

### Flow 3: Payment Fails (Past Due)
1. Stripe can't charge card
2. Webhook updates: `subscriptionStatus: 'past_due'`
3. User still has access for **7 days** (grace period)
4. Warning banner shows: "Update payment method"
5. If they update → `status: 'active'` → Access continues
6. If 7 days pass → `status: 'past_due' + expired` → Modal shows

### Flow 4: User Reactivates After Expiration
1. User clicks **"Reactivate Subscription"** in modal
2. Redirected to **Pricing Page**
3. Selects plan → Stripe Checkout
4. Payment succeeds
5. Webhook updates: `subscriptionStatus: 'active'`
6. `hasAccess` becomes `true`
7. Modal closes, **full access restored**
8. **All data is still there** (within 30-day window)

---

## Why This Approach?

### Before:
- ❌ Canceled users lost access immediately (unfair)
- ❌ No distinction between "canceled" and "expired"
- ❌ No grace period for payment failures
- ❌ Harsh UX (access cut off mid-session)

### After (Apple Way):
- ✅ **Fair:** Canceled users keep access until period ends
- ✅ **Clear:** Four distinct states, each handled properly
- ✅ **Graceful:** Grace period for payment failures
- ✅ **Transparent:** Modal explains exactly what's happening
- ✅ **Recoverable:** Easy reactivation path
- ✅ **Safe:** Data kept for 30 days (gives them time)

---

## Data Retention Policy

### 30-Day Window:
```
Day 0: Subscription expires
Day 1-30: Data is safe, can reactivate anytime
Day 30: Data is permanently deleted
```

### Why 30 Days?
- **Industry standard** (Stripe, Apple, Google all do this)
- **Reasonable window** for users to change their mind
- **Storage optimization** (don't keep data forever)
- **Privacy compliance** (delete data when user leaves)

### What Gets Deleted:
- All trades
- All journal entries
- All notes
- All habits/quests
- All analytics
- User profile (except email for reactivation)

### What Stays:
- Email address (for re-signup)
- Subscription history (for billing)
- Login credentials (Firebase Auth)

---

## Settings Page Integration

### Canceled Subscription Display:
```tsx
{profile?.subscriptionStatus === 'canceled' && (
  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
    <h4>Subscription canceled</h4>
    <p>
      You'll have access until {formatDate(profile?.currentPeriodEnd)}. 
      Reactivate anytime.
    </p>
  </div>
)}
```

### Status Colors:
- **Active** → Green (`text-green-500`)
- **Trialing** → Blue (`text-blue-500`)
- **Canceled** → Orange (`text-orange-500`)
- **Past Due** → Red (`text-red-500`)
- **Expired** → Red (`text-red-500`)

---

## Webhook Events

### Stripe Events We Handle:

1. **`customer.subscription.created`**
   - Sets `subscriptionStatus: 'trialing'` or `'active'`
   - Sets `currentPeriodEnd`

2. **`customer.subscription.updated`**
   - Updates `subscriptionStatus` (e.g., `trialing` → `active`)
   - Updates `currentPeriodEnd`

3. **`customer.subscription.deleted`**
   - Sets `subscriptionStatus: 'canceled'`
   - Keeps `currentPeriodEnd` (they still have access until then)
   - Sets `canceledAt: now()`

4. **`invoice.payment_failed`**
   - Sets `subscriptionStatus: 'past_due'`
   - User enters grace period

5. **`invoice.payment_succeeded`**
   - Sets `subscriptionStatus: 'active'`
   - Updates `currentPeriodEnd`

---

## Testing Checklist

### Canceled But Active:
- [ ] Cancel subscription in Stripe Portal
- [ ] Return to app - access still works
- [ ] Settings shows "Canceled - Access until [date]"
- [ ] Can still create trades, journal entries
- [ ] Modal does NOT show yet

### Truly Expired:
- [ ] Wait for `currentPeriodEnd` to pass (or mock it)
- [ ] Refresh app
- [ ] **ExpiredSubscriptionModal** shows immediately
- [ ] Cannot access any features (dashboard blocked)
- [ ] "Reactivate" button works
- [ ] "Log Out" button works

### Reactivation:
- [ ] Click "Reactivate Subscription"
- [ ] Redirected to pricing page
- [ ] Select plan, complete Stripe checkout
- [ ] Return to app
- [ ] Modal closes automatically
- [ ] Full access restored
- [ ] All data still intact

### Past Due Grace Period:
- [ ] Mock `past_due` status
- [ ] Check `currentPeriodEnd + 7 days` still gives access
- [ ] After 7 days, access revoked
- [ ] Modal shows

---

## Console Logging

For debugging, we log:

```typescript
console.log('🔒 Canceled subscription access check:', {
  periodEnd: periodEnd.toISOString(),
  now: now.toISOString(),
  hasAccess: periodEnd > now
});

console.log('🔐 Subscription access updated:', {
  tier: 'basic',
  hasAccess: true,
  status: 'canceled'
});

console.log('⛔ Subscription expired - showing paywall');
```

---

## Edge Cases

### Edge Case 1: Clock Skew
**Problem:** User's local clock is wrong  
**Solution:** Always use Firestore Timestamps (server time)

### Edge Case 2: Webhook Delay
**Problem:** User cancels, but webhook hasn't fired yet  
**Solution:** Portal shows "Canceling..." until webhook confirms

### Edge Case 3: Reactivation During Grace Period
**Problem:** User reactivates while `past_due`  
**Solution:** Stripe automatically updates to `active`, access continues

### Edge Case 4: Multiple Tabs Open
**Problem:** User has access in one tab, expired in another  
**Solution:** Firestore real-time listener updates all tabs

---

*Last updated: October 11, 2025*  
*Built with Apple's fairness and clarity principles*  
*"They paid for it, they keep it" - Tim Cook*


