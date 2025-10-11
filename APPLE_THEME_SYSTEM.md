# 🍎 Apple-Style Theme System

## How It Works

### The Apple Philosophy
Apple's apps always respect user preferences and system settings, creating a seamless experience:

1. **First-time users**: Automatically match system theme
2. **System changes**: Auto-update theme (unless user manually toggled)
3. **Manual override**: Respect user choice forever
4. **Marketing pages**: Always light mode (trust & conversion)

---

## Implementation

### For Logged-Out Users (Marketing)
- **Always light mode**
- Homepage, Features, Pricing, Welcome Flow, Auth forms
- Why? Light mode = trust, professionalism, better conversion

### For Logged-In Users (Dashboard)
#### First-Time Login:
```
✅ System is in light mode → Dashboard loads in light mode
✅ System is in dark mode → Dashboard loads in dark mode
```

#### Returning Users:
```
✅ User has manually toggled → Always use their preference
✅ User has never toggled → Follow system theme automatically
```

#### System Theme Changes:
```
✅ If user HAS manually toggled → Keep their preference
✅ If user HAS NOT manually toggled → Auto-switch with system
```

---

## Code Architecture

### 1. `useTheme.ts`
- Checks `localStorage` for saved preference
- Falls back to system preference (`prefers-color-scheme`)
- Listens for system theme changes
- Tracks manual toggles separately

### 2. `App.tsx`
- Forces light mode for logged-out users
- Restores saved theme or system preference for logged-in users
- Ensures consistent theme on page load

### 3. Marketing Pages
- Explicit light mode Tailwind classes (`bg-white`, `text-gray-900`)
- No reliance on CSS theme variables
- Optimized for conversion

---

## User Experience Examples

### Scenario 1: New User, Light System
1. Visit homepage → **Light mode** ✅
2. Sign up → Welcome flow in **light mode** ✅
3. First dashboard load → **Light mode** (matches system) ✅
4. Toggle to dark → **Dark mode** (saved forever) ✅

### Scenario 2: Returning User, Changed System
1. User logged in with dark mode preference
2. User changes Mac to light mode
3. App stays **dark** (respects manual choice) ✅

### Scenario 3: Auto-Follow System
1. New user with dark system → Dashboard loads **dark** ✅
2. User switches Mac to light mode → Dashboard auto-switches to **light** ✅
3. User manually toggles to dark → Now **locked to dark** ✅
4. User switches Mac back to dark → Stays **dark** (locked) ✅

---

## Testing Checklist

### Light System (Mac/iOS)
- [ ] Homepage loads light
- [ ] Sign up → Welcome flow is light
- [ ] First dashboard load is light
- [ ] Input text is black (readable)

### Dark System
- [ ] Homepage loads light (marketing always light)
- [ ] Sign up → Welcome flow is light
- [ ] First dashboard load is **dark** (matches system)
- [ ] Toggle to light works

### System Theme Change (Logged In)
- [ ] New user: Dashboard auto-switches with system
- [ ] After manual toggle: Dashboard ignores system changes

---

## localStorage Keys

| Key | Purpose | Example |
|-----|---------|---------|
| `tradzen-theme` | Current theme | `"light"` or `"dark"` |
| `tradzen-theme-manual` | User manually toggled? | `"true"` or not set |

---

## Why This Matters

**Apple's approach creates trust:**
- New users feel immediately comfortable (familiar theme)
- Marketing pages look professional (light mode)
- Power users have control (manual override)
- System integration feels seamless (auto-follow)

**Before:** Everyone got dark mode on first visit (jarring if system is light)  
**After:** Perfect system integration, just like a native Apple app

---

*Last updated: October 11, 2025*
*Built with the Apple team's design philosophy in mind*

