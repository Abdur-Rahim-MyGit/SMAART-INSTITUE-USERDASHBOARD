# SMAART Mobile — UI & UX plan

_Drafted 2026-08-24. Scope: `mobile-app/` only. Nothing in `front-end/` or the admin
panel changes as a result of this document._

The app works. Every phase in the roadmap is now wired, assessments are proctored,
and the data layer is honest. What it does not have is a **design system** — and
the absence shows up as 57 screens that each re-decided what a card looks like.

This is the plan to fix that without a rewrite.

---

## 1. What the audit actually found

These are counted, not estimated. Commands are in §8 so anyone can re-run them.

| Measure | Today | What it should be |
|---|---|---|
| Distinct hex colours hardcoded in screens | **90** | ~14, all from the theme |
| Distinct `borderRadius` values | **21** | 4 (`8 / 12 / 16 / 999`) |
| Distinct `fontSize` values | **20+** (incl. 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5) | 7 named steps |
| Files using `accessibilityLabel` | **2 of 57** | every interactive element |
| Files using `accessibilityRole` | **0** | every button, tab, header |
| Files using haptics | **0** | every commit, every error |
| Files honouring `useSafeAreaInsets` | **0** (29 use `SafeAreaView`) | the floating tab bar needs insets |
| Theme choice persisted across launches | **No** — `useState` in `ThemeContext.js` | persisted |

The largest screens are `LearningScreen.js` at **3,113 lines**, `HomeScreen.js` at
**1,768**, `CareerScreen.js` at **1,120**. A 3,000-line screen is not a styling
problem, it is a components problem: the same card has been written five times
because there was no card to import.

### 1.1 The three consequences a student can feel

1. **Nothing looks like the same app twice.** `#EFF6FF` appears 21 times, `#E2E8F0`
   13 times and `#F1F5F9` 8 times — three near-identical greys doing one job. Text
   sizes 12, 12.5 and 13 all appear on the same screens. It reads as slightly
   unfinished everywhere, and nobody can point at why.
2. **Dark mode is a coin flip.** With 90 literal hexes bypassing the theme, dark
   mode is only correct where somebody remembered. And the choice resets on every
   cold start, because the theme lives in `useState` with no storage.
3. **The app is unusable with a screen reader** and gives no tactile feedback. Zero
   `accessibilityRole` means every button announces as plain text.

### 1.2 What is already right — do not touch it

The floating capsule tab bar, the blue/white restraint, `SkeletonBox` loading in 16
files, `RefreshControl` in 13, the guarded-require pattern for native modules, and
the proctoring status chip vocabulary. The system below codifies these, it does not
replace them.

---

## 2. The design system to build

One new folder, `src/design/`, and nothing else moves on day one.

```
src/design/
  tokens.js        colour, spacing, radius, type, elevation, motion
  Text.js          <Text variant="title|section|cardTitle|body|meta|number">
  Card.js          surface, radius 16, 1px border, soft shadow, pressable variant
  Button.js        primary | secondary | ghost | destructive · 48px · haptic on press
  Chip.js          filter | status | value · 999 radius · 44px hit target
  Row.js           label + value preview + chevron — the detail-row primitive
  Stat.js          the 4-up tile used on Home, Profile, Career
  Progress.js      Bar and Ring, one implementation
  Sheet.js         bottom sheet with a drag handle and keyboard avoidance
  Banner.js        info | warning | offline | error-with-retry
  EmptyState.js    icon + sentence + one action
  Skeleton.js      promote the existing SkeletonBox here
```

### 2.1 Tokens — extend `ThemeContext.js`, keep the existing keys

The current colour keys stay exactly as they are so no screen breaks. Add:

```js
export const radius  = { sm: 8, md: 12, lg: 16, pill: 999 };
export const space   = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const type = {
  title:     { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  section:   { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  body:      { fontSize: 13, lineHeight: 19 },
  meta:      { fontSize: 11.5 },
  number:    { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
};
export const elevation = { card: { shadowColor: '#0F1B2E', shadowOpacity: 0.05,
  shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 } };
export const TAB_BAR_CLEARANCE = 96; // every scroll needs this as bottom padding
```

Seven type steps replace twenty. The half-pixel sizes (8.5, 9.5, 10.5, 13.5, 14.5)
all collapse into the nearest step — none of them was a decision, they were drift.

### 2.2 Two fixes to the theme itself

- **Persist it.** `AsyncStorage` read on mount, write on toggle, fall back to
  `useColorScheme()`. Three lines, and it stops the app forgetting the user.
- **Add a `system` option** so "follow my phone" is a real choice, not the default
  the user cannot get back to.

### 2.3 The rules the system enforces

1. **One primary filled button per screen.** Everything else is a row, chip or
   outlined control. If two things are filled blue, neither is primary.
2. **Rows show values, not labels.** `Chennai, Tamil Nadu · 600042`, never
   `City / State → Not completed`. Recognition over recall.
3. **Quantify the gap.** `+12% profile strength`, `2 lessons to unlock Stage 2`. A
   vague chore becomes a ninety-second decision.
4. **Colour carries meaning only.** Status, progress, one action. Decorative
   gradient blobs (`#EC4899` at 5% opacity on Profile) come out.
5. **44px minimum hit target**, measured, not eyeballed.
6. **Loading is a skeleton, never a spinner on a blank screen.** Errors are inline
   with a retry. Offline shows cached content plus a banner.
7. **Destructive looks destructive and confirms.**
8. **Every interactive element gets `accessibilityRole` and `accessibilityLabel`.**
   This is a lint rule, not a good intention.

---

## 3. Screen-by-screen

Priority order is by how many students touch the screen per day.

### P0 — Home
The hub, and the screen most in need of an edit. Today it opens on module chips.
It should open on **"Continue where you left off"**: current course, module name,
thin progress bar, one Continue button. Below it four stat tiles, then a horizontal
**Today** strip (next live class with IST time, next assessment deadline, one coach
nudge), then the module grid. Bell shows the real unread count — already fixed.
1,768 lines becomes roughly 400 once the cards are primitives.

### P0 — Learning
3,113 lines, and the largest single win. Split into `LearningScreen` (composition),
`StageCard`, `TrackCard`, `CourseDetail`, `LessonPlayer`, `QuizPane`. Lock states
must state their unlock condition in words — "Finish 2 more modules in Stage 1" —
never a bare padlock. Resume card pinned at the top.

### P0 — Assessment pre-flight and player
Pre-flight is a trust screen: plain language on what the camera does *and does not*
do, a device checklist (camera · microphone · network · face registered) with live
ticks and a fix action beside each failure, and a Start button disabled until all
four pass. The player needs a calm timer, a visible but unobtrusive proctoring
chip, the pending-upload indicator from `answerQueue.js`, and the amber warning and
blocking-pause states already built — restyled to the system.

### P1 — Result and quotient breakdown
`QuotientBreakdown.js` already computes the seven bars and five bands. Give it a
score hero above it and one line of *what to do next* per weak quotient, linking
straight back into Learning. This is where the loop closes.

### P1 — Profile
The full redesign is specified and prototyped already (see `canvas.json` in the
design scratch, and §1 of that critique): identity band with a strength ring, one
"Complete your profile" button, rows previewing real values with `+n%` chips on the
gaps, achievements, account, separated red Sign out. No tabs. **This is designed
but not yet built in code** — it is the first ticket of Phase 3 below.

### P1 — Career
Employability ring, skills-vault chips with proficiency, job matches with a match
percentage, coach entry card. Straight port to the primitives.

### P2 — Community, Notifications, Support, Settings
Already close to the house style. They need the primitives and the accessibility
pass, not a redesign.

---

## 4. Delivery plan

Six phases. Each ships independently and leaves the app releasable.

| Phase | Work | Size |
|---|---|---|
| **1 · Foundation** | `src/design/` tokens + 12 primitives, theme persistence, `system` theme option, Storybook-style gallery screen behind a dev flag | 3 days |
| **2 · Migrate P0** | Home, Learning (split into 6 files), pre-flight, player — onto the primitives. Delete the dead hexes as they are replaced | 5 days |
| **3 · Profile rebuild** | Build the already-designed Profile screen, edit sheets, strength calculation, optimistic save with revert | 2 days |
| **4 · Result loop** | Score hero + next-action lines on the quotient breakdown, deep links back into Learning | 1 day |
| **5 · Accessibility & feel** | Roles and labels everywhere, dynamic-type support, haptics on commit and error, reduce-motion respect, `useSafeAreaInsets` for the floating tab bar | 3 days |
| **6 · Guardrails** | ESLint rule banning raw hex in `screens/`, a token-drift test, a 44px hit-target check | 1 day |

Fifteen working days. Phase 6 is what stops the 90 hexes coming back.

---

## 5. Definition of done

A screen is migrated when all of these hold:

- No hex literal in the file — every colour resolves from the theme.
- Every radius, spacing and font size comes from a token.
- Loading is a skeleton; error is inline with retry; empty is a sentence plus one
  action.
- Every interactive element has a role, a label and a >=44px target.
- The screen is correct in light **and** dark, checked side by side.
- Bottom padding clears the floating tab bar (`TAB_BAR_CLEARANCE`).
- It reads correctly at the largest system font size.

---

## 6. What is deliberately not in this plan

- **No new navigation model.** Five tabs, floating capsule — it works, and changing
  it would relearn every student's muscle memory for nothing.
- **No brand change.** Blue and white stay.
- **No component library dependency.** Twelve primitives are cheaper to own than a
  library that fights Expo on upgrade.
- **No animation framework.** The six `Animated.timing` uses are enough; motion
  should be almost invisible.

---

## 7. Design source

The hi-fi screens and the journey flowchart live in UX Pilot, workstream
**SMAART Institute — Mobile App**, page **SMAART Mobile - Core Flows**. The
generation prompt there carries this exact token set, so what comes out is
buildable against `ThemeContext.js` rather than a mood board.

The Profile redesign additionally has a tappable prototype and a written critique
of the current screen, produced earlier in this work.

---

## 8. Re-run the audit

```bash
cd mobile-app/src
grep -roh "#[0-9A-Fa-f]\{6\}" screens components | sort -u | wc -l          # distinct colours
grep -roh "borderRadius: [0-9]*" screens components | sort -u | wc -l       # distinct radii
grep -roh "fontSize: [0-9.]*"  screens components | sort -u | wc -l         # distinct sizes
grep -rl accessibilityRole screens components | wc -l                       # a11y coverage
wc -l screens/*/*.js components/*.js | sort -rn | head                      # screen sizes
```

Every number in §1 came from those five lines. They are also the phase-6 regression
check: after the migration, the first three should fall and the fourth should rise
to 57.
