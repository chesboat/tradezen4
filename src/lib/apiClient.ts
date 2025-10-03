import { auth } from './firebase';

/**
 * Make an authenticated fetch request to the API with rate limit handling
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('You must be logged in to use AI features');
  }

  // Add user ID to request body
  const body = options.body 
    ? { ...JSON.parse(options.body as string), userId: currentUser.uid }
    : { userId: currentUser.uid };

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });

  // Handle rate limit errors with helpful message
  if (response.status === 429) {
    const data = await response.json();
    const resetDate = new Date(data.resetAt);
    const resetTime = resetDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    throw new Error(
      `Daily limit reached for this feature (${data.limit} requests). ` +
      `Resets at ${resetTime} UTC. Remaining: ${data.remaining}`
    );
  }

  return response;
}

/**
 * Get rate limit information from response headers
 */
export function getRateLimitInfo(response: Response): {
  limit: number;
  remaining: number;
  resetAt: Date;
} | null {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');

  if (!limit || !remaining || !reset) {
    return null;
  }

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    resetAt: new Date(reset),
  };
}

