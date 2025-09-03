// Client utility: uploads a File directly to Vercel Blob using a server-generated URL
// and returns the permanent HTTPS asset URL.

import { createJournalImageUploadURL } from '@/lib/blob/createJournalImageUploadURL';

export async function uploadJournalImage(file: File): Promise<string> {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Only image files are supported.');
  }

  const { uploadURL } = await createJournalImageUploadURL();

  const res = await fetch(uploadURL, {
    method: 'PUT',
    headers: {
      'content-type': file.type,
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  const location = res.headers.get('Location') || res.headers.get('location');
  if (location) return location;

  try {
    const data = await res.json();
    if (data?.url) return data.url as string;
  } catch {
    // ignore
  }

  throw new Error('Upload succeeded but no URL was returned.');
}


