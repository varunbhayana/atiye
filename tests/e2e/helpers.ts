import { expect, type Page } from '@playwright/test';
import path from 'node:path';

export const APP = 'file://' + path.resolve('dist/index.html');
export const url = (route: string, seed = 1) => `${APP}?e2e=1&seed=${seed}#${route}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Q = any;

export async function createProfile(page: Page, name = 'Atiye', opts: { hinglish?: boolean } = {}) {
  await page.goto(url('/setup'));
  await page.getByTestId('name-input').fill(name);
  // Hinglish is the default; most tests assert English wording, so they pick English explicitly
  await page.getByTestId(opts.hinglish ? 'lang-hinglish' : 'lang-en').click();
  await page.getByTestId('create-profile').click();
  await expect(page.getByTestId('subject-maths')).toBeVisible();
}

export async function currentQuestion(page: Page, notId?: string): Promise<Q> {
  await expect
    .poll(async () => page.evaluate(() => (window as unknown as { __MA__?: { question?: { id: string } } }).__MA__?.question?.id ?? null))
    .not.toBe(notId ?? null);
  return page.evaluate(() => (window as unknown as { __MA__: { question: unknown } }).__MA__.question);
}

/** Independent answer computation from the question data (does not use app code). */
export function answerOf(q: Q): number | string | string[] | number[] {
  const task = (t: Q) => ({ identify: t.n, after: t.n + 1, before: t.n - 1, between: t.low + 1, add: t.a + t.b, sub: t.a - t.b })[t.type as string];
  switch (q.kind) {
    case 'count': {
      const total = q.groups.reduce((a: number, b: number) => a + b, 0);
      return q.variant === 'takeaway' ? total - q.leaving : total;
    }
    case 'feed':
      return q.parts.reduce((a: number, b: number) => a + b, 0);
    case 'balloon':
    case 'treasure':
    case 'catch':
      return task(q.task);
    case 'train':
      return q.variant === 'order' ? [...q.tiles].sort((a: number, b: number) => (q.direction === 'asc' ? a - b : b - a)) : q.missing.map((i: number) => q.start + q.step * i);
    case 'pizza':
      return q.toppings.reduce((a: number, t: Q) => a + t.count, 0);
    case 'shapes':
      return q.items.filter((i: Q) => i.shape === q.target).map((i: Q) => i.id);
    case 'pattern':
      return q.patternType === 'number' ? String(q.start + q.step * q.blankIndex) : q.unit[q.blankIndex % q.unit.length];
    case 'shop':
      return q.variant === 'spend' ? q.have - q.amount : q.have + q.amount;
    case 'numberline':
      return q.direction === 'forward' ? q.start + q.jumps : q.start - q.jumps;
    case 'tower':
      if (q.variant === 'build') return q.target;
      return (q.ask === 'taller' || q.ask === 'more' ? q.left > q.right : q.left < q.right) ? 'left' : 'right';
    case 'choose': {
      const r = q.rule;
      if (r.type === 'compare') {
        const sym = r.a < r.b ? '<' : r.a > r.b ? '>' : '=';
        return q.options.find((o: Q) => o.facts.symbol === sym).id;
      }
      if (r.type === 'match') return q.options.find((o: Q) => String(o.facts[r.fact]) === String(r.value)).id;
      if (r.type === 'odd') {
        const vals = q.options.map((o: Q) => o.facts[r.fact]);
        return q.options.find((o: Q) => vals.filter((v: unknown) => v === o.facts[r.fact]).length === 1).id;
      }
      const vals = q.options.map((o: Q) => Number(o.facts[r.fact]));
      const best = r.type === 'max' ? Math.max(...vals) : Math.min(...vals);
      return q.options.find((o: Q) => Number(o.facts[r.fact]) === best).id;
    }
  }
  throw new Error(`unknown kind ${q.kind}`);
}

/** A plausible wrong answer for the simple choice games. */
export function wrongOf(q: Q): number | string | null {
  const a = answerOf(q);
  const list: (number | string)[] =
    q.kind === 'balloon' || q.kind === 'count' || q.kind === 'shop' || q.kind === 'pizza' ? q.options : q.kind === 'treasure' ? q.keys : q.kind === 'catch' ? q.items.map((i: Q) => i.value) : q.kind === 'pattern' ? q.options : q.kind === 'choose' ? q.options.map((o: Q) => o.id) : [];
  return list.find((x) => x !== a) ?? null;
}

async function clickTimes(page: Page, testId: string, n: number) {
  for (let i = 0; i < n; i++) await page.getByTestId(testId).first().click();
}

/** Play the current question through the real UI. `wrong` answers incorrectly where possible. */
export async function play(page: Page, q: Q, opts: { mode?: 'practice' | 'test'; wrong?: boolean } = {}) {
  const mode = opts.mode ?? 'practice';
  const ans = answerOf(q);
  const pickNumber = async (n: number | string) => {
    await page.getByTestId(`choice-${n}`).click();
  };
  const finalNumber = opts.wrong && wrongOf(q) !== null ? wrongOf(q)! : ans;
  switch (q.kind) {
    case 'count':
      for (let i = 0; i < Math.min(3, q.placements.length - (q.variant === 'takeaway' ? q.leaving : 0)); i++) await page.getByTestId(`creature-${i}`).click();
      await pickNumber(finalNumber as number);
      break;
    case 'feed': {
      const n = (ans as number) + (opts.wrong ? 1 : 0);
      for (let i = 0; i < n; i++) await page.getByTestId(/^food-food-/).first().click();
      break;
    }
    case 'balloon':
      await page.getByTestId(`balloon-${finalNumber}`).click();
      break;
    case 'treasure':
      await page.getByTestId(`key-${finalNumber}`).click();
      break;
    case 'catch':
      await page.getByTestId(`star-${finalNumber}`).click();
      break;
    case 'train': {
      const values = opts.wrong ? [...(ans as number[])].reverse() : (ans as number[]);
      if (opts.wrong && values.length === 1) {
        const other = q.tiles.find((t: number) => t !== values[0]);
        await page.getByTestId(`tile-${other}`).click();
      } else for (const v of values) await page.getByTestId(`tile-${v}`).click();
      await page.getByTestId('train-go').click();
      return;
    }
    case 'pizza': {
      for (const t of q.toppings) await clickTimes(page, `bin-${t.type}`, t.count);
      await page.getByTestId('pizza-done').click();
      await pickNumber(opts.wrong ? (wrongOf(q) as number) : (ans as number));
      break;
    }
    case 'shapes':
      if (q.variant === 'pick-one') {
        const target = (ans as string[])[0];
        const other = q.items.find((i: Q) => i.id !== target).id;
        await page.getByTestId(`shape-${opts.wrong ? other : target}`).click();
      } else {
        const ids = ans as string[];
        for (const id of opts.wrong ? ids.slice(0, Math.max(0, ids.length - 1)).concat(q.items.find((i: Q) => !ids.includes(i.id)).id) : ids) await page.locator(`[data-testid="shape-${id}"]`).click({ force: true });
        await page.getByTestId('done').click();
        return;
      }
      break;
    case 'pattern':
      await page.getByTestId(`piece-${finalNumber}`).click();
      break;
    case 'shop': {
      const coin = q.variant === 'spend' ? 'purse-coin' : 'granny-coin';
      await clickTimes(page, coin, q.amount);
      await page.getByTestId('shop-pay').click();
      await pickNumber(finalNumber as number);
      break;
    }
    case 'numberline':
      await clickTimes(page, 'jump', q.jumps);
      await page.getByTestId(`tick-${opts.wrong ? (ans as number) + (ans === q.max ? -1 : 1) : ans}`).click();
      break;
    case 'tower':
      if (q.variant === 'build') {
        await clickTimes(page, 'block-bin', (ans as number) + (opts.wrong ? 1 : 0));
        await page.getByTestId('done').click();
        return;
      }
      await page.getByTestId(`tower-${opts.wrong ? (ans === 'left' ? 'right' : 'left') : ans}`).click();
      break;
    case 'choose':
      await page.getByTestId(`option-${finalNumber}`).click();
      break;
  }
  if (mode === 'test' || q.kind === 'feed') {
    const done = page.getByTestId('done');
    if (await done.count()) await done.first().click();
  }
}

export async function stars(page: Page): Promise<number> {
  return Number((await page.getByTestId('session-stars').textContent())!.replace(/\D/g, ''));
}

export async function unlockParent(page: Page) {
  const q = page.getByTestId('gate-question');
  await expect(q).toBeVisible();
  const a = Number(await q.getAttribute('data-a'));
  const b = Number(await q.getAttribute('data-b'));
  await page.getByTestId('gate-input').fill(String(a * b));
  await page.getByTestId('gate-submit').click();
}
