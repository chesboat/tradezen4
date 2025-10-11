# Trial-First Flow Fix (Root-Level Bootstrap Gate)

Date: 2025-10-11

## What was happening
- After signup, we wanted to show the pricing page before the dashboard.
- React StrictMode and our initialization effects caused the dashboard to mount anyway, even when we tried to redirect via `useEffect` or early-returns inside `AppContent`.
- Result: brief pricing render followed by full dashboard initialization, sometimes loops (#300/#310 errors).

## The fix (Apple-style, robust)
1. Added a root-level bootstrap gate in `src/main.tsx` that reads a session flag and mounts a minimal tree:
   - If `sessionStorage.getItem('show_pricing_after_auth') === 'true'` → mount `AuthProvider + <PricingPage />` directly.
   - Otherwise → mount `<App />` as usual.

2. Made the guard persistent in `AppWithPricingCheck` (inside `src/App.tsx`):
   - If the flag is present, render `<PricingPage />` and do NOT clear the flag there (prevents StrictMode double-mount from flipping state).
   - Normal app only mounts when the flag is absent.

3. Clear the flag only on the dedicated pages:
   - `src/components/SubscriptionSuccess.tsx` → clear on mount
   - `src/components/SubscriptionCanceled.tsx` → clear on mount

4. Set the flag at the exact moment signup begins, before creating the account:
   - `src/components/auth/SignupForm.tsx` sets `sessionStorage.setItem('show_pricing_after_auth', 'true')` before calling `signUp`/providers.

## Why this works
- The pricing page is now rendered before the app tree (and its effects) mounts, so none of the dashboard initialization hooks can run.
- StrictMode can double-mount, but because we keep the flag set during that session, the pricing page remains the only rendered surface until the user completes Stripe or cancels.

## Files changed
- `src/main.tsx` → root-level bootstrap gate for pricing
- `src/App.tsx` → `AppWithPricingCheck` persistent guard (no flag clearing here)
- `src/components/SubscriptionSuccess.tsx` → clear flag on mount
- `src/components/SubscriptionCanceled.tsx` → clear flag on mount
- `src/components/auth/SignupForm.tsx` → set flag before account creation

## Test plan
1. Log out.
2. Sign up with a fresh email.
3. Expect: Pricing page only; no dashboard logs.
4. Complete Stripe checkout → success page clears flag → next load shows dashboard.
5. Cancel checkout → cancel page clears flag → next load shows dashboard.

## Notes
- This mirrors patterns used by successful SaaS: gate onboarding at bootstrap to avoid racing in-app navigation.


