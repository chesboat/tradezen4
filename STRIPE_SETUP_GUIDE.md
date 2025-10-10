# Stripe Integration Setup Guide

**Last Updated:** October 10, 2025

## 🎯 Overview

This guide walks you through setting up Stripe for TradZen's subscription system. You're currently in **Test Mode** (sandbox), which is perfect for development.

---

## 📋 Step 1: Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_...`) - Safe to use in frontend
   - **Secret key** (starts with `sk_test_...`) - ⚠️ **NEVER expose this in frontend code**

3. Copy both keys and add them to your `.env.local` file (we'll create this)

---

## 📦 Step 2: Create Products in Stripe Dashboard

### Create Basic Plan

1. Go to [Products](https://dashboard.stripe.com/test/products)
2. Click **"+ Create product"**
3. Fill in details:
   - **Name:** `TradZen Basic`
   - **Description:** `For serious traders`
   - **Pricing:**
     - Add **Monthly** price: `$19.00 USD` recurring monthly
     - Add **Annual** price: `$168.00 USD` recurring yearly
   - **Payment options:** Subscription
4. Click **Save product**
5. **Copy the Price IDs** (look like `price_xxxxx`) - you'll need these!

### Create Premium Plan

1. Click **"+ Create product"** again
2. Fill in details:
   - **Name:** `TradZen Premium`
   - **Description:** `For professional traders`
   - **Pricing:**
     - Add **Monthly** price: `$39.00 USD` recurring monthly
     - Add **Annual** price: `$348.00 USD` recurring yearly
   - **Payment options:** Subscription
3. Click **Save product**
4. **Copy the Price IDs**

### Your Price IDs should look like this:
```
Basic Monthly: price_1234567890abcdef
Basic Annual: price_0987654321fedcba
Premium Monthly: price_abcdef1234567890
Premium Annual: price_fedcba0987654321
```

---

## 🔧 Step 3: Configure Trial Period

For each price you created:

1. Click on the price
2. Enable **"Free trial"**
3. Set trial period: **7 days**
4. Save changes

This will automatically give users a 7-day trial when they subscribe!

---

## 🌐 Step 4: Set Up Customer Portal

The Customer Portal lets users manage their subscriptions (cancel, upgrade, update payment method).

1. Go to [Customer Portal Settings](https://dashboard.stripe.com/test/settings/billing/portal)
2. Click **"Activate test link"**
3. Configure settings:
   - ✅ **Cancel subscriptions** - Immediate
   - ✅ **Update subscriptions** - Allow switching between plans
   - ✅ **Update payment method** - Enable
   - ✅ **Invoice history** - Enable
4. **Customize appearance:**
   - Add your logo
   - Set brand color: `#3b82f6` (TradZen blue)
   - Set accent color: `#3b82f6`
5. Click **Save**

---

## 🔔 Step 5: Set Up Webhooks (Important!)

Webhooks tell your app when subscription events happen (payment succeeded, trial ending, subscription canceled, etc.).

### Local Development (using Stripe CLI)

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local dev server:
   ```bash
   stripe listen --forward-to http://localhost:5173/api/stripe-webhook
   ```

4. This will give you a webhook signing secret (starts with `whsec_...`) - add this to `.env.local`

### Production Webhooks (for deployment)

1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"+ Add endpoint"**
3. **Endpoint URL:** `https://your-domain.vercel.app/api/stripe-webhook`
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)

---

## 🔑 Step 6: Environment Variables

Create a `.env.local` file in your project root:

```bash
# Stripe API Keys (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Price IDs
STRIPE_BASIC_MONTHLY_PRICE_ID=price_YOUR_BASIC_MONTHLY_ID
STRIPE_BASIC_ANNUAL_PRICE_ID=price_YOUR_BASIC_ANNUAL_ID
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_YOUR_PREMIUM_MONTHLY_ID
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_YOUR_PREMIUM_ANNUAL_ID

# App URL (for redirects)
VITE_APP_URL=http://localhost:5173
```

**⚠️ Important:** 
- Add `.env.local` to `.gitignore` (never commit secrets!)
- For production, add these to your Vercel environment variables

---

## 🧪 Step 7: Test with Stripe Test Cards

Use these test card numbers in **Test Mode**:

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | ✅ Successful payment |
| `4000 0025 0000 3155` | ✅ Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | ❌ Card declined |
| `4000 0000 0000 0341` | ❌ Charge fails, but customer created |

- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

---

## 📝 Step 8: Implementation Checklist

### Backend (API Endpoints)
- [ ] `api/create-checkout-session.ts` - Creates Stripe Checkout session
- [ ] `api/create-portal-session.ts` - Creates Customer Portal session
- [ ] `api/stripe-webhook.ts` - Handles subscription events

### Frontend (Components)
- [ ] `PricingPage.tsx` - Display pricing plans
- [ ] `CheckoutButton.tsx` - Redirect to Stripe Checkout
- [ ] `ManageSubscriptionButton.tsx` - Open Customer Portal

### Database (Firestore)
- [ ] Update `users/{userId}` schema to include:
  ```typescript
  {
    subscriptionTier: 'trial' | 'basic' | 'premium',
    subscriptionStatus: 'trialing' | 'active' | 'canceled' | 'past_due',
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
    trialEndsAt: Timestamp,
    currentPeriodEnd: Timestamp,
  }
  ```

### Security (Firestore Rules)
- [ ] Users can only read/write their own subscription data
- [ ] Subscription updates only from server (via Admin SDK)

---

## 🚀 Step 9: Go Live Checklist

When you're ready to move from Test Mode to Live Mode:

1. Switch to **Live Mode** in Stripe Dashboard (toggle in top right)
2. **Re-create** products and prices in Live Mode (test data doesn't transfer)
3. Get your **Live API keys** (start with `pk_live_` and `sk_live_`)
4. Update environment variables with live keys
5. Create new webhook endpoint for production domain
6. Activate **Customer Portal** in Live Mode
7. Test with a real card (or test card in live mode)
8. Monitor [Stripe Dashboard](https://dashboard.stripe.com/dashboard) for payments

---

## 🔍 Monitoring & Analytics

### Stripe Dashboard
- [Payments](https://dashboard.stripe.com/test/payments) - All transactions
- [Subscriptions](https://dashboard.stripe.com/test/subscriptions) - Active subscriptions
- [Customers](https://dashboard.stripe.com/test/customers) - Customer list
- [Events & Logs](https://dashboard.stripe.com/test/events) - Webhook delivery status

### Key Metrics to Watch
- **MRR (Monthly Recurring Revenue)** - Shows growth
- **Churn Rate** - How many cancel each month
- **Trial → Paid Conversion** - % of trials that convert
- **Failed Payments** - Users with payment issues

---

## 🆘 Troubleshooting

### "No such customer" error
- Make sure you're creating a Stripe customer before creating subscription
- Check if `stripeCustomerId` is saved in Firestore

### Webhooks not firing
- Verify webhook endpoint URL is correct
- Check webhook signing secret matches `.env.local`
- Test locally with `stripe trigger customer.subscription.created`

### Trial not applying
- Verify trial period is set on the Price in Stripe Dashboard
- Check if user already had a trial (Stripe blocks duplicate trials by email)

### Payment fails but subscription created
- This is normal for some test cards
- In production, handle `invoice.payment_failed` webhook

---

## 📚 Resources

- [Stripe Docs - Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Docs - Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Docs - Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Stripe Docs - Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

---

## 🎉 Next Steps

After completing setup:

1. Test the full flow with a test card
2. Verify subscription data syncs to Firestore
3. Test trial period behavior
4. Test subscription upgrades/downgrades
5. Test cancellation flow
6. Add usage tracking (AI requests, storage, etc.)
7. Implement upgrade prompts in app
8. Add email notifications (trial ending, payment failed, etc.)

---

**Ready to implement?** All the code files are in place. Start with Step 1 (getting your API keys) and work through the checklist!

