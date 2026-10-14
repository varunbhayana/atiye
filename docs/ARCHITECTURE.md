# Architecture

```
src/
  core/                 subject-agnostic engine (no React, no Maths)
    types.ts            Mode, Outcome, Level, AnswerResponse, QuestionBase, SubjectModule
    rng.ts              seeded PRNG (mulberry32): every question is reproducible
    state.ts            persistent data model, profiles, age/class support, initial levels
    storage.ts          localStorage persistence: validation/repair, previous-copy recovery, backup/restore, CSV
    attempt.ts          single-question lifecycle reducer (first / hint / retry / incorrect / skipped)
    adaptive.ts         explainable difficulty rules (rolling window, per topic, per level)
    scheduler.ts        activity rotation (no back-to-back repeats, balance, concrete-first when struggling)
    assessment.ts       quiz engine (fixed questions, first answer counts, deterministic scoring)
    progress.ts         record attempts/sessions, stars, stickers, achievements (idempotent)
    achievements.ts     badges, sticker album (fixed order), island friends
    analytics.ts        dashboard aggregation (first-try mastery, mistakes, trends, recommendations)
  subjects/
    registry.ts         subject list (Maths available; others "coming soon")
    maths/
      types.ts          strongly-typed question schema per activity (discriminated union)
      curriculum.ts     topics, level descriptions, LIMITS (difficulty boundaries), topic→activity table
      catalog.ts        creatures, foods, tokens, scenes…
      generators.ts     deterministic generators (topic, level, rng, mode) → question
      validate.ts       INDEPENDENT validator (recomputes answers; checks visuals, uniqueness, limits)
      answers.ts        expected answers + answer checking + human descriptions
      hints.ts / hinglish.ts   hint text; Hinglish wording for questions and hints
      index.ts          the Maths SubjectModule (generate → validate → retry)
  games/                React renderers, one per activity kind, plus pure state machines (logic.ts)
  components/           QuestionHost (shared question UX), Draggable (pointer DnD + tap), ParentGate, TopBar…
  screens/              Welcome, ProfileSetup, Home, Island, Zone, Learn, Practice/SessionRunner,
                        Journey, TreasureHunt, Quiz, StickerBook, ParentDashboard
  app/                  store (persistence + multi-window), hash router, sound (Web Audio), speech, i18n
  art/                  SVG mascot (Ollie the owl), monster, train, chest, frog, pizza…
macos-launcher/         launcher script, Info.plist, icon, build script
tests/unit              Vitest (engine, invariants, components)
tests/e2e               Playwright (real Chrome, file:// build)
```

## Key design decisions

**Maths correctness is separated from the UI.**
- Games never decide if an answer is right. Each game emits a standard `AnswerResponse` (`number`, `choice`, `set`, `sequence` or `pizza`).
- `checkAnswer` compares it with `expectedResponse(question)`, which is recomputed from primary data (operands, counts, rules), never from animation or UI state.
- Every generated question passes `validateMathsQuestion` before a child sees it. If it fails, the generator retries.
- The validator is written separately from the generators. It checks:
  - unique options, with exactly one correct
  - creature count equals the numbers, with no overlapping sprites
  - sequences follow their rule, and two neighbouring carriages are visible
  - patterns show two full repeats and have a minimal period equal to the unit
  - shapes have unambiguous geometry
  - no negative subtraction, and level limits are respected

**Exactly-once recording.**
- `attemptReducer` resolves a question once; later clicks are ignored.
- `recordAttempt` is idempotent by attempt id.
- `commitAnswer` keeps the first committed quiz answer.

**Outcomes are kept honest.**
- Each attempt is recorded as `first`, `hint`, `retry`, `incorrect` or `skipped`.
- Mastery and adaptive decisions use first-try success only.
- Quizzes and Learn mode never change levels.

**Adaptive difficulty** (`core/adaptive.ts`):
- It looks only at practice-type attempts at the current level since the last change.
- Standard rules: up after ≥6 answers with ≥80% first-try; down after 5 answers with ≤40%.
- Gentle and Challenge preferences change these thresholds.
- Levels are capped at 3 (the age-5 curriculum) unless a parent enables advanced levels.
- If recent answers are mostly not first-try, the scheduler prefers concrete, hands-on activities.
- Every change is stored with a human-readable reason.

**Persistence**:
- Storage is `localStorage` in the dedicated Chrome profile.
- Writes are synchronous after each change.
- The previous good copy is kept as `…v1.previous`.
- Unreadable data is quarantined and the app recovers.
- Older windows adopt newer state through `storage` events.
- A `BroadcastChannel` handshake lets one window be active at a time.

**Offline and safe**:
- Single-file build with a strict CSP (`connect-src 'none'`).
- Fonts are bundled (Fredoka); art is SVG or system emoji.
- Speech uses only on-device (`localService`) voices.
- Sounds are synthesised with Web Audio after the first click.

**Accessibility**:
- Large targets.
- Every drag has a tap/click alternative, and every draggable is a button (Enter/Space).
- Focus rings are visible.
- Reduced motion follows the OS or a parent setting.
- No flashing, and no timers in any graded activity.
- In quizzes, moving activities are always static.
