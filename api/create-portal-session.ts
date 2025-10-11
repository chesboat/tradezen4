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
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }

    // Get user data from Firestore (check userProfiles first, then users)
    let customerId: string | undefined;
    
    // Check userProfiles collection first
    const userProfileRef = db.collection('userProfiles').doc(userId);
    const userProfileDoc = await userProfileRef.get();
    
    if (userProfileDoc.exists) {
      customerId = userProfileDoc.data()?.stripeCustomerId;
    }
    
    // Fallback to users collection if not found
    if (!customerId) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        customerId = userDoc.data()?.stripeCustomerId;
      }
    }

    if (!customerId) {
      return res.status(400).json({ 
        message: 'No subscription found. Please start your free trial first.' 
      });
    }

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    // Create Customer Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/?view=settings`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

