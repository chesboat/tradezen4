// Client helper that calls our Vercel serverless function to create a direct-upload URL.
// Requires the caller to be authenticated; we forward Firebase ID token.

import { auth } from '@/lib/firebase';

export async function createJournalImageUploadURL(): Promise<{ uploadURL: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthorized');
  const idToken = await user.getIdToken();

  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  const endpoint = `${base ? base.replace(/\/$/, '') : ''}/api/create-journal-upload-url`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to create upload URL: ${res.status} ${text}`);
  }

  return (await res.json()) as { uploadURL: string };
}


