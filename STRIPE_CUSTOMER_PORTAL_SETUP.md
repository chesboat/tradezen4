# 🍎 Stripe Customer Portal Setup Guide

## What is the Customer Portal?

The Stripe Customer Portal is a **secure, hosted page** where your users can:
- ✅ Update payment methods (credit cards)
- ✅ View billing history & invoices
- ✅ Upgrade/downgrade subscriptions
- ✅ Cancel subscriptions
- ✅ Download receipts

**Apple uses this same feature** for managing subscriptions on the web. It's trusted, secure, and PCI-compliant.

---

## Test Mode vs Live Mode

### ⚠️ Important: You Have TWO Separate Portals

Stripe has **two completely separate environments**:

| Mode | Purpose | Configuration |
|------|---------|---------------|
| **Test Mode** 🧪 | Development & testing | Configure separately |
| **Live Mode** 🚀 | Real customers & money | Configure separately |

**Right now you're in TEST MODE** (sandbox). This is the correct place to be during development!

### How to Tell Which Mode You're In:

1. Look at the **top-left** of Stripe Dashboard
2. You'll see a toggle: **"Test mode"** or **"Live mode"**
3. **Orange banner** = Test mode ✅ (safe!)
4. **No banner** = Live mode ⚠️ (real money!)

---

## Step-by-Step Setup (Test Mode)

### Step 1: Access Customer Portal Settings

1. **Go to:** https://dashboard.stripe.com/test/settings/billing/portal
2. **Ensure** you see "Test mode" toggle is ON (orange)

### Step 2: Activate the Portal

Click the blue **"Activate link"** or **"Activate Customer Portal"** button.

### Step 3: Configure Settings (Apple Way)

#### **Business Information**
- ✅ Add your business name: `Refine` or `TradZen`
- ✅ Add support email (yours for testing)
- ✅ Privacy policy URL (optional for test mode)
- ✅ Terms of service URL (optional for test mode)

#### **Functionality** (Enable these for best UX)

**Customer Information:**
- ✅ Allow customers to update email address

**Payment Methods:**
- ✅ Allow customers to update their payment methods
- ✅ Allow customers to delete payment methods (if they have multiple)

**Subscriptions:**
- ✅ Allow customers to switch plans (upgrade/downgrade)
- ✅ Allow customers to cancel subscriptions
  - **Cancellation behavior:** 
    - Select: **"Cancel at period end"** ✅ (Apple's way - they paid for it, they keep it)
    - OR: **"Cancel immediately"** (if you prefer instant cancellation)

**Invoice History:**
- ✅ Allow customers to view their invoice history

### Step 4: Save Configuration

Click **"Save changes"** at the bottom.

---

## What You Just Enabled

### For Users:
```
User clicks "Manage Subscription"
  ↓
Opens Stripe-hosted portal
  ↓
Can update card, cancel, upgrade, etc.
  ↓
Returns to your app (Settings page)
```

### For You:
- ✅ No PCI compliance burden (Stripe handles it)
- ✅ No custom billing UI needed
- ✅ Automatic invoice generation
- ✅ Secure payment processing
- ✅ Webhooks fire automatically (your app stays in sync)

---

## Testing the Portal

### Test Users You Can Use:

**Test Credit Cards (from Stripe):**
```
✅ Success: 4242 4242 4242 4242
⚠️ Decline: 4000 0000 0000 0002
⏰ Requires authentication: 4000 0025 0000 3155
```

**Expiry:** Any future date (e.g., `12/34`)  
**CVC:** Any 3 digits (e.g., `123`)  
**ZIP:** Any 5 digits (e.g., `90210`)

### Test Flow:

1. **Sign up** for an account in your app
2. **Choose a plan** (Basic or Premium)
3. **Use test card:** `4242 4242 4242 4242`
4. **Complete checkout** → You'll get redirected back
5. **Go to Settings** → You should now see **"Manage Subscription"**
6. **Click it** → Stripe Customer Portal opens
7. **Try actions:**
   - Update card
   - View invoices
   - Cancel subscription
   - Upgrade/downgrade

---

## Before Going Live

When you're ready to accept **real payments**, you'll need to:

### Step 1: Switch to Live Mode
1. Toggle **"Test mode"** to OFF in Stripe Dashboard
2. You're now in **Live Mode** (real money!)

### Step 2: Configure Live Mode Portal
Repeat the exact same setup at:
```
https://dashboard.stripe.com/settings/billing/portal
```
(Note: No `/test/` in the URL)

### Step 3: Update Your App's Environment Variables
- Replace test API keys with live API keys
- Update in Vercel environment variables
- Redeploy

### Step 4: Verify Everything Works
- Test with a **real card** (yours)
- Cancel immediately to avoid charges
- Check webhooks are firing

---

## Troubleshooting

### Error: "No configuration provided"
**Cause:** Portal not activated  
**Fix:** Follow Step 2 above (Activate the Portal)

### Error: "Customer does not have a subscription"
**Cause:** User hasn't completed checkout yet  
**Fix:** This is now prevented by our UI (button hidden if no `stripeCustomerId`)

### Portal Opens But Shows Error
**Cause:** Stripe keys mismatch (test vs live)  
**Fix:** Ensure both frontend and backend use same mode (test or live)

### Webhooks Not Firing
**Cause:** Webhook endpoint not configured  
**Fix:** Check `STRIPE_WEBHOOK_SECRET` is set in Vercel

---

## Security Notes

### ✅ What Stripe Handles:
- Credit card storage (PCI compliant)
- Payment processing
- Fraud detection
- 3D Secure authentication
- Invoice generation

### ✅ What You Handle:
- User authentication (Firebase)
- Subscription status (Firestore)
- Feature access control
- Business logic

---

## Apple's Customer Portal Philosophy

**Tim Cook:** *"If someone wants to cancel, make it easy. That's how you build trust."*

**Design Team:** *"One click to manage everything. No phone calls, no support tickets, no friction."*

The Stripe Customer Portal embodies this:
- ✅ **Transparent** - See exactly what you're paying
- ✅ **Easy** - One click to any action
- ✅ **Trustworthy** - Secure, hosted by Stripe
- ✅ **Fair** - Clear cancellation, prorated billing

---

## Quick Reference

### Test Mode URLs:
```
Dashboard:       https://dashboard.stripe.com/test/dashboard
Portal Settings: https://dashboard.stripe.com/test/settings/billing/portal
Webhooks:        https://dashboard.stripe.com/test/webhooks
API Keys:        https://dashboard.stripe.com/test/apikeys
```

### Live Mode URLs:
```
Dashboard:       https://dashboard.stripe.com/dashboard
Portal Settings: https://dashboard.stripe.com/settings/billing/portal
Webhooks:        https://dashboard.stripe.com/webhooks
API Keys:        https://dashboard.stripe.com/apikeys
```

### Environment Variables:
```bash
# Test Mode (current)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Live Mode (when ready)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

---

## What's Next?

1. ✅ **Configure test portal** (follow steps above)
2. ✅ **Test the flow** (signup → checkout → manage)
3. ✅ **Test cancellation** (ensure it works correctly)
4. ✅ **Test webhooks** (watch Vercel logs)
5. ⏳ **When ready:** Switch to live mode

---

*Last updated: October 11, 2025*  
*Built with Apple's transparency and trust principles*  
*"Make it easy to cancel. That's integrity." - Tim Cook*

