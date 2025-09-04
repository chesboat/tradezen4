// Client utility: uploads a File directly to Vercel Blob using a server-generated URL
// and returns the permanent HTTPS asset URL.

import { auth } from '@/lib/firebase';

export async function uploadJournalImage(file: File): Promise<string> {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Only image files are supported.');
  }

  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : undefined;

  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  const endpoint = `${base ? base.replace(/\/$/, '') : ''}/api/upload-journal-image`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': file.type,
      ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
      'x-filename': file.name,
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


