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
    const { priceId, userId } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ message: 'Missing priceId or userId' });
    }

    // Get user email from Firebase Auth or Firestore
    let userEmail: string | undefined;
    
    // Try to get from userProfiles first
    const profileRef = db.collection('userProfiles').doc(userId);
    const profileDoc = await profileRef.get();
    
    if (profileDoc.exists) {
      userEmail = profileDoc.data()?.email;
    }
    
    // If not found, try users collection
    if (!userEmail) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        userEmail = userDoc.data()?.email;
      }
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'User email not found. Please ensure your profile is set up.' });
    }

    // Check if user already has a Stripe customer ID
    let customerId = profileDoc.exists ? profileDoc.data()?.stripeCustomerId : undefined;

    // If no customer ID, create a new customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUID: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to Firestore (in userProfiles)
      await profileRef.set({
        stripeCustomerId: customerId,
      }, { merge: true });
    }

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscription/canceled`,
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          firebaseUID: userId,
        },
      },
      metadata: {
        firebaseUID: userId,
      },
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto',
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

