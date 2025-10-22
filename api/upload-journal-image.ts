// @ts-nocheck - TODO: Update to new @vercel/blob API
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { customAlphabet } from 'nanoid';

// Initialize Firebase Admin once per runtime
if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('Firebase Admin env vars are not fully set.');
    } else {
      initializeApp({
        credential: cert({
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

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const allowPublic = process.env.ALLOW_PUBLIC_UPLOAD_URLS === 'true';
    if (!allowPublic) {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : undefined;

      if (!token || !getApps().length) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      try {
        await getAuth().verifyIdToken(token);
      } catch (_e) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    const contentType = req.headers['content-type'] || '';
    if (typeof contentType !== 'string' || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Content-Type must be image/*' });
    }

    const filenameHeader = `upload-${Date.now()}-${nanoid()}`;

    // Read the raw request body into a Buffer
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => resolve());
      req.on('error', (err: any) => reject(err));
    });
    const buffer = Buffer.concat(chunks);

    // Upload directly from the function to Vercel Blob
    const blob = await put(filenameHeader, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType,
      allowOverwrite: true, // Allow overwriting existing files
    });

    return res.status(200).json({ url: blob.url });
  } catch (e: any) {
    console.error('upload-journal-image failed:', e);
    const message = typeof e?.message === 'string' ? e.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}


