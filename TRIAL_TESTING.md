# Testing the Trial System

This guide shows how to test the trial countdown banner and subscription UI.

## Quick Test Setup

Since we don't have Stripe integrated yet, here's how to test different trial states:

### Method 1: Update User Profile in Firestore (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to Firestore Database
3. Find your user document in the `users` collection
4. Add/update these fields:

```json
{
  "subscriptionTier": "trial",
  "subscriptionStatus": "trialing",
  "trialStartedAt": "2024-10-01T00:00:00.000Z"
}
```

**Trial States to Test:**

```javascript
// 5 days into trial (2 days left)
trialStartedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

// 6 days into trial (1 day left - URGENT)
trialStartedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()

// Last 12 hours (shows hours countdown)
trialStartedAt: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000).toISOString()

// Fresh trial (7 days left)
trialStartedAt: new Date().toISOString()

// Expired trial
trialStartedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
```

### Method 2: Temporarily Hardcode in Component (For Quick Testing)

Add this to `src/hooks/useSubscription.ts` temporarily:

```typescript
// TEMP: For testing - remove before production
const MOCK_TRIAL_START = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000); // 1 day left

useEffect(() => {
  if (profile && !profile.trialStartedAt) {
    // Mock trial data for testing
    const mockProfile = {
      ...profile,
      trialStartedAt: MOCK_TRIAL_START,
      subscriptionTier: 'trial' as const,
      subscriptionStatus: 'trialing' as const,
    };
    // Don't actually save, just for UI testing
  }
}, [profile]);
```

---

## What You Should See

### Trial Banner (Top of App)

**Day 7-3 (Normal State):**
- Blue/primary colored banner
- "X days left in trial"
- "Enjoying Premium features? Upgrade to keep them forever"
- "Upgrade to Premium" button (blue)
- Dismissable X button

**Day 2-1 (Urgent State):**
- Orange/red gradient banner
- "Expiring Soon" badge
- "X days left in trial" or "X hours left in trial"
- "Auto-converts to Basic ($19/mo) after trial"
- "Don't lose AI Coach - Upgrade to Premium" button (orange/red)
- More prominent, urgent styling

**Last Day (<24 hours):**
- Shows hours instead of days
- Animated progress bar at bottom
- Maximum urgency state

### Settings Page

**Subscription Section:**
- Shows current plan card with icon
- Trial: Lightning bolt icon + countdown timer
- Basic: Blue lightning bolt
- Premium: Crown with gradient
- Feature grid: Accounts, AI Coach, Storage, AI Requests
- "Upgrade Now" button (trial) or "Upgrade to Premium" (basic)
- "Manage subscription" link (basic/premium only)

---

## Testing Checklist

- [ ] Banner shows for trial users
- [ ] Banner dismisses when X clicked
- [ ] Countdown updates (wait 1 minute, should refresh)
- [ ] Urgent state triggers at 2 days
- [ ] Hour countdown shows on last day
- [ ] Progress bar animates on last day
- [ ] Settings shows correct plan info
- [ ] Upgrade button opens modal
- [ ] Modal shows Basic vs Premium
- [ ] Monthly/Annual toggle works
- [ ] Savings badge shows correct %
- [ ] Current plan is disabled in modal
- [ ] Banner doesn't show for Basic/Premium users

---

## Admin Testing (Skip Trial)

If you added your email to `src/hooks/useSubscription.ts` ADMIN_EMAILS:

```typescript
const ADMIN_EMAILS = [
  'your@email.com',
];
```

You'll get **Premium** automatically and won't see trial UI. Perfect for testing Premium features!

---

## Simulating Different Tiers

Update in Firestore:

**Trial User:**
```json
{
  "subscriptionTier": "trial",
  "subscriptionStatus": "trialing",
  "trialStartedAt": "2024-10-01T00:00:00.000Z"
}
```

**Basic User:**
```json
{
  "subscriptionTier": "basic",
  "subscriptionStatus": "active",
  "subscriptionExpiresAt": "2024-11-01T00:00:00.000Z"
}
```

**Premium User:**
```json
{
  "subscriptionTier": "premium",
  "subscriptionStatus": "active",
  "subscriptionExpiresAt": "2024-11-01T00:00:00.000Z"
}
```

---

## Before Production

**Remove all test code:**
1. Remove hardcoded trial dates
2. Set `trialStartedAt` on user signup
3. Integrate Stripe for actual subscriptions
4. Implement trial expiry webhook
5. Auto-convert trial → basic after 7 days
6. Test cancellation flow

---

## Next Steps

Once Stripe is integrated:
1. Trial starts automatically on signup
2. Credit card collected upfront
3. Auto-charge on day 8
4. Webhook updates `subscriptionStatus`
5. Customer portal for managing subscription

**Ready to integrate Stripe?** See `SUBSCRIPTION_TIERS.md` for full implementation plan.

