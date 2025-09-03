# 🚀 TradZen - Modern Trading Journal

A complete, modern trading journal application built with React, TypeScript, TailwindCSS, and Framer Motion. Inspired by sleek dashboards like Linear and Notion, TradZen provides traders with an intuitive way to track their trading performance, manage quests, and maintain emotional wellness.

## ✨ Features

### 🎯 Core Functionality
- **📊 Dashboard**: Real-time P&L tracking, win rate, expectancy, and performance metrics
- **📈 Trade Logging**: Quick trade entry with symbol autocomplete, R/R ratios, and mood tracking
- **📝 Quick Notes**: Instant note-taking with tagging and mood association
- **🏆 Gamified Quests**: Daily, weekly, and achievement-based challenges with XP rewards
- **🧘 Wellness Tracking**: Breathing exercises, mood tracking, and tilt detection
- **📅 Calendar View**: Monthly overview with daily P&L, trade counts, and mood indicators

### 🎨 UI/UX Features
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **🌊 Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **🎭 Collapsible Sidebars**: Left navigation and right activity log with persistent state
- **🌙 Dark Theme**: Professional dark mode with beautiful gradients and glows
- **🔍 Smart Search**: Semantic search across trades, notes, and data
- **💾 Persistent Storage**: Local storage with smart state management

### 🧠 Smart Features
- **🤖 AI Insights**: GPT-4o integration for daily summaries and pattern recognition
- **🎯 Tilt Detection**: Emotional trading alerts with wellness suggestions
- **📊 Advanced Analytics**: Performance patterns, risk analysis, and trend identification
- **🔗 Multi-Account Support**: Track multiple trading accounts with unified filtering

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS with custom design tokens
- **Animations**: Framer Motion
- **State Management**: Zustand with localStorage persistence
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 7+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tradzen-journal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
npm run preview
```

### Deployment

This project is configured for deployment on Vercel with Firebase integration.

#### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore in your project
3. Get your Firebase configuration from Project Settings > General
4. Add the configuration to your `.env` file

#### Vercel Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Create a new project on [Vercel](https://vercel.com)
3. Import your repository
4. Add the following environment variables in Vercel:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_OPENAI_API_KEY` (optional)
5. Deploy!

### Discipline Mode (Bullet Counter)

Optional, OFF by default. When enabled: morning max‑trades check‑in, 1‑tap “+ Trade” that decrements bullets, a visible “Trades Left” pill, end‑of‑day honesty prompt, and an override path (requires typed reason ≥30 chars). Every filled trade burns 1 bullet.

Data model (Firestore):
- `users/{uid}`: `email`, `timezone` (default `America/New_York`), `xp:number`, `streak:number`, `settings.disciplineMode { enabled:boolean, defaultMax?:number }`, timestamps
- `users/{uid}/days/{YYYY-MM-DD}`: `maxTrades`, `usedTrades`, `status: "open"|"completed"|"skipped"|"broken"`, `respectedLimit?`, `lateLogging`, `checkInAt?`, `eodCompletedAt?`, `overrideReason?`, timestamps
- `users/{uid}/days/{YYYY-MM-DD}/trades/{autoId}`: `{ placeholder:true }`

Rules (owner‑only): see `firestore.rules` days/trades subtree.

Client ops (transactions only):
- `setDisciplineMode({ uid, enabled, defaultMax? })`
- `checkInDay({ uid, tz, maxTrades })`
- `quickLogTrade({ uid, tz })` → throws `{ code:"MAX_REACHED" }` when capped
- `overrideDay({ uid, tz, reason })` → sets day `broken`, `streak=0`, `xp-=5`
- `submitEOD({ uid, tz, actualCount, respected })` → late logging `xp-=2`; if respected and not broken: `status=completed`, `respectedLimit=true`, `streak+=1`, `xp+=10`

UI entry points:
- Settings: `DisciplineModeToggle`
- Dashboard OFF: minimal `+ Trade` and `EODPromptOff`
- Dashboard ON: `CheckInCard`, `TradesLeftWidget`, `QuickLogButton` (L or Ctrl+Shift+T), `OverrideModal`, `EndOfDayModalOn`
- Weekly: `WeeklyReviewCard` color‑codes ON days (green/yellow/red) and shows neutral gray for OFF days

Enable flow:
1) Settings → enable Discipline Mode; set default bullets (1–10)
2) On dashboard, check in your bullets for today
3) Log trades with one tap; the pill shows bullets left; overriding is allowed but noted

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── Sidebar.tsx      # Collapsible navigation
│   ├── ActivityLog.tsx  # Activity feed
│   ├── Dashboard.tsx    # Main dashboard
│   └── ...
├── store/               # Zustand stores
│   ├── useSidebarStore.ts
│   ├── useActivityLogStore.ts
│   ├── useAccountFilterStore.ts
│   └── useQuestStore.ts
├── types/               # TypeScript types
│   └── index.ts
├── lib/                 # Utility functions
│   ├── utils.ts
│   ├── localStorageUtils.ts
│   └── GPTSummaryPrompt.ts
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#0ea5e9 to #0284c7)
- **Success**: Green (#22c55e)
- **Danger**: Red (#ef4444)
- **Warning**: Orange (#f59e0b)
- **Dark**: Custom dark palette (950 to 50)

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 100-900 available
- **Sizes**: Responsive scale with TailwindCSS

### Animations
- **Sidebar**: Smooth width transitions with content fade
- **Cards**: Hover scale and glow effects
- **Buttons**: Tap and hover feedback
- **Loading**: Elegant spinners and skeleton states

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet**: Adapted layouts for medium screens
- **Desktop**: Full-featured experience with sidebars
- **Large Screens**: Utilizes extra space efficiently

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# OpenAI Configuration (Optional)
# Get your API key from: https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Note:** 
- AI features will work with mock data if no OpenAI API key is provided
- Firebase configuration is required for authentication and data storage
- Get your Firebase configuration from the Firebase Console after creating a project

### Customization
- **Colors**: Update `tailwind.config.js` color palette
- **Fonts**: Modify font imports in `index.html`
- **Breakpoints**: Adjust responsive breakpoints in Tailwind config

## 🚦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues

## 📊 Key Components

### Sidebar
- **Collapsible**: Smooth expand/collapse with localStorage persistence
- **Navigation**: Icon-based navigation with tooltips in collapsed state
- **Account Filter**: Dropdown to switch between trading accounts
- **Search**: Global search functionality
- **Quick Actions**: Fast access to common operations

### Activity Log
- **Real-time Feed**: Live updates of all trading activities
- **Filtering**: Filter by activity type (trades, notes, quests, etc.)
- **Infinite Scroll**: Loads more activities as you scroll
- **Collapsible**: Slides in/out from the right side

### Dashboard
- **KPI Cards**: Real-time performance metrics
- **Pinned Quests**: Gamified challenges with progress tracking
- **AI Insights**: GPT-4o powered trading insights
- **Floating Actions**: Quick access to add trades and notes

## 🎯 Zustand Stores

### Sidebar Store
```typescript
interface SidebarState {
  isExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
}
```

### Activity Log Store
```typescript
interface ActivityLogState {
  isExpanded: boolean;
  activities: ActivityLogEntry[];
  addActivity: (activity: ActivityLogEntry) => void;
  // ... more actions
}
```

### Account Filter Store
```typescript
interface AccountFilterState {
  selectedAccountId: string | null;
  accounts: TradingAccount[];
  setSelectedAccount: (accountId: string) => void;
  // ... more actions
}
```

## 🎮 Gamification Features

### Quest System
- **Daily Quests**: Reset every day with new challenges
- **Weekly Quests**: Longer-term goals
- **Achievements**: Milestone-based rewards
- **XP System**: Experience points for completing activities

### Wellness Integration
- **Mood Tracking**: Emotional state logging
- **Tilt Detection**: AI-powered emotional trading alerts
- **Breathing Exercises**: Guided wellness activities
- **Mindfulness Prompts**: Regular mental health check-ins

## 🔮 Future Enhancements

- **Mobile App**: React Native version
- **Social Features**: Share achievements and insights
- **Advanced Analytics**: Machine learning insights
- **Broker Integration**: Direct trade import
- **Cloud Sync**: Cross-device synchronization
- **Team Features**: Prop firm and team management

## 🧭 Dashboard 2.0 Roadmap

The main dashboard now focuses on coaching-first simplicity with powerful guardrails and AI. This section tracks what’s implemented and what’s next.

### What’s in (MVP)
- **Daily Focus strip**: Pulls today’s key objective from reflections; integrates AI summary and quick “Apply Plan” to pin quests.
- **Session Guardrails**: Trades today, minutes since last trade, risk used vs daily loss limit, and a one-tap 20m lockout.
- **Focus Mode**: Hide/blur P&L to avoid performance-chasing until session end.
- **Pattern Radar**: Highlights top 3 helpful and harmful tags from trades/notes with quick visibility.
- **Reflection Progress**: Today’s completion status and XP earned with a shortcut back to journaling.
- **XP/Level mini-widget**: Shows level label and progress to next level.

### Wire-up details
- AI helpers: `generateDailySummary`, `generateQuestSuggestions`
- Reflections: `useDailyReflectionStore.getKeyFocusForDate`, `upsertReflectionForSelection`
- Quests: `useQuestStore.addQuest`, `useQuestStore.pinQuest`, `cleanupPinnedQuests`
- Notes/Tags: `useQuickNoteStore.notes`
- Accounts: `useAccountFilterStore`, `getAccountIdsForSelection`
- Profile/XP: `getFormattedLevel`, `getXPProgressPercentage`

### Next iterations
- **Execution Score**: 0–100 rubric based on risk adherence, trade cap respect, and journaling completeness.
- **Time-of-Day Heatmap**: Micro heatmap row for win rate/P&L by hour/session.
- **Prop Firm Compliance tile**: Uses `TradingAccount` props (daily loss limit, max drawdown, target, min days) with traffic-light states and early warnings.
- **Next Best Action**: Context-aware suggested action (e.g., add note, breathwork, end session) based on live state.
- **Micro-celebrations**: Confetti/XPs on reflection completion and quest progress.

### File touchpoints
- `src/components/Dashboard.tsx`: new widgets and AI plan actions
- `src/store/useDailyReflectionStore.ts`: key focus and AI summary persistence
- `src/store/useQuestStore.ts`: quest add/pin and cleanup
- `src/store/useQuickNoteStore.ts`: tag sources for Pattern Radar
- `src/store/useUserProfileStore.ts`: XP/Level helpers

### Notes
- Focus Mode only hides P&L values in UI; analytics remain available in `AnalyticsView`.
- Guardrails lockout is a local UX timer. It does not block actions; it nudges behavior.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own trading journal!

## 🙏 Acknowledgments

- Inspired by Linear and Notion's clean design
- Icons by Lucide React
- Animations powered by Framer Motion
- Built with love for the trading community

---

**Happy Trading! 📈** 