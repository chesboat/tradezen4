# Product TODO

Goal: a simple, delightful trading journal people want to use every day.

## Now
- [ ] Bold Daily Start (Dashboard)
  - [ ] Start Session panel with:
    - [ ] Pre‑market checklist (3 items, persistent per day)
    - [ ] Focus Mode toggle (existing)
    - [ ] Guardrails (existing: max trades, lockout timer, risk used)
    - [ ] Start/End Session flow with end summary modal

## Next
- [ ] Zero‑friction capture
  - [ ] Global quick‑add bar (Cmd/Ctrl+K) for Trade/Note/Tag
  - [ ] Floating + opens same bar from any view

- [ ] Smarter, smaller AI plan
  - [ ] Default to 2 micro‑quests, “More ideas” drawer
  - [ ] Persist automatically; “Next best action” button on Dashboard

- [ ] Session rules engine (simple)
  - [ ] Account‑level rules (max trades, risk cap, cutoff time)
  - [ ] Soft enforcement (nudge + optional lockout)

- [ ] Firestore: Tasks permissions
  - [ ] Update `firestore.rules` for user‑scoped read/write on tasks
  - [ ] Verify indexes and initialize on first load gracefully

- [ ] Reflection 2.0 “Done in 3” preset
  - [ ] Three micro prompts + single Complete → XP
  - [ ] Session end nudge if incomplete

- [ ] Quests polish
  - [ ] No page jumps; deterministic filters
  - [ ] Cap daily active quests to 2; others in “Someday”

- [ ] Performance & delight
  - [ ] 150ms interactions, no layout shift
  - [ ] Keyboard shortcuts and micro‑celebrations
  - [ ] PWA install + daily reminder

## Done
- [x] Dashboard 2.0 coaching surface (Daily Focus, Guardrails, Focus Mode)
- [x] AI plan persistence and selection (apply selected quests)
- [x] Quests white‑space fixes (reduced jumps)
- [x] Edge Score explanation modal (metrics, formulas, scoring ranges)


## Zella‑style analytics roadmap

- [ ] Recent Trades tile (Dashboard)
  - [x] Compact list (last 10–20) with symbol, side, R, P&L, tags
  - [x] Scratch indicator (⊖) with tooltip
  - [x] "View all" → opens Trades with filters pre‑applied

- [ ] Net Daily P&L tile
  - [x] 30–90 day area chart with tooltips
  - [x] Toggle: daily vs cumulative
  - [ ] Weekly markers / separators

- [ ] Edge Score (0–100)
  - [x] Utility to compute composite score (win rate excl scratches, profit factor, avg R, consistency, max DD discipline, execution discipline, tag balance)
  - [x] Dashboard tile: unique petal chart + breakdown
  - [ ] Settings to tune weights

- [ ] Customizable tiles (Dashboard)
  - [ ] Drag to rearrange (persist layout per account)
  - [ ] Add/remove tiles drawer
  - [ ] Presets: Minimal, Performance, Discipline, Research

- [ ] Global trade filters
  - [ ] `useGlobalFilterStore` (date range, account/group, symbols, result, tags)
  - [ ] Top filter bar shared by Dashboard / Trades / Analytics
  - [ ] All metrics/components respect filters

- [ ] UX polish
  - [ ] Empty states & loading skeletons for tiles
  - [ ] Keyboard shortcuts for filter focus and tile presets

### Already shipped related work
- [x] Scratch indicator in TradesView (⊖ with tooltip; excluded from win rate)
- [x] Scratch indicator in Analytics → Recent Trades table (⊖ with tooltip)
- [x] Scratch indicator in Day Detail modal (⊖ with tooltip)
- [x] Improved scratch detection (hybrid band: max(8% of risk, $15))
- [x] Fixed journal date filtering (local‑timezone day ranges)
- [ ] Settings UI for classification + reflection completion thresholds (pending)


