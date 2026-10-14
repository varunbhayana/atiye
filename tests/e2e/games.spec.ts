import { expect, test } from '@playwright/test';
import { createProfile, currentQuestion, play, stars, url } from './helpers';

test.use({ reducedMotion: 'reduce' });

const GAMES: [string, string][] = [
  ['count', 'counting'],
  ['feed', 'counting'],
  ['balloon', 'addition'],
  ['train', 'numbers'],
  ['treasure', 'numbers'],
  ['pizza', 'addition'],
  ['shapes', 'shapes'],
  ['catch', 'numbers'],
  ['pattern', 'patterns'],
  ['shop', 'subtraction'],
  ['numberline', 'addition'],
  ['tower', 'counting'],
  ['tower', 'comparison'],
  ['choose', 'comparison'],
  ['choose', 'measurement'],
  ['choose', 'reasoning'],
];

for (const [kind, topic] of GAMES) {
  test(`play ${kind} (${topic}): 3 rounds solved correctly through the UI`, async ({ page }) => {
    await createProfile(page);
    await page.goto(url(`/maths/play?topics=${topic}&kind=${kind}&n=3&label=t`, 100 + kind.length));
    let prev: string | undefined;
    for (let i = 0; i < 3; i++) {
      const q = await currentQuestion(page, prev);
      expect(q.kind).toBe(kind);
      await play(page, q);
      await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'correct');
      await page.getByTestId('next').click();
      prev = q.id;
    }
    await expect(page.getByTestId('session-summary')).toBeVisible();
    await expect(page.getByTestId('summary-correct')).toHaveText('3');
    await expect(page.getByTestId('summary-sticker')).toBeVisible();
  });
}

test('wrong answers get friendly help, hints are tracked, and the answer is shown after 3 tries', async ({ page }) => {
  await createProfile(page);
  await page.goto(url('/maths/play?topics=addition&kind=balloon&n=2&label=t', 5));
  const q = await currentQuestion(page);
  await play(page, q, { wrong: true });
  await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'wrong');
  await expect(page.getByTestId('feedback-text')).toContainText(/try|look/i);
  await expect(page.getByTestId('next')).toHaveCount(0);
  await page.getByTestId('hint').click();
  await expect(page.getByTestId('task-board')).toBeVisible();
  await play(page, q);
  await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'correct');
  await page.getByTestId('next').click();
  // counting starts at level 2 for a 5-year-old → 4 options, so 3 wrong tries are possible
  await page.goto(url('/maths/play?topics=counting&kind=count&n=1&label=t', 5));
  const q2 = await currentQuestion(page, q.id);
  const options: number[] = q2.options;
  const right = q2.groups[0];
  for (const w of options.filter((o) => o !== right).slice(0, 3)) await page.getByTestId(`choice-${w}`).click();
  await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'incorrect');
  await expect(page.getByTestId('feedback-text')).toContainText(`The answer is ${right}`);
});

test('rapid double-clicks never earn extra stars or double answers', async ({ page }) => {
  await createProfile(page);
  await page.goto(url('/maths/play?topics=numbers&kind=balloon&n=2&label=t', 9));
  const q = await currentQuestion(page);
  const before = await stars(page);
  const ans = { identify: q.task.n, after: q.task.n + 1, before: q.task.n - 1, between: q.task.low + 1 }[q.task.type as string];
  await page.getByTestId(`balloon-${ans}`).dblclick();
  await page.getByTestId(`balloon-${ans}`).click({ force: true }).catch(() => undefined);
  await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'correct');
  expect(await stars(page)).toBe(before + 1);
});

test('drag and drop: a failed drop changes nothing, a real drop feeds the monster once', async ({ page }) => {
  await createProfile(page);
  await page.goto(url('/maths/play?topics=counting&kind=feed&n=1&label=t', 3));
  await currentQuestion(page);
  const apple = page.getByTestId(/^food-food-/).first();
  const box = (await apple.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 40, box.y - 120, { steps: 8 }); // nowhere special
  await page.mouse.up();
  await expect(page.getByTestId('tummy-item')).toHaveCount(0);
  const mouth = (await page.getByTestId('monster-mouth').boundingBox())!;
  const apple2 = (await page.getByTestId(/^food-food-/).first().boundingBox())!;
  await page.mouse.move(apple2.x + apple2.width / 2, apple2.y + apple2.height / 2);
  await page.mouse.down();
  await page.mouse.move(mouth.x + mouth.width / 2, mouth.y + mouth.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByTestId('tummy-item')).toHaveCount(1);
  await expect(page.getByTestId('fed-count')).toContainText('1');
  // remove it again
  await page.getByTestId('tummy-item').click();
  await expect(page.getByTestId('tummy-item')).toHaveCount(0);
});

test('drag a number tile onto a train carriage', async ({ page }) => {
  await createProfile(page);
  await page.goto(url('/maths/play?topics=numbers&kind=train&n=1&label=t', 4));
  const q = await currentQuestion(page);
  const slot = q.missing[0];
  const value = q.start + q.step * slot;
  const tile = (await page.getByTestId(`tile-${value}`).boundingBox())!;
  const car = (await page.getByTestId(`car-${slot}`).boundingBox())!;
  await page.mouse.move(tile.x + tile.width / 2, tile.y + tile.height / 2);
  await page.mouse.down();
  await page.mouse.move(car.x + car.width / 2, car.y + car.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByTestId(`car-${slot}`)).toContainText(String(value));
  await page.getByTestId('train-go').click();
  await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'correct');
});
