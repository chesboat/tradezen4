# Rate Limiting System

## Overview

TradZen4 implements intelligent per-user rate limiting for all AI features to control costs and prevent abuse. Rate limits are tied to **Firebase user accounts** and tracked in **Firestore**, ensuring fair usage across all users.

## How It Works

### 1. **User-Based Tracking**
- Each Firebase authenticated user has individual rate limits
- Limits are tracked per feature (summaries, quests, coach, etc.)
- Usage counters are stored in Firestore under `/rateLimits/{userId}/features/{feature}`

### 2. **Daily Reset Cycle**
- All limits reset at **midnight UTC** every day
- Users get a fresh allocation of requests each day
- Reset time is included in API responses

### 3. **Request Flow**
```
User Request → Client (with userId) → API Endpoint
                                           ↓
                            Check Firestore for usage count
                                           ↓
                        [Below limit?] → Process request → Increment counter
                        [At limit?] → Return 429 error
```

## Rate Limits by Feature

| Feature | Daily Limit | Cost per Request | Description |
|---------|-------------|------------------|-------------|
| Daily Summary | 10 requests | ~$0.0004 | AI-generated trading summaries |
| Quest Suggestions | 5 requests | ~$0.0007 | Personalized quest generation |
| Reflection Templates | 8 requests | ~$0.0009 | Custom insight templates |
| AI Coach | 30 requests | ~$0.0003 | Trading coach Q&A |
| Trade Image Parsing | 20 requests | ~$0.0007 | OCR and trade extraction |

### Why These Limits?

These limits are set to:
- ✅ Support normal daily usage patterns
- ✅ Prevent cost overruns (~$1-2 per active user per day max)
- ✅ Discourage automated scraping or abuse
- ✅ Allow for multiple sessions throughout the day

**Typical daily usage:**
- 1-2 daily summaries
- 2-3 coach questions
- 1-2 reflection templates
- 3-5 trade image parses

= ~10-15 total requests/day (well within limits)

## API Response Headers

Every AI API response includes rate limit information:

```
X-RateLimit-Limit: 30           # Total daily limit for this feature
X-RateLimit-Remaining: 27       # Requests remaining today
X-RateLimit-Reset: 2025-10-04T00:00:00.000Z  # When limit resets
```

## Error Handling

### When Limit is Reached

**HTTP 429 - Too Many Requests**
```json
{
  "error": "Daily limit of 30 requests for AI Coach exceeded. Resets at midnight UTC.",
  "remaining": 0,
  "limit": 30,
  "resetAt": "2025-10-04T00:00:00.000Z"
}
```

### Client-Side Handling
The app automatically:
- ✅ Shows user-friendly error messages
- ✅ Displays remaining requests
- ✅ Shows when limits will reset
- ✅ Falls back to local/mock features when available

## Firestore Data Structure

```
/rateLimits
  /{userId}
    /features
      /generate-ai-summary
        - count: 3
        - resetAt: "2025-10-03"
        - lastRequest: "2025-10-03T14:32:15.000Z"
      /generate-ai-coach-response
        - count: 12
        - resetAt: "2025-10-03"
        - lastRequest: "2025-10-03T15:45:22.000Z"
```

## Configuration

### Adjusting Limits

Edit `api/_lib/rateLimit.ts`:

```typescript
export const RATE_LIMITS = {
  'generate-ai-summary': {
    dailyLimit: 10,  // ← Adjust this number
    name: 'Daily Summary Generation',
  },
  // ... other features
}
```

### Per-Tier Limits (Future Enhancement)

You can implement different limits for subscription tiers:

```typescript
// Example: Premium users get higher limits
const getUserTier = async (userId: string) => {
  const doc = await db.collection('users').doc(userId).get();
  return doc.data()?.subscriptionTier || 'free';
};

const tierLimits = {
  free: { dailyLimit: 10 },
  premium: { dailyLimit: 50 },
  pro: { dailyLimit: 200 },
};
```

## Cost Protection

### OpenAI API Level
1. Set monthly budget: $25-50/month
2. Enable usage notifications at 50%, 80%, 100%
3. Monitor at https://platform.openai.com/usage

### Application Level (This Rate Limiting)
1. Per-user daily limits prevent single-user abuse
2. Firestore tracking ensures limits persist across serverless instances
3. Graceful degradation to local features when limits hit

### Combined Protection
```
User → App Rate Limit (daily per user)
         ↓
      OpenAI Rate Limit (global per account)
         ↓
      OpenAI Monthly Budget (hard cap)
```

## Monitoring

### Check User's Current Status

You can query Firestore to see any user's rate limit status:

```javascript
const userId = "user_firebase_uid";
const feature = "generate-ai-coach-response";

const doc = await db
  .collection('rateLimits')
  .doc(userId)
  .collection('features')
  .doc(feature)
  .get();

console.log(doc.data());
// { count: 12, resetAt: "2025-10-03", lastRequest: "..." }
```

### Analytics Queries

Find heavy users:
```javascript
// Get all users who hit their AI coach limit today
const today = new Date().toISOString().split('T')[0];
const snapshot = await db.collectionGroup('features')
  .where('resetAt', '==', today)
  .where('count', '>=', 30)
  .get();
```

## Security Features

1. **Authentication Required**: All AI endpoints require valid Firebase user ID
2. **User Isolation**: Each user can only access their own limits (enforced by backend)
3. **Firestore Rules**: Rate limit data is read/write protected
4. **No Client Override**: Limits are enforced server-side only
5. **IP Fallback**: Anonymous users get IP-based rate limiting (restrictive)

## Firestore Security Rules

Add to your `firestore.rules`:

```
// Rate limit data - users can read their own, backend can write
match /rateLimits/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if false; // Only backend can write
  
  match /features/{feature} {
    allow read: if request.auth != null && request.auth.uid == userId;
    allow write: if false; // Only backend can write
  }
}
```

## Testing Rate Limits

### Test in Development

```bash
# Call endpoint 31 times to hit coach limit
for i in {1..31}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/generate-ai-coach-response \
    -H "Content-Type: application/json" \
    -d '{"userId":"test_user","messages":[...]}'
done
```

### Monitor in Production

Check Firestore console:
- Go to `/rateLimits` collection
- View user activity
- Identify patterns
- Adjust limits as needed

## Future Enhancements

1. **Tier-Based Limits**: Different limits for free/premium/pro users
2. **Rolling Windows**: Instead of daily reset, use 24-hour rolling windows
3. **Burst Limits**: Allow short bursts (e.g., 5 requests per minute + 30 per day)
4. **Grace Period**: Give users 1-2 extra requests with warnings
5. **Usage Dashboard**: Show users their current usage in the UI
6. **Request Queuing**: Queue requests when near limit, process after reset
7. **Redis Caching**: Faster rate limit checks with Redis

## Troubleshooting

### Users Getting 401 "Authentication Required"
- Ensure Firebase auth is working
- Check that `userId` is being sent in request body
- Verify user is logged in before making AI requests

### Limits Not Resetting
- Check UTC timezone calculation
- Verify Firestore writes are succeeding
- Check for Firestore permission errors in logs

### High Costs Despite Limits
- Audit actual OpenAI API usage at platform.openai.com
- Check for any direct API calls bypassing rate limiting
- Verify token counts match expectations

## Summary

✅ **Per-user daily limits** prevent abuse  
✅ **Firestore tracking** ensures consistency  
✅ **Automatic resets** at midnight UTC  
✅ **Graceful error handling** with helpful messages  
✅ **Transparent to users** via response headers  
✅ **Cost-effective** - typical user costs $0.01-0.05/day  
✅ **Scalable** - supports thousands of users  

The system balances user experience with cost control, ensuring sustainable AI feature usage.

