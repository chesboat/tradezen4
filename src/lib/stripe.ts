// Stripe configuration and utilities
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe.js with publishable key
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
      return null;
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Stripe Price IDs mapped to our internal tier system
export const STRIPE_PRICE_IDS = {
  basic: {
    monthly: import.meta.env.VITE_STRIPE_BASIC_MONTHLY_PRICE_ID,
    annual: import.meta.env.VITE_STRIPE_BASIC_ANNUAL_PRICE_ID,
  },
  premium: {
    monthly: import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    annual: import.meta.env.VITE_STRIPE_PREMIUM_ANNUAL_PRICE_ID,
  },
} as const;

// Helper to get price ID from tier and billing period
export function getPriceId(tier: 'basic' | 'premium', billingPeriod: 'monthly' | 'annual'): string {
  const priceId = STRIPE_PRICE_IDS[tier][billingPeriod];
  console.log('Getting price ID:', { tier, billingPeriod, priceId, allPriceIds: STRIPE_PRICE_IDS });
  return priceId;
}

// Redirect to Stripe Checkout
export async function redirectToCheckout(priceId: string, userId: string) {
  try {
    // Call your backend to create a checkout session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { url } = await response.json();

    // Redirect to Stripe Checkout URL
    window.location.href = url;
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}

// 🍎 APPLE WAY: Upgrade existing subscription with proration
export async function upgradeSubscription(userId: string, newPriceId: string) {
  try {
    console.log('⬆️ Upgrading subscription:', { userId, newPriceId });

    // Call backend to upgrade subscription
    const response = await fetch('/api/upgrade-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        newPriceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Upgrade API error:', {
        status: response.status,
        error,
        userId,
        newPriceId
      });
      throw new Error(error.message || 'Failed to upgrade subscription');
    }

    const result = await response.json();
    console.log('✅ Upgrade successful:', result);
    
    return result;
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw error;
  }
}

// Redirect to Stripe Customer Portal
export async function redirectToCustomerPortal(userId: string) {
  try {
    // Call your backend to create a portal session
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Portal API error:', {
        status: response.status,
        error,
        userId
      });
      throw new Error(error.message || 'Failed to create portal session');
    }

    const { url } = await response.json();

    // Redirect to Stripe Customer Portal
    window.location.href = url;
  } catch (error) {
    console.error('Error redirecting to customer portal:', error);
    throw error;
  }
}

