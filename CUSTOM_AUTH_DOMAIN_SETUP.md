# Custom Auth Domain Setup Guide

## Problem
Users see `tradezen.firebaseapp.com` during Google/Apple sign-in, which looks unprofessional and off-brand.

## Solution
Use Firebase Auth's custom domain feature to show `auth.refine.trading` (or any subdomain) instead.

---

## Step 1: Set Up Custom Domain in Firebase Console

### 1.1 Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `tradezen` project
3. Click **Authentication** in the left sidebar
4. Click on the **Settings** tab
5. Scroll down to **Authorized domains**

### 1.2 Add Your Custom Domain
1. Click **Add domain**
2. Enter: `auth.refine.trading` (recommended subdomain)
   - You can use any subdomain like `login.refine.trading`
   - **Do not** use your main domain (`refine.trading`) - use a subdomain
3. Click **Add**

---

## Step 2: Configure DNS Records

### 2.1 Get Firebase Hosting Details
After adding the domain, Firebase will provide DNS verification records.

### 2.2 Update DNS at Your Domain Provider
Add these DNS records (values will be shown in Firebase Console):

```
Type: TXT
Name: auth.refine.trading
Value: [Firebase will provide this - looks like "firebase-verification=..."]
TTL: 3600

Type: A
Name: auth.refine.trading
Value: 151.101.1.195
TTL: 3600

Type: A
Name: auth.refine.trading
Value: 151.101.65.195
TTL: 3600
```

**Note:** If using Vercel/Cloudflare for DNS, the exact IPs might differ. Use the ones Firebase provides.

### 2.3 Wait for DNS Propagation
- Can take 5 minutes to 48 hours
- Usually completes within 1 hour
- Check status at: https://dnschecker.org/

---

## Step 3: Update Your Environment Variables

### 3.1 Update `.env` or Vercel Environment Variables

**Current value:**
```env
VITE_FIREBASE_AUTH_DOMAIN=tradezen.firebaseapp.com
```

**New value:**
```env
VITE_FIREBASE_AUTH_DOMAIN=auth.refine.trading
```

### 3.2 If Using Vercel:
1. Go to your Vercel project
2. Settings → Environment Variables
3. Find `VITE_FIREBASE_AUTH_DOMAIN`
4. Update to: `auth.refine.trading`
5. Click **Save**

### 3.3 Redeploy
```bash
# If using Vercel CLI
vercel --prod

# Or push to main branch if auto-deploy is enabled
git commit -m "Update auth domain to custom domain"
git push origin main
```

---

## Step 4: Update OAuth Provider Configurations

### 4.1 Google OAuth Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (used for Firebase)
5. Click Edit
6. Under **Authorized JavaScript origins**, add:
   - `https://auth.refine.trading`
7. Under **Authorized redirect URIs**, add:
   - `https://auth.refine.trading/__/auth/handler`
8. Click **Save**

### 4.2 Apple Sign In (if using)
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles
3. Find your Sign in with Apple configuration
4. Update **Return URLs** to include:
   - `https://auth.refine.trading/__/auth/handler`
5. Save changes

---

## Step 5: Test the Changes

### 5.1 Clear Browser Cache
```bash
# Chrome
Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
# Clear "Cookies and other site data"
```

### 5.2 Test Sign In
1. Open your app: `https://refine.trading`
2. Click "Sign in with Google"
3. **Verify**: URL should now show `auth.refine.trading` instead of `tradezen.firebaseapp.com`

### 5.3 Verify All Flows Work
- ✅ Google Sign In
- ✅ Apple Sign In  
- ✅ Email/Password Sign In
- ✅ Password Reset
- ✅ Sign Out

---

## Alternative: Use Your Main Domain

If you prefer `refine.trading` instead of `auth.refine.trading`:

### Pros:
- Cleaner URL
- One less subdomain

### Cons:
- ⚠️ **Not recommended** - Firebase Auth needs to control the entire domain
- May conflict with your main app routing
- More complex setup

### How to do it:
1. Use a subdomain path instead: `refine.trading/auth`
2. Configure Vercel rewrites in `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/auth/:path*",
      "destination": "https://tradezen.firebaseapp.com/__/auth/:path*"
    }
  ]
}
```

**Recommendation:** Stick with `auth.refine.trading` - it's simpler and follows best practices.

---

## Troubleshooting

### Issue: "Invalid domain" error
**Solution:** Make sure domain is added to Firebase **Authorized domains** list

### Issue: DNS not propagating
**Solution:** 
- Wait longer (can take up to 48 hours)
- Check DNS with: `nslookup auth.refine.trading`
- Verify records at: https://dnschecker.org/

### Issue: OAuth redirect error
**Solution:** Double-check redirect URIs in Google/Apple console match exactly:
- `https://auth.refine.trading/__/auth/handler`

### Issue: Still seeing firebase domain
**Solution:**
- Clear browser cache
- Check environment variable is updated in Vercel
- Verify deployment has new env var
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)

---

## Benefits After Setup

✅ **Professional branding** - Users see `auth.refine.trading`  
✅ **Trust** - Custom domain looks more legitimate  
✅ **Consistency** - All URLs match your brand  
✅ **Same functionality** - Everything works exactly the same  

---

## Cost

**FREE** - Firebase Auth custom domains are included at no extra cost.

---

## Recommended Subdomain Structure

For professional apps, use this pattern:
- `refine.trading` - Main app
- `auth.refine.trading` - Authentication
- `api.refine.trading` - API endpoints (if needed)
- `docs.refine.trading` - Documentation (if needed)

This keeps everything organized and follows industry best practices.

