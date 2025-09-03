import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createUploadURL } from '@vercel/blob';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin once per runtime
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      // Running without Admin creds – uploads will be blocked
      // You must configure env vars in Vercel for authenticated writes
      console.warn('Firebase Admin env vars are not fully set.');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  } catch (e) {
    console.error('Failed to init Firebase Admin:', e);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Require Authorization: Bearer <Firebase ID token>
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;

    if (!token || !admin.apps.length) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let decoded: admin.auth.DecodedIdToken | null = null;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Optionally, you can enforce per-user quotas/validation using decoded.uid

    const { url } = await createUploadURL({
      access: 'public',
      addRandomSuffix: true,
      allowedContentTypes: ['image/*'],
      maximumSize: 50_000_000, // 50MB to accommodate large screenshots
    });

    return res.status(200).json({ uploadURL: url });
  } catch (e: any) {
    console.error('createUploadURL failed:', e);
    const message = typeof e?.message === 'string' ? e.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}


