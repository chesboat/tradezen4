import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { VercelRequest } from '@vercel/node';

// Initialize Firebase Admin (only once)
let firebaseInitialized = false;
try {
  if (!getApps().length) {
    // In production, Vercel will use FIREBASE_SERVICE_ACCOUNT_KEY env var
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not found - rate limiting will be disabled');
    }
  } else {
    firebaseInitialized = true;
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
  console.warn('⚠️ Rate limiting will be disabled');
}

const db = firebaseInitialized ? getFirestore() : null;

// Rate limit configuration per feature
export const RATE_LIMITS = {
  'generate-ai-summary': {
    dailyLimit: 10, // 10 summaries per day per user
    name: 'Daily Summary Generation',
  },
  'generate-ai-quests': {
    dailyLimit: 5, // 5 quest generations per day
    name: 'Quest Suggestions',
  },
  'generate-ai-insight-template': {
    dailyLimit: 8, // 8 reflection templates per day
    name: 'Reflection Templates',
  },
  'generate-ai-coach-response': {
    dailyLimit: 30, // 30 coach questions per day
    name: 'AI Coach',
  },
  'parse-trade-image': {
    dailyLimit: 20, // 20 image parses per day
    name: 'Trade Image Parsing',
  },
} as const;

export type RateLimitFeature = keyof typeof RATE_LIMITS;

interface RateLimitData {
  count: number;
  resetAt: string; // ISO date string
  lastRequest: string;
}

/**
 * Check and enforce rate limits for a user and feature
 * @param userId - Firebase user ID
 * @param feature - The API feature being rate limited
 * @returns Object with allowed status and remaining count
 */
export async function checkRateLimit(
  userId: string,
  feature: RateLimitFeature
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  message?: string;
}> {
  const config = RATE_LIMITS[feature];
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const resetAt = new Date(today);
  resetAt.setUTCDate(resetAt.getUTCDate() + 1); // Next day at midnight UTC

  // If Firebase isn't initialized, allow all requests (fail open)
  if (!firebaseInitialized) {
    console.warn('⚠️ Firebase not initialized - allowing request without rate limit check');
    return {
      allowed: true,
      remaining: config.dailyLimit,
      limit: config.dailyLimit,
      resetAt,
    };
  }

  try {
    const docRef = db!
      .collection('rateLimits')
      .doc(userId)
      .collection('features')
      .doc(feature);

    const doc = await docRef.get();
    const data = doc.data() as RateLimitData | undefined;

    // Check if we need to reset (new day)
    if (!data || !data.resetAt || data.resetAt < today) {
      // Reset the counter for a new day
      await docRef.set({
        count: 1,
        resetAt: today,
        lastRequest: new Date().toISOString(),
      });

      return {
        allowed: true,
        remaining: config.dailyLimit - 1,
        limit: config.dailyLimit,
        resetAt,
      };
    }

    // Check if limit exceeded
    if (data.count >= config.dailyLimit) {
      return {
        allowed: false,
        remaining: 0,
        limit: config.dailyLimit,
        resetAt,
        message: `Daily limit of ${config.dailyLimit} requests for ${config.name} exceeded. Resets at midnight UTC.`,
      };
    }

    // Increment counter
    await docRef.update({
      count: data.count + 1,
      lastRequest: new Date().toISOString(),
    });

    return {
      allowed: true,
      remaining: config.dailyLimit - (data.count + 1),
      limit: config.dailyLimit,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open to not block legitimate users)
    return {
      allowed: true,
      remaining: config.dailyLimit,
      limit: config.dailyLimit,
      resetAt,
    };
  }
}

/**
 * Extract user ID from request (from Firebase auth token)
 */
export function extractUserId(req: VercelRequest): string | null {
  // Check for Authorization header with Firebase ID token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  // For now, we'll use a simple approach
  // In production, you'd verify the Firebase token here
  // For simplicity, we'll use user ID from request body if available
  const userId = (req.body as any)?.userId;
  
  if (userId) {
    return userId;
  }

  // Fallback to IP-based rate limiting if no user ID
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  return `ip_${Array.isArray(ip) ? ip[0] : ip}`;
}

/**
 * Get current rate limit status for a user and feature (without incrementing)
 */
export async function getRateLimitStatus(
  userId: string,
  feature: RateLimitFeature
): Promise<{
  remaining: number;
  limit: number;
  resetAt: Date;
}> {
  const config = RATE_LIMITS[feature];
  const today = new Date().toISOString().split('T')[0];
  const resetAt = new Date(today);
  resetAt.setUTCDate(resetAt.getUTCDate() + 1);

  // If Firebase isn't initialized, return full limit
  if (!firebaseInitialized || !db) {
    return {
      remaining: config.dailyLimit,
      limit: config.dailyLimit,
      resetAt,
    };
  }

  try {
    const docRef = db
      .collection('rateLimits')
      .doc(userId)
      .collection('features')
      .doc(feature);

    const doc = await docRef.get();
    const data = doc.data() as RateLimitData | undefined;

    if (!data || !data.resetAt || data.resetAt < today) {
      return {
        remaining: config.dailyLimit,
        limit: config.dailyLimit,
        resetAt,
      };
    }

    return {
      remaining: Math.max(0, config.dailyLimit - data.count),
      limit: config.dailyLimit,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit status error:', error);
    return {
      remaining: config.dailyLimit,
      limit: config.dailyLimit,
      resetAt,
    };
  }
}

