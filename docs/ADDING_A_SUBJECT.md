# Adding a new subject (e.g. English)

The core (`src/core`) knows nothing about Maths. A subject plugs in by implementing `SubjectModule` from `src/core/types.ts`.

1. **Create** `src/subjects/english/` with:
   - `types.ts`: a discriminated union of question schemas, one per activity `kind`, each extending `QuestionBase`.
   - `curriculum.ts`: `TopicDef[]` (id, name, emoji, five level descriptions), difficulty limits, and a topic→activity table.
   - `generators.ts`: pure functions of `(topic, level, rng, mode)`. Use the provided `Rng` only, never `Math.random`.
   - `validate.ts`: an **independent** validator that returns a list of problems.
   - `answers.ts`: `expectedResponse`, `checkAnswer`, and `describeAnswer` / `describeResponse` for the parent review.
   - `index.ts`: export a `SubjectModule`. Copy the generate → validate → retry loop from `subjects/maths/index.ts`.
2. **Register** it in `src/subjects/registry.ts`: set `status: 'available'` and `module: englishSubject`.
3. **Add renderers**: one React component per activity kind, taking `GameProps`. Register them in `src/games/registry.tsx`. Games must call `onSubmit(response)` with a standard `AnswerResponse` and must not decide correctness themselves.
4. **Add screens**: add a route in `src/app/App.tsx` (for example `/english` → a hub, like `screens/Island.tsx`). Practice, Journey, Quiz, adaptive learning, rewards, storage and the dashboard aggregations are already keyed by `subject`. Generalise the `'maths'` literals in those screens to the subject id.
5. **Seed levels**: pass `{ english: [...topicIds] }` to `createProfile`. For existing profiles, `topicLevel()` falls back to level 1.
6. **Test**: copy `tests/unit/generators.test.ts`. Generate large seeded batches for every topic × level × activity and assert the validator returns `[]`.

Adding a new **Maths** activity works the same way:
- add its schema to `subjects/maths/types.ts`
- add a generator, validator branch and `expectedResponse` branch
- add it to `TOPIC_KINDS`
- register a component in `games/registry.tsx`
- add a case to the E2E helper `play()`
