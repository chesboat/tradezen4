import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, newPriceId } = req.body;

    if (!userId || !newPriceId) {
      return res.status(400).json({ message: 'Missing userId or newPriceId' });
    }

    console.log('🔄 Upgrade request:', { userId, newPriceId });

    // Get user's current subscription from Firestore
    const profileRef = db.collection('userProfiles').doc(userId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      console.error('❌ User profile not found:', userId);
      return res.status(404).json({ message: 'User profile not found' });
    }

    const profileData = profileDoc.data();
    const subscriptionId = profileData?.stripeSubscriptionId;
    const currentPriceId = profileData?.stripePriceId;
    const stripeCustomerId = profileData?.stripeCustomerId;
    const currentTier = profileData?.subscriptionTier;

    console.log('👤 User profile found:', {
      userId,
      email: profileData?.email,
      currentTier,
      subscriptionId,
      currentPriceId,
      stripeCustomerId,
    });

    if (!subscriptionId) {
      console.error('❌ No subscription ID in profile');
      return res.status(400).json({ 
        message: 'No active subscription found. Please start a new subscription instead.' 
      });
    }

    // Prevent downgrading or same-tier changes (for now)
    if (currentPriceId === newPriceId) {
      return res.status(400).json({ 
        message: 'You are already on this plan.' 
      });
    }

    console.log('📋 Current subscription:', { subscriptionId, currentPriceId });

    // Fetch the current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription.items.data[0]) {
      return res.status(400).json({ message: 'Invalid subscription structure' });
    }

    const subscriptionItemId = subscription.items.data[0].id;

    console.log('⬆️ Upgrading subscription...');

    // 🍎 APPLE WAY: Update subscription with correct anchor depending on status
    // When switching from trialing → active, Stripe requires billing_cycle_anchor='now'
    // Otherwise (active → active) we can keep the anchor unchanged
    const isTrialing = subscription.status === 'trialing';

    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice', // Create invoice immediately (shows proration/credit)
      cancel_at_period_end: false,
    };

    if (isTrialing) {
      // End trial immediately and start new billing cycle now
      updateParams.trial_end = 'now';
      updateParams.billing_cycle_anchor = 'now';
    } else {
      // Keep existing billing anniversary
      updateParams.billing_cycle_anchor = 'unchanged';
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, updateParams);

    console.log('✅ Subscription upgraded:', {
      subscriptionId: updatedSubscription.id,
      newPriceId,
      status: updatedSubscription.status,
    });

    // Note: The webhook will handle updating Firestore with new tier
    // We just return success here

    return res.status(200).json({ 
      success: true,
      message: 'Subscription upgraded successfully',
      subscriptionId: updatedSubscription.id,
    });
  } catch (error: any) {
    console.error('❌ Error upgrading subscription:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        message: error.message || 'Invalid upgrade request',
      });
    }

    return res.status(500).json({ 
      message: 'Failed to upgrade subscription',
      error: error.message,
    });
  }
}

