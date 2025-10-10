# 🚀 Stripe Setup Quick Start

**Current Status:** You're in Stripe Test Mode (sandbox) - perfect for development!

---

## ✅ What's Already Done

- ✅ Stripe packages installed (`stripe`, `@stripe/stripe-js`)
- ✅ API endpoints created:
  - `api/create-checkout-session.ts` - Creates Stripe Checkout
  - `api/create-portal-session.ts` - Opens Customer Portal
  - `api/stripe-webhook.ts` - Handles subscription events
- ✅ Frontend components built:
  - `PricingPage.tsx` - Beautiful pricing display
  - `SubscriptionSuccess.tsx` - Success page after checkout
  - `SubscriptionCanceled.tsx` - Canceled checkout page
  - `ManageSubscriptionButton.tsx` - Opens Stripe Customer Portal
- ✅ Subscription hook updated to use Firestore data
- ✅ User profile store updated with subscription fields
- ✅ Firestore rules protect subscription data
- ✅ Routes added for `/pricing`, `/subscription/success`, `/subscription/canceled`

---

## 📝 Next Steps - Do These in Order

### Step 1: Get Your Stripe API Keys (5 minutes)

1. Go to **[Stripe Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)**
2. Copy these two keys:
   - **Publishable key** (`pk_test_...`)
   - **Secret key** (`sk_test_...`) - ⚠️ Keep this secret!

### Step 2: Create Products in Stripe (10 minutes)

1. Go to **[Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)**
2. Click **"+ Create product"**

**Create Basic Plan:**
- Name: `TradZen Basic`
- Description: `For serious traders`
- Add pricing:
  - Monthly: `$19.00` recurring monthly
  - Annual: `$168.00` recurring yearly
- Save and **copy both price IDs** (look like `price_xxxxx`)

**Create Premium Plan:**
- Name: `TradZen Premium`
- Description: `For professional traders`
- Add pricing:
  - Monthly: `$39.00` recurring monthly
  - Annual: `$348.00` recurring yearly
- Save and **copy both price IDs**

**Enable 7-day trial on all prices:**
- Click each price → Enable "Free trial" → Set to 7 days → Save

### Step 3: Set Up Environment Variables (5 minutes)

Create a `.env.local` file in your project root:

```bash
# Stripe API Keys (from Step 1)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Stripe Price IDs (from Step 2)
STRIPE_BASIC_MONTHLY_PRICE_ID=price_YOUR_BASIC_MONTHLY_ID
STRIPE_BASIC_ANNUAL_PRICE_ID=price_YOUR_BASIC_ANNUAL_ID
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_YOUR_PREMIUM_MONTHLY_ID
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_YOUR_PREMIUM_ANNUAL_ID

# Firebase Admin (for webhooks - get from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# App URL
VITE_APP_URL=http://localhost:5173
```

**To get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → ⚙️ Settings → Service Accounts
3. Click "Generate new private key"
4. Open the downloaded JSON file and copy:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \n)

### Step 4: Set Up Webhooks for Local Development (5 minutes)

**Install Stripe CLI:**
```bash
brew install stripe/stripe-cli/stripe
```

**Login to Stripe:**
```bash
stripe login
```

**Forward webhooks to your local server:**
```bash
stripe listen --forward-to http://localhost:5173/api/stripe-webhook
```

This will output a webhook signing secret like `whsec_...` 

**Add it to `.env.local`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### Step 5: Enable Stripe Customer Portal (5 minutes)

1. Go to **[Customer Portal Settings](https://dashboard.stripe.com/test/settings/billing/portal)**
2. Click **"Activate test link"**
3. Configure:
   - ✅ Cancel subscriptions (Immediate)
   - ✅ Update subscriptions
   - ✅ Update payment method
   - ✅ Invoice history
4. Customize appearance:
   - Upload logo
   - Brand color: `#3b82f6`
5. Click **Save**

### Step 6: Deploy to Vercel (10 minutes)

**Add environment variables to Vercel:**
1. Go to your Vercel project → Settings → Environment Variables
2. Add ALL the variables from `.env.local`
3. Redeploy your app

**Set up production webhook:**
1. Go to **[Webhooks](https://dashboard.stripe.com/test/webhooks)**
2. Click **"+ Add endpoint"**
3. Endpoint URL: `https://your-domain.vercel.app/api/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (`whsec_...`)
7. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
8. Redeploy

---

## 🧪 Testing Your Setup

### Test Card Numbers (Test Mode Only)

Use these in Stripe Checkout:

| Card Number | Result |
|------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0025 0000 3155` | ✅ Requires 3D Secure |
| `4000 0000 0000 9995` | ❌ Declined |

- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Test the Full Flow

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding:**
   ```bash
   stripe listen --forward-to http://localhost:5173/api/stripe-webhook
   ```

3. **Navigate to pricing page** in your app
4. **Click "Start Free Trial"** on Basic or Premium
5. **Use test card:** `4242 4242 4242 4242`
6. **Complete checkout**
7. **Verify:**
   - You're redirected to success page
   - Firestore `userProfiles/{userId}` updated with:
     - `subscriptionTier: 'basic'` or `'premium'`
     - `subscriptionStatus: 'trialing'`
     - `stripeCustomerId`, `stripeSubscriptionId`, etc.
   - Check Stripe Dashboard → Customers to see new customer
   - Check Stripe CLI terminal for webhook events

8. **Test Customer Portal:**
   - Go to Settings in your app
   - Click "Manage Subscription"
   - Try canceling subscription
   - Verify Firestore updates to `subscriptionStatus: 'canceled'`

---

## 🎯 How to Access Pricing Page

Add a button somewhere in your app (e.g., Settings page):

```tsx
import { useNavigationStore } from '@/store/useNavigationStore';

function SettingsPage() {
  const { setCurrentView } = useNavigationStore();
  
  return (
    <button onClick={() => setCurrentView('pricing')}>
      View Pricing Plans
    </button>
  );
}
```

Or add the `ManageSubscriptionButton` component:

```tsx
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';

function SettingsPage() {
  return (
    <div>
      <h2>Subscription</h2>
      <ManageSubscriptionButton />
    </div>
  );
}
```

---

## 🚨 Troubleshooting

### Webhooks not firing?
- Make sure `stripe listen` is running
- Check webhook secret matches `.env.local`
- Look for errors in Stripe CLI terminal

### "No such price" error?
- Verify price IDs in `.env.local` match Stripe Dashboard
- Make sure you're using Test Mode price IDs (start with `price_test_`)

### Checkout redirects but subscription not created?
- Check browser console for errors
- Check Stripe CLI terminal for webhook events
- Verify Firebase Admin credentials in `.env.local`

### Can't open Customer Portal?
- Make sure Customer Portal is activated in Stripe Dashboard
- Verify user has `stripeCustomerId` in Firestore

---

## 📚 Helpful Links

- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Full Setup Guide](./STRIPE_SETUP_GUIDE.md) - More detailed documentation

---

## 🎉 When You're Ready to Go Live

1. Switch to **Live Mode** in Stripe Dashboard (toggle in top right)
2. **Re-create products** in Live Mode (test data doesn't transfer)
3. Get your **Live API keys** (`pk_live_...`, `sk_live_...`)
4. Update Vercel environment variables with live keys
5. Create new webhook endpoint for production domain
6. Activate Customer Portal in Live Mode
7. **Test with a real card** (you can refund yourself later)
8. 🚀 **Launch!**

---

**Need help?** Check `STRIPE_SETUP_GUIDE.md` for more details or reach out!

