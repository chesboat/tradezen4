# Pending Fixes to Deploy

## Summary
Four critical fixes ready to deploy:

### 1. ✅ Grace Period for Post-Checkout Access
**Problem:** Users kicked back to pricing page after completing checkout  
**Fix:** Added 60-second grace period in `useSubscription.ts` and `SubscriptionSuccess.tsx`

### 2. ✅ Correct Pricing Display in Upgrade Modal  
**Problem:** Showing "$1.80" instead of "$180.00"  
**Fix:** Convert dollars to cents before passing to `WelcomeToPremiumModal`

### 3. ✅ Basic Plan Success Page Detection  
**Problem:** Basic subscribers seeing "Premium trial" messaging  
**Fix:** Store `purchased_plan_tier` in localStorage before checkout, read on success page

### 4. ✅ Trading Health "Risk Control" Shows 0 for New Users
**Problem:** Showing "80" with no trades - misleading users into thinking they have perfect risk control  
**Fix:** Changed to show "0" when no trades exist - honest and motivating

## Files Changed
- `src/hooks/useSubscription.ts` - Grace period logic
- `src/components/SubscriptionSuccess.tsx` - Grace period flag + Basic detection
- `src/components/PricingPage.tsx` - Pricing fix + store purchased tier
- `src/components/WelcomeToPremiumModal.tsx` - New modal component
- `src/lib/tradingHealth/metricsEngine.ts` - Risk Control returns 0 for no trades

## To Deploy
```bash
git add -A
git commit -m "Fix: Post-checkout access, pricing display, and Basic plan detection"
git push
```

## What Will Work After Deploy
✅ Users won't be kicked to pricing after checkout  
✅ Upgrade modal shows correct amounts ($180, $348)  
✅ Basic subscribers see correct success page (no trial messaging)  
✅ Trading Health shows 0 for new users (not misleading 80)  
✅ Smooth onboarding flow from signup → checkout → dashboard

