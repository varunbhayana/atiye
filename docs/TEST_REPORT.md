# Test Execution Report

**Run on:** 14 Oct 2026 · macOS 26.4.1 (Apple Silicon) · Google Chrome 155.0.8059.40 · Node 26.0.0
**Command:** `npm run verify` (typecheck → lint → unit/integration → build → E2E)

| Stage | Result |
|---|---|
| TypeScript (strict, `noUncheckedIndexedAccess`) | ✅ 0 errors |
| ESLint (incl. react-hooks) | ✅ 0 problems |
| Vitest unit and integration | ✅ **239 / 239 passed** |
| Production build (single file, CSP `connect-src 'none'`) | ✅ `dist/index.html` 583 KB (199 KB gzip) |
| Playwright E2E in Google Chrome over `file://` | ✅ **35 / 35 passed** |
| Flakiness check (`--repeat-each=3`) | ✅ **105 / 105 passed** |
| `.app` packaging (`npm run package:mac`) | ✅ `.app`, `.zip` and `.dmg` built; icon rendered; ad-hoc signed; `plutil` OK |
| Real launch of `Maths Adventure.app` | ✅ files installed to Application Support; Chrome started with the dedicated profile; a second launch reused the same Chrome instance |

## Unit and integration tests (Vitest)

| File | Tests | What it proves |
|---|---|---|
| `arithmetic.test.ts` | 4 | **Exhaustive** checks over all inputs: all 231 addition pairs with a+b ≤ 20 and all 231 subtraction pairs with 0 ≤ b ≤ a ≤ 20. Each correct answer is accepted and every wrong value from 0 to 22 is rejected; negatives are rejected; before/after/between for 1–49 |
| `generators.test.ts` | 160 | 250 seeded questions for every topic × level × activity (about 37,000), all validated: unique options, exactly one correct. Also covers determinism, difficulty limits, creature counts matching numbers, train rules and ordering, pattern uniqueness, tower comparisons, repeat avoidance, no motion in tests, and a property test for options |
| `validator.test.ts` | 11 | The validator catches deliberately broken questions on its own: wrong picture count, duplicate or missing options, broken sequences, ambiguous patterns or shapes, ties, level overflow, overspending, the frog leaving the line, equal towers |
| `game-logic.test.ts` | 9 | Drag/drop and tap state machines: no double counting (including a property test with random feed/remove sequences), removals update quantities, pizza topping counts and slot reuse, train tile uniqueness, frog jump bounds, counting taps |
| `attempt.test.ts` | 7 | Outcomes first, hint, retry, incorrect and skipped; repeated clicks are ignored after resolution; in test mode the first answer is final and there are no hints |
| `assessment.test.ts` | 5 | Deterministic quiz generation, duplicate submission handling, deterministic scoring with topic breakdown, finished quizzes are immutable |
| `adaptive.test.ts` | 9 | No level-up from one lucky answer; up and down rules with reasons; retries don't count as mastery; the age cap and advanced switch; auto-adapt off; tests never change level; struggling detection |
| `scheduler.test.ts` | 5 | No back-to-back repeats of the same game (200 seeds × 4 topic mixes); balance; concrete activities for struggling topics; journey and treasure-hunt structure |
| `storage.test.ts` | 9 | Save/load round-trip (reopening); corrupted JSON recovers from the previous copy and quarantines the bad data; unrecoverable data resets without crashing; field-level repair; storage-full trimming; backup export/import; CSV escaping |
| `progress.test.ts` | 11 | Idempotent recording, stars for effort, achievements, fixed-order stickers, zone and treasure tallies, reset; dashboard aggregation (first-try rate not inflated, tests kept separate, mistakes, recommendations); age/class support honesty |
| `hinglish.test.ts` | 3 | Every activity and level has complete Hinglish question, voice and hint text; English text is unchanged |
| `components.test.tsx` | 6 | Real React components: Feed the Monster (no double feed, give-back, submit), Pizza (wrong pizza blocked with a friendly note, removal, total), Count (no double count), QuestionHost (a rapid double submit is reported once; wrong → hint → retry outcome), and the App re-opening with a saved profile |

## End-to-end tests (Playwright, real Chrome, packaged `file://` build)

**Every game played through the UI.** Each of the following was played for 3 rounds with correct answers, then the summary and sticker were checked:

- Count the Animals
- Feed the Monster
- Balloon Pop
- Number Train
- Treasure Chest
- Pizza Maths
- Shape Detective
- Catch the Number
- Pattern Puzzle
- Toy Shop
- Frog Jumps
- Block Towers (build and compare)
- Look & Choose (comparison, measurement, reasoning)

For each question, the test computes the answer independently from the question data and answers through the real UI.

**Child journeys**
- Onboarding → Maths → Island → zone mission
- Treasure Hunt: 5 stops with 5 different games, ending in the treasure chest and the badge
- An interactive Learn lesson, including replay
- Today's Journey, start to finish
- Hinglish mode

**Quiz**
- A 10-question quiz with 3 deliberately wrong answers: no hints or feedback during the quiz, exact score shown (7/10, 70%), and the parent review lists all 10 answers.
- A quiz refreshed mid-way resumes at the same question.

**Feedback and robustness**
- Wrong answers → hint → correct, and the answer is revealed after 3 tries.
- Rapid double-clicks earn exactly one star.
- Drag & drop: a failed drop changes nothing; a real drop feeds the monster once; removing it works; a tile dragged onto a train carriage lands correctly.

**Parent area**
- Wrong answer on the grown-up check is rejected; the right answer unlocks it.
- The Overview counts are exact (3 answered, 67% right first time, 1 retry).
- Topics and Mistakes tabs show the play.
- Switching the language works.

**Platform**
- Close and reopen with a persistent Chrome profile: profile, stars and sticker are kept.
- **Offline:** network disabled, and zero network requests made.
- Keyboard-only play (Tab + Enter).
- A small 900×600 window works, with no horizontal scroll.
- Reduced motion (OS setting) is respected, and Catch the Number can be paused.
- Corrupted saved data recovers.
- A second window is detected and can take over.

## Not automatically tested (verified manually or by design)

- **Spoken voice quality.** Speech synthesis can't be asserted headlessly. Voice availability is detected at runtime, and the app falls back to on-screen text.
- **Launcher "Chrome missing" dialog.** It needs a Mac without Chrome. The code path is a plain AppleScript dialog that offers Safari.
- **Gatekeeper on a second Mac.** The app is ad-hoc signed, not notarised (that needs a paid Apple Developer ID). See TROUBLESHOOTING for the one-time right-click → Open.
