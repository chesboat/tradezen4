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
    
    console.log('🔍 Looking up customer for userId:', userId);
    
    // Check userProfiles collection first
    const userProfileRef = db.collection('userProfiles').doc(userId);
    const userProfileDoc = await userProfileRef.get();
    
    if (userProfileDoc.exists) {
      const data = userProfileDoc.data();
      customerId = data?.stripeCustomerId;
      console.log('✅ Found userProfile:', { 
        hasCustomerId: !!customerId, 
        subscriptionTier: data?.subscriptionTier,
        subscriptionStatus: data?.subscriptionStatus 
      });
    } else {
      console.log('⚠️ No userProfile found');
    }
    
    // Fallback to users collection if not found
    if (!customerId) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        customerId = userDoc.data()?.stripeCustomerId;
        console.log('✅ Found customer ID in users collection:', !!customerId);
      } else {
        console.log('⚠️ No user doc found in users collection');
      }
    }

    if (!customerId) {
      console.error('❌ No Stripe customer ID found for user:', userId);
      return res.status(400).json({ 
        message: 'No subscription found. Please choose a plan and complete checkout first.' 
      });
    }
    
    console.log('🎫 Creating portal session for customer:', customerId);

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
    const portalConfigurationId = process.env.STRIPE_PORTAL_CONFIGURATION_ID;

    // Create Customer Portal Session
    try {
      const params: Stripe.BillingPortal.SessionCreateParams = {
        customer: customerId,
        return_url: `${appUrl}/?view=settings`,
      };
      if (portalConfigurationId) {
        params.configuration = portalConfigurationId;
      }

      const session = await stripe.billingPortal.sessions.create(params);

      console.log('✅ Portal session created successfully');
      return res.status(200).json({ url: session.url });
    } catch (stripeError: any) {
      console.error('❌ Stripe API error:', stripeError);
      
      // Handle specific Stripe errors
      if (stripeError.type === 'StripeInvalidRequestError') {
        if (stripeError.message?.includes('No such customer')) {
          return res.status(400).json({ 
            message: 'Customer not found in Stripe. Please contact support or create a new subscription.' 
          });
        }
        if (stripeError.message?.includes('does not have a subscription')) {
          return res.status(400).json({ 
            message: 'No active subscription found. Please choose a plan first.' 
          });
        }
        if (stripeError.message?.includes('default configuration is not set')) {
          return res.status(500).json({
            message: 'Customer Portal is not configured for live mode. Please contact support.',
            error: 'Missing live mode default Customer Portal configuration in Stripe.'
          });
        }
      }
      
      throw stripeError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('❌ Error creating portal session:', error);
    return res.status(500).json({ 
      message: 'Failed to open subscription portal',
      error: error.message,
      details: error.type || 'Unknown error'
    });
  }
}

