# Deployment Checklist - Security Fix

## ✅ Code Changes Complete
All OpenAI API calls have been moved to secure backend endpoints. No API keys are exposed to the browser.

## 🚨 CRITICAL: Before Deployment

### 1. Generate New OpenAI API Key
The old key has been disabled by OpenAI. You need a new one:
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy it immediately (you won't see it again)
4. **Important**: Set usage limits to prevent abuse

### 2. Setup Firebase Admin (for Rate Limiting)

The rate limiting system uses Firebase Admin SDK. You need a service account:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. **Minify it to single line**: `cat service-account.json | jq -c`
5. Copy the minified JSON output

### 3. Update Vercel Environment Variables
In your Vercel project dashboard:

**Go to**: Project Settings → Environment Variables

**Remove these (if they exist)**:
- `VITE_OPENAI_API_KEY` ❌ (insecure, client-side)

**Add these**:

1. Variable: `OPENAI_API_KEY`
   - Value: Your new OpenAI API key
   - Environments: ✅ Production, ✅ Preview, ✅ Development

2. Variable: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Value: The minified service account JSON (single line)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

### 4. Update Local Environment Variables
Create/update your local `.env` file:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenAI API Key (Backend ONLY - no VITE_ prefix)
OPENAI_API_KEY=your_new_openai_api_key_here
```

### 5. Deploy to Vercel
```bash
# Commit the changes
git add .
git commit -m "Security fix: Move OpenAI API calls to secure backend endpoints"
git push origin main
```

Vercel will automatically deploy when you push to main.

### 6. Verify Deployment

**Test AI Features:**
- [ ] Daily summary generation works
- [ ] Quest suggestions work
- [ ] Reflection template generation works
- [ ] AI coach responses work
- [ ] Trade image parsing works

**Security Check:**
1. Open your deployed site
2. Open browser Dev Tools (F12) → Network tab
3. Trigger an AI feature (e.g., generate daily summary)
4. Inspect the network request:
   - ✅ Should call `/api/generate-ai-*` endpoints
   - ✅ No API key visible in request/response
5. Go to Sources tab → Check bundled JS files:
   - ✅ Search for "sk-" - should find NOTHING
   - ✅ No `dangerouslyAllowBrowser` in code

## 📊 What Was Fixed

### Backend API Endpoints Created:
- `/api/generate-ai-summary.ts` - Daily reflections
- `/api/generate-ai-quests.ts` - Quest generation
- `/api/generate-ai-insight-template.ts` - Reflection templates
- `/api/generate-ai-coach-response.ts` - AI coach
- `/api/parse-trade-image.ts` - Trade OCR

### Client Files Updated:
- `src/lib/ai/generateDailySummary.ts` - Now calls backend API
- `src/lib/ai/generateQuestSuggestions.ts` - Now calls backend API
- `src/lib/ai/generateInsightTemplate.ts` - Now calls backend API
- `src/lib/ai/coachService.ts` - Now calls backend API
- `src/components/TradeImageImport.tsx` - Now calls backend API

### Security Improvements:
✅ API key never sent to browser  
✅ API key not in bundled JavaScript  
✅ All OpenAI calls go through secure backend  
✅ Rate limiting possible at backend level  
✅ Can add authentication/authorization later  

## 🛡️ Future Best Practices

1. **Never use `VITE_` prefix for secrets** - it embeds them in client code
2. **Always use serverless functions for API calls** to third-party services
3. **Never use `dangerouslyAllowBrowser: true`** - it's a security anti-pattern
4. **Set API usage limits** on OpenAI dashboard
5. **Monitor API usage** regularly for unusual activity
6. **Rotate keys periodically** (every 90 days recommended)
7. **Use .env files** and keep them in `.gitignore`

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs for errors
2. Check browser console for client-side errors
3. Verify environment variables are set correctly in Vercel
4. Make sure new OpenAI API key is valid and has credits

## 🎉 After Successful Deployment

Once verified:
1. Update your API usage monitoring on OpenAI dashboard
2. Set up usage alerts for unusual activity
3. Document this incident for future reference
4. Consider setting up automated security scanning (e.g., GitGuardian)

