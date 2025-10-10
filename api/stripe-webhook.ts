import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper to determine tier from price ID
function getTierFromPriceId(priceId: string): 'basic' | 'premium' {
  const basicMonthly = process.env.STRIPE_BASIC_MONTHLY_PRICE_ID;
  const basicAnnual = process.env.STRIPE_BASIC_ANNUAL_PRICE_ID;
  
  if (priceId === basicMonthly || priceId === basicAnnual) {
    return 'basic';
  }
  
  return 'premium';
}

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

// Helper to get raw body
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string;

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    console.log(`Received event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleTrialWillEnd(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ 
      message: 'Webhook handler failed',
      error: error.message 
    });
  }
}

// Handle successful checkout
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.firebaseUID;
  if (!userId) {
    console.error('No Firebase UID in session metadata');
    return;
  }

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;
  const tier = getTierFromPriceId(priceId);

  // Update user document in Firestore
  await db.collection('users').doc(userId).update({
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    subscriptionTier: tier,
    subscriptionStatus: subscription.status,
    trialEndsAt: subscription.trial_end 
      ? Timestamp.fromMillis(subscription.trial_end * 1000)
      : null,
    currentPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
    updatedAt: Timestamp.now(),
  });

  console.log(`✅ Checkout completed for user ${userId}: ${tier} tier`);
}

// Handle subscription updates (upgrades, downgrades, renewals)
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUID;
  if (!userId) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  const tier = getTierFromPriceId(priceId);

  await db.collection('users').doc(userId).update({
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    subscriptionTier: tier,
    subscriptionStatus: subscription.status,
    trialEndsAt: subscription.trial_end 
      ? Timestamp.fromMillis(subscription.trial_end * 1000)
      : null,
    currentPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
    updatedAt: Timestamp.now(),
  });

  console.log(`✅ Subscription updated for user ${userId}: ${tier} tier, status: ${subscription.status}`);
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUID;
  if (!userId) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  // Keep the tier until the end of the period, but mark as canceled
  await db.collection('users').doc(userId).update({
    subscriptionStatus: 'canceled',
    canceledAt: Timestamp.now(),
    currentPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
    updatedAt: Timestamp.now(),
  });

  console.log(`✅ Subscription canceled for user ${userId}`);
}

// Handle trial ending soon (send email reminder)
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUID;
  if (!userId) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  // TODO: Send email notification that trial is ending
  console.log(`⏰ Trial ending soon for user ${userId}`);
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.firebaseUID;
  
  if (!userId) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  // Update payment status
  await db.collection('users').doc(userId).update({
    subscriptionStatus: 'active',
    lastPaymentDate: Timestamp.now(),
    currentPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
    updatedAt: Timestamp.now(),
  });

  console.log(`✅ Payment succeeded for user ${userId}`);
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.firebaseUID;
  
  if (!userId) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  // Update payment status
  await db.collection('users').doc(userId).update({
    subscriptionStatus: 'past_due',
    updatedAt: Timestamp.now(),
  });

  // TODO: Send email notification about failed payment
  console.log(`❌ Payment failed for user ${userId}`);
}

