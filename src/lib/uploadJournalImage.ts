// Client utility: uploads a File directly to Vercel Blob using a server-generated URL
// and returns the permanent HTTPS asset URL.

import { auth } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '@/lib/firebase';

export async function uploadJournalImage(file: File): Promise<string> {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Only image files are supported.');
  }

  const user = auth.currentUser;
  
  // For local development, use Firebase Storage as fallback
  const isDev = import.meta.env.DEV;
  if (isDev) {
    try {
      if (!user) throw new Error('Must be authenticated to upload images');
      
      const storage = getStorage(app as any);
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const fileName = `journal-images/${user.uid}/${timestamp}-${randomId}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Firebase Storage upload failed:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  // Production: use Vercel Blob API
  const idToken = user ? await user.getIdToken() : undefined;
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  const endpoint = `${base ? base.replace(/\/$/, '') : ''}/api/upload-journal-image`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': file.type,
      ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (!data?.url) throw new Error('Upload succeeded but no URL returned');
  return data.url as string;
}


