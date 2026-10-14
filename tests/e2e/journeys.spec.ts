import { expect, test } from '@playwright/test';
import { createProfile, currentQuestion, play, unlockParent, url } from './helpers';

test.use({ reducedMotion: 'reduce' });

test('onboarding → choose Maths → island → zone mission (adventure)', async ({ page }) => {
  await page.goto(url('/'));
  await expect(page.getByTestId('start')).toBeVisible();
  await page.getByTestId('start').click();
  await page.getByTestId('name-input').fill('Atiye');
  await page.getByTestId('age-5').click();
  await page.getByTestId('class-ukg').click();
  await page.getByTestId('lang-en').click();
  await expect(page.getByTestId('support-info')).toContainText('fully supported');
  await page.getByTestId('create-profile').click();
  await expect(page.getByText('Hi Atiye!')).toBeVisible();
  await page.getByTestId('subject-english').click();
  await expect(page.getByText('Soon!')).toBeVisible();
  await page.getByTestId('subject-maths').click();
  await expect(page.getByTestId('island-map')).toBeVisible();
  await page.getByTestId('zone-counting').click();
  await page.getByTestId('zone-mission').click();
  let prev: string | undefined;
  for (let i = 0; i < 5; i++) {
    const q = await currentQuestion(page, prev);
    await play(page, q);
    await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'correct');
    await page.getByTestId('next').click();
    prev = q.id;
  }
  await expect(page.getByTestId('session-summary')).toBeVisible();
  await page.getByTestId('summary-done').click();
  await expect(page.getByTestId('zone-learn')).toBeVisible();
});

test('treasure hunt: 5 stops, then the treasure chest', async ({ page }) => {
  await createProfile(page);
  await page.goto(url('/maths/treasure', 21));
  await expect(page.getByTestId('treasure-map')).toBeVisible();
  let prev: string | undefined;
  const kinds = new Set<string>();
  for (let i = 0; i < 5; i++) {
    const q = await currentQuestion(page, prev);
    kinds.add(q.kind);
    await play(page, q);
    await page.getByTestId('next').click();
    prev = q.id;
  }
  expect(kinds.size).toBe(5);
  await expect(page.getByTestId('treasure-found')).toBeVisible();
  await page.goto(url('/stickers'));
  await expect(page.getByTestId('badge-treasure-finder')).toHaveAttribute('data-earned', 'true');
});

test('learn mode lesson (addition) is interactive and replayable', async ({ page }) => {
  await createProfile(page);
  await page.goto(url('/maths/learn/addition'));
  // step 1: count the first group, bring more, count all
  const objs = page.locator('[data-testid^="learn-obj-"]');
  const n1 = await objs.count();
  for (let i = 0; i < n1; i++) await objs.nth(i).click();
  await page.getByTestId('learn-action').click();
  const n2 = await objs.count();
  for (let i = n1; i < n2; i++) await objs.nth(i).click();
  await expect(page.getByTestId('learn-line')).toContainText('plus');
  await page.getByTestId('learn-next').click();
  // step 2: frog jumps
  while (await page.getByTestId('learn-action').count()) await page.getByTestId('learn-action').click();
  await expect(page.getByTestId('learn-line')).toContainText('landed');
  await page.getByTestId('learn-next').click();
  await expect(page.getByTestId('learn-done')).toBeVisible();
  await page.getByTestId('learn-replay').click();
  await expect(page.getByTestId('learn-line')).toBeVisible();
});

test('daily journey runs from welcome to celebration', async ({ page }) => {
  await createProfile(page);
  await page.goto(url('/maths/journey', 12));
  await page.getByTestId('journey-skip-lesson').click();
  let prev: string | undefined;
  for (let i = 0; i < 7; i++) {
    const q = await currentQuestion(page, prev);
    await play(page, q);
    await page.getByTestId('next').click();
    prev = q.id;
  }
  await expect(page.getByTestId('session-summary')).toBeVisible();
});

test('10-question quiz: no feedback during the quiz, exact scoring, review in the dashboard', async ({ page }) => {
  await createProfile(page);
  await page.goto(url('/maths/quiz', 31));
  await unlockParent(page);
  await page.getByTestId('quiz-all-topics').click();
  await page.getByTestId('quiz-level-2').click();
  await page.getByTestId('quiz-count-10').click();
  await page.getByTestId('quiz-start').click();
  await page.getByTestId('quiz-begin').click();
  let prev: string | undefined;
  let expectedCorrect = 0;
  for (let i = 0; i < 10; i++) {
    await expect(page.getByTestId('quiz-progress')).toHaveText(`Question ${i + 1} of 10`);
    const q = await currentQuestion(page, prev);
    const wrong = i % 3 === 1; // answer questions 2, 5, 8 wrongly
    await play(page, q, { mode: 'test', wrong });
    if (!wrong) expectedCorrect++;
    await expect(page.getByTestId('hint')).toHaveCount(0);
    await expect(page.getByTestId('feedback-text')).not.toHaveAttribute('data-state', 'correct');
    prev = q.id;
  }
  await page.getByTestId('quiz-submit').click();
  await expect(page.getByTestId('result-correct')).toHaveText(String(expectedCorrect));
  await expect(page.getByTestId('result-incorrect')).toHaveText(String(10 - expectedCorrect));
  await expect(page.getByTestId('result-score')).toHaveText(`${expectedCorrect * 10}%`);
  await page.getByTestId('result-done').click();
  await page.goto(url('/parent'));
  await unlockParent(page).catch(() => undefined);
  await page.getByTestId('tab-Quizzes').click();
  await expect(page.getByTestId('quiz-row-score')).toHaveText(`${expectedCorrect}/10 (${expectedCorrect * 10}%)`);
  await page.getByTestId('quiz-review-open').click();
  await expect(page.getByTestId('quiz-review').locator('li')).toHaveCount(10);
});

test('an unfinished quiz survives a browser refresh and resumes where it stopped', async ({ page }) => {
  await createProfile(page);
  await page.goto(url('/maths/quiz', 41));
  await unlockParent(page);
  await page.getByTestId('quiz-count-5').click();
  await page.getByTestId('quiz-start').click();
  await page.getByTestId('quiz-begin').click();
  const q1 = await currentQuestion(page);
  await play(page, q1, { mode: 'test' });
  await expect(page.getByTestId('quiz-progress')).toHaveText('Question 2 of 5');
  const q2 = await currentQuestion(page, q1.id);
  await page.reload();
  await expect(page.getByTestId('quiz-progress')).toHaveText('Question 2 of 5');
  const again = await currentQuestion(page);
  expect(again.id).toBe(q2.id);
});

test('parent dashboard shows genuine progress and requires the grown-up check', async ({ page }) => {
  await createProfile(page);
  await page.goto(url('/maths/play?topics=addition&kind=balloon&n=3&label=t', 51));
  let prev: string | undefined;
  for (let i = 0; i < 3; i++) {
    const q = await currentQuestion(page, prev);
    await play(page, q, { wrong: i === 1 });
    if (i === 1) await play(page, q);
    await page.getByTestId('next').click();
    prev = q.id;
  }
  await page.getByTestId('summary-done').click();
  await page.getByTestId('parent-button').click();
  await page.getByTestId('gate-input').fill('1');
  await page.getByTestId('gate-submit').click();
  await expect(page.getByText('That’s not right')).toBeVisible();
  await unlockParent(page);
  await expect(page.getByTestId('ov-attempts')).toHaveText('3');
  await expect(page.getByTestId('ov-first')).toHaveText('67%');
  await expect(page.getByTestId('outcome-retry')).toContainText('1');
  await page.getByTestId('tab-Topics').click();
  await expect(page.getByTestId('topic-row-addition')).toContainText('3');
  await page.getByTestId('tab-Mistakes').click();
  await expect(page.getByTestId('mistakes-tab')).toContainText('Balloon Pop');
  await page.getByTestId('tab-Settings').click();
  await page.getByTestId('set-language').selectOption('hinglish');
  await page.getByTestId('back').click();
  await page.goto(url('/maths/play?topics=counting&kind=count&n=1&label=t'));
  await expect(page.getByTestId('prompt')).toContainText(/kitne/);
});

test('Hinglish is the default language for a new child', async ({ page }) => {
  await page.goto(url('/setup'));
  await page.getByTestId('create-profile').click();
  await expect(page.getByText('Aaj kya seekhein?')).toBeVisible();
});

test('Hinglish mode speaks and shows Hinglish to the child', async ({ page }) => {
  await createProfile(page, 'Atiye', { hinglish: true });
  await expect(page.getByText('Aaj kya seekhein?')).toBeVisible();
  await page.goto(url('/maths/play?topics=addition&kind=balloon&n=1&label=t', 2));
  const q = await currentQuestion(page);
  await expect(page.getByTestId('prompt')).toHaveText('Sahi answer wala balloon phodo!');
  await play(page, q);
  await expect(page.getByTestId('feedback-text')).toHaveText(/Shabaash|badhiya|sahi|Kamaal|Super|star|Zabardast/);
});
