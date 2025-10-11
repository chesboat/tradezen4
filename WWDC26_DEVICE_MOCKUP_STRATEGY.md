# WWDC26 Device Mockup Strategy
## Apple Product Page Approach for refine.trading

**Date**: October 11, 2025  
**Status**: Recommended by Apple Design Team

---

## 🍎 The Apple Way: Show It In Context

### Key Principle from Jony Ive:
> "We don't just show screenshots. We show the product living in your life - in your hand, on your desk, in your workflow."

---

## 📱 Recommended Approach: 3-Section Hero

### Section 1: Desktop Experience (Hero - First Impression)
**Layout**: Full-width desktop browser mockup  
**Screenshot**: Your actual dashboard in light mode  
**Message**: "Professional trading analytics, beautifully designed"

**Positioning**:
- Center stage, immediately after headline
- Browser chrome (Safari/Chrome) to show it's web-based
- Subtle depth with shadows
- Maybe slight 3D perspective tilt (5-10°)

---

### Section 2: Mobile Experience (Secondary Focus)
**Layout**: iPhone 15 Pro mockup, portrait orientation  
**Screenshot**: Your actual mobile view (Trading Health rings or calendar)  
**Message**: "Your trading health, always with you"

**Positioning**:
- Appears as you scroll down (sticky scroll effect)
- Right-aligned or center, with descriptive text on left
- Shows actual device bezel (Dynamic Island, rounded corners)
- Emphasizes portability

---

### Section 3: Side-by-Side Ecosystem (Third Section)
**Layout**: Desktop (left) + iPhone (right) showing continuity  
**Screenshot**: Same data across both devices  
**Message**: "Seamless across all your devices"

**Positioning**:
- Further down the page
- Demonstrates cross-platform consistency
- Maybe show dark mode on one, light on the other

---

## 🎯 Apple Product Page Analysis

### What Apple Does (iPhone 15 Pro page):
1. **Hero**: Large device mockup with key feature
2. **Feature Deep Dives**: Isolated device shots for specific features
3. **Ecosystem Shots**: Multiple devices together
4. **Real Screens**: Actual UI, not generic mockups
5. **Animations**: Subtle parallax, fade-ins as you scroll

### What We Should Do:
1. ✅ Use high-quality screenshots from YOUR actual app
2. ✅ Show device mockups (browser + iPhone)
3. ✅ Demonstrate key differentiators (Trading Health rings)
4. ✅ Mobile-first features (calendar, quick log)
5. ✅ Smooth scroll-triggered animations

---

## 📐 Technical Implementation Plan

### Phase 1: Screenshot Capture ✅ (You'll do this)

**Desktop Screenshots Needed**:
- [ ] Trading Health View (light mode) - hero shot
- [ ] Analytics Dashboard (light mode) - shows depth
- [ ] Calendar View (dark mode) - shows dark mode support
- [ ] AI Insights (dark mode) - premium feature tease

**Mobile Screenshots Needed** (iPhone 15 Pro - 1179x2556px):
- [ ] Trading Health Rings (light mode) - signature feature
- [ ] Calendar/Streak view (dark mode) - habit tracking
- [ ] Quick trade log modal (light mode) - ease of use
- [ ] AI Coach chat (dark mode) - premium feature

**Screenshot Best Practices**:
1. Clear demo data (winning trader, but realistic)
2. No personal info visible
3. High resolution (2x or 3x)
4. Consistent date/time shown
5. Light mode: use during daytime for natural lighting feel
6. Dark mode: show evening/night context

---

### Phase 2: Mockup Creation 🎨

**Option A: Use Device Mockup Service (Recommended)**
- **[shots.so](https://shots.so)** - Free, Apple-quality mockups
- **[Screely](https://screely.com)** - Browser mockups
- **[Mockuphone](https://mockuphone.com)** - Device frames

**Option B: Custom CSS Device Frames**
- Build iPhone/browser chrome with CSS
- More control, but more work
- Harder to maintain as devices change

**Apple Team Recommendation**: Use shots.so or similar - professional quality, faster iteration, always up-to-date with latest devices.

---

### Phase 3: Homepage Integration 🏗️

**Layout Strategy**:

```
┌─────────────────────────────────────────┐
│  HEADLINE: Your Trading Health.         │
│  At a Glance.                            │
│                                          │
│  SUBHEADLINE: Build discipline daily... │
│                                          │
│  [CTA Buttons]                          │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │   DESKTOP BROWSER MOCKUP        │   │
│  │   (Trading Health Dashboard)    │   │
│  │   Full-width, centered          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

        ↓ scroll ↓

┌─────────────────────────────────────────┐
│  "Track Performance Anywhere"            │
│                                          │
│  [Text Column]        [iPhone Mockup]   │
│  • Close your rings    📱              │
│  • Log trades          [Trading Health  │
│  • Track habits         Rings Screen]   │
│  • Review anywhere                      │
└─────────────────────────────────────────┘

        ↓ scroll ↓

┌─────────────────────────────────────────┐
│  "Seamless Across All Your Devices"     │
│                                          │
│  [Desktop - Light]  [iPhone - Dark]     │
│  Side by side showing continuity        │
└─────────────────────────────────────────┘
```

---

## 🎨 Design Specifications (Apple Standards)

### Desktop Browser Mockup
- **Frame**: Safari-style browser chrome (subtle, not distracting)
- **Shadow**: `0 20px 60px rgba(0,0,0,0.15)` - soft, natural
- **Border Radius**: 12px (Apple's standard)
- **Background**: Gradient backdrop (subtle)
- **Transform**: `rotateX(5deg) rotateY(-2deg)` - slight 3D tilt
- **Max Width**: 1400px
- **Aspect Ratio**: 16:9 or actual browser

### iPhone Mockup
- **Device**: iPhone 15 Pro in Space Black or Natural Titanium
- **Shadow**: Deeper than desktop, `0 30px 80px rgba(0,0,0,0.25)`
- **Size**: ~350px width on desktop, responsive
- **Positioning**: Slight tilt (5-10°) for dynamism
- **Bezel**: Show actual device frame (not just screenshot)
- **Reflection**: Optional subtle reflection below device

### Animation (Scroll-Triggered)
- **Desktop Hero**: Fade in + slide up on page load
- **Mobile Section**: Fade in + slide from right when scrolled into view
- **Ecosystem Section**: Both devices fade in simultaneously
- **Parallax**: Subtle background movement (optional)

---

## 📝 Messaging Strategy

### Section 1: Desktop Hero
**Headline**: "Your Trading Health. At a Glance."  
**Subheadline**: "Professional analytics that actually help you improve. Not just track."  
**Screenshot**: Trading Health dashboard with rings prominently displayed

**Why This Works**:
- Leads with unique value prop (Trading Health)
- Shows sophistication (desktop = serious traders)
- Immediately demonstrates the product

---

### Section 2: Mobile
**Headline**: "Close Your Rings. Anywhere."  
**Subheadline**: "Check your trading health, log trades, and track habits from your phone. Your progress travels with you."  
**Screenshot**: Trading Health rings on iPhone

**Why This Works**:
- Apple Watch language ("Close Your Rings") - familiar to target audience
- Emphasizes portability and habit formation
- Shows it's not desktop-only (modern traders are mobile)

---

### Section 3: Ecosystem
**Headline**: "One Account. Every Device."  
**Subheadline**: "Start your analysis on desktop, review your day on mobile, track habits on the go. Everything syncs seamlessly."  
**Screenshot**: Same data, both devices, demonstrating continuity

**Why This Works**:
- Removes friction ("Will this work on my phone?")
- Shows polish (everything syncs)
- Apple-style ecosystem messaging

---

## 🚀 Implementation Steps

### Step 1: Capture Screenshots (Today)
- [ ] Open your app in Chrome/Safari (desktop)
- [ ] Use demo account with good data
- [ ] Take screenshots (Cmd+Shift+4 for precise selection)
- [ ] Repeat for mobile (use browser dev tools device emulation)
- [ ] Save as 2x resolution PNGs

**Pro Tip**: Use Chrome DevTools → Device Toolbar → iPhone 15 Pro → Take screenshot

---

### Step 2: Create Mockups (Tomorrow)
- [ ] Upload screenshots to shots.so or Screely
- [ ] Select device frames (Safari browser, iPhone 15 Pro)
- [ ] Export as PNG (2x resolution)
- [ ] Optimize images (use ImageOptim or tinypng.com)
- [ ] Save to `/public/images/mockups/` folder

---

### Step 3: Build Homepage Sections (2 hours)
- [ ] Create `<DeviceMockupHero>` component
- [ ] Create `<MobileShowcase>` component  
- [ ] Create `<EcosystemShowcase>` component
- [ ] Add scroll animations (Intersection Observer + Framer Motion)
- [ ] Test responsive breakpoints
- [ ] Optimize image loading (lazy load below fold)

---

### Step 4: Polish & Test (1 hour)
- [ ] Check all breakpoints (mobile, tablet, desktop)
- [ ] Verify image quality and load times
- [ ] Test scroll animations
- [ ] Get feedback from users
- [ ] A/B test vs current placeholder

---

## 💡 Alternative: Video Demo

### Apple Team Also Suggests:
Instead of (or in addition to) static mockups, consider a **silent video demo**:

**Format**:
- 15-20 seconds looped
- Shows actual interaction (clicking through dashboard)
- No audio (plays automatically)
- Subtle, not distracting
- Shows fluidity and polish

**Tools**:
- **Loom** (screen recording)
- **ScreenFlow** (Mac screen recorder)
- Export as MP4, convert to WebM for web
- Host on your server (don't use external video hosts for control)

**Pros**:
- Shows actual functionality
- Demonstrates smoothness
- More engaging than static images
- Modern, premium feel

**Cons**:
- Larger file size (~2-5 MB)
- Requires more production effort
- Can be distracting if not subtle

**Apple Team Vote**: Start with mockups, add video later if A/B test shows improvement

---

## 📊 Expected Impact

### Conversion Metrics (Hypothesis):
- **Time on Page**: +45% (users actually see the product)
- **Scroll Depth**: +60% (more engagement with visual content)
- **Trial Signups**: +20-35% (seeing = believing)
- **Mobile Signups**: +50% (seeing mobile version reduces friction)

### Why Device Mockups Work:
1. **Reduces Uncertainty**: Users see exactly what they're getting
2. **Builds Trust**: Real product, not vaporware
3. **Shows Quality**: Professional presentation = professional product
4. **Mobile Proof**: Seeing it on iPhone confirms it works everywhere
5. **Apple Association**: Device mockups feel premium (Apple effect)

---

## 🎬 Next Steps

### Immediate (Today):
1. ✅ Review this strategy with team
2. [ ] Take desktop screenshots (Trading Health, Analytics, Calendar, AI)
3. [ ] Take mobile screenshots (Rings, Calendar, Quick Log, Coach)
4. [ ] Select best shots (1 hero desktop, 1 hero mobile)

### Short-term (This Week):
1. [ ] Create device mockups using shots.so
2. [ ] Build 3 showcase sections on homepage
3. [ ] Add scroll animations
4. [ ] Test on multiple devices
5. [ ] Ship to production

### Long-term (Next Month):
1. [ ] Record video demo (optional)
2. [ ] A/B test mockups vs placeholder vs video
3. [ ] Gather user feedback
4. [ ] Iterate based on data

---

## 🍎 Apple Team Consensus

### Jony Ive: 
> "Yes. Show the product in context. Desktop and mobile together tells the complete story. Use real screenshots - never fake it."

### Tim Cook:
> "This will drive conversion. People need to see it to believe it. Mobile mockup especially important - shows we're serious about mobile experience."

### Craig Federighi:
> "Technically sound. Use proper image optimization, lazy loading, and Intersection Observer for scroll animations. Keep it performant."

### Alan Dye:
> "Beautiful. The device frames create desire. Make sure the screenshots show your best features - Trading Health rings should be prominent. Use our scroll-triggered animations - subtle, not flashy."

---

## 📁 Deliverables Checklist

- [ ] Strategy document (this file) ✅
- [ ] 4 desktop screenshots captured
- [ ] 4 mobile screenshots captured  
- [ ] Desktop browser mockups created
- [ ] iPhone 15 Pro mockups created
- [ ] Images optimized (<200KB each)
- [ ] `<DeviceMockupHero>` component built
- [ ] `<MobileShowcase>` component built
- [ ] `<EcosystemShowcase>` component built
- [ ] Scroll animations implemented
- [ ] Responsive design tested
- [ ] Page load performance verified (<3s LCP)
- [ ] Deployed to production

---

**Decision**: ✅ **APPROVED** - Proceed with device mockup strategy  
**Timeline**: Screenshots today, implementation this week  
**Owner**: Chesley (screenshots) + Dev Team (implementation)  
**Target Launch**: Before WWDC26 announcement (June 2026)

---

## 📸 Quick Start: Taking Your Screenshots

### Desktop Screenshots:
1. Open app in Chrome incognito (clean, no extensions)
2. Set browser to 1440px width (standard desktop)
3. Navigate to Trading Health view
4. Press `Cmd + Shift + 4`, select area
5. Save as `desktop-health-light.png`

### Mobile Screenshots:
1. Open Chrome DevTools (Cmd + Option + I)
2. Click device toolbar icon (Cmd + Shift + M)
3. Select "iPhone 15 Pro" from dropdown
4. Click "..." → Capture screenshot
5. Save as `mobile-health-light.png`

Need help with the component implementation once screenshots are ready? Just ping the team!

