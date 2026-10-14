/** Integration tests: real React game components and the app shell in jsdom. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';
import { StoreProvider } from '../../src/app/store';
import { QuestionHost } from '../../src/components/QuestionHost';
import { emptyState, createProfile } from '../../src/core/state';
import { saveState } from '../../src/core/storage';
import type { AnswerResponse } from '../../src/core/types';
import { FeedGame } from '../../src/games/FeedGame';
import { PizzaGame } from '../../src/games/PizzaGame';
import { CountGame } from '../../src/games/CountGame';
import type { CountQuestion, FeedQuestion, PizzaQuestion } from '../../src/subjects/maths/types';
import { MATHS_TOPICS } from '../../src/subjects/maths/types';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

const common = { mode: 'practice' as const, feedback: 'none' as const, wrongCount: 0, hint: false, reveal: false, locked: false, reducedMotion: true, say: () => undefined };

const feedQ: FeedQuestion = { id: 'f1', subject: 'maths', topic: 'counting', level: 1, kind: 'feed', food: 'apple', variant: 'exact', parts: [3], supply: 5, prompt: 'The monster wants 3 apples!', signature: 'feed:3' };

describe('Feed the Monster', () => {
  it('counts each apple once, supports giving back, and submits the quantity', () => {
    const onSubmit = vi.fn<(r: AnswerResponse) => void>();
    render(<FeedGame {...common} question={feedQ} onSubmit={onSubmit} />);
    const apples = screen.getAllByTestId(/^food-food-/);
    fireEvent.pointerDown(apples[0]!, { button: 0, clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(apples[0]!, { clientX: 10, clientY: 10, pointerId: 1 });
    // the same apple is gone from the tray: it cannot be fed twice
    expect(screen.queryAllByTestId(/^food-food-/)).toHaveLength(4);
    for (const id of ['food-food-1', 'food-food-2', 'food-food-3']) fireEvent.keyDown(screen.getByTestId(id), { key: 'Enter' });
    expect(screen.getByTestId('fed-count').textContent).toContain('4');
    fireEvent.click(screen.getAllByTestId('tummy-item')[0]!);
    expect(screen.getByTestId('fed-count').textContent).toContain('3');
    fireEvent.click(screen.getByTestId('done'));
    expect(onSubmit).toHaveBeenCalledWith({ type: 'number', value: 3 });
  });
});

const pizzaQ: PizzaQuestion = { id: 'p1', subject: 'maths', topic: 'addition', level: 1, kind: 'pizza', toppings: [{ type: 'mushroom', count: 2 }, { type: 'tomato', count: 1 }], options: [3, 4, 2], prompt: 'Put 2 mushrooms and 1 tomato on the pizza!', signature: 'pizza' };

describe('Pizza Maths', () => {
  it('blocks a wrong pizza with a friendly note, allows removing, then asks for the total', () => {
    const onSubmit = vi.fn<(r: AnswerResponse) => void>();
    render(<PizzaGame {...common} question={pizzaQ} onSubmit={onSubmit} />);
    const add = (t: string) => fireEvent.keyDown(screen.getByTestId(`bin-${t}`), { key: 'Enter' });
    add('mushroom');
    add('mushroom');
    add('mushroom');
    add('tomato');
    fireEvent.click(screen.getByTestId('pizza-done'));
    expect(screen.getByTestId('pizza-note').textContent).toMatch(/2 mushrooms chahiye/);
    fireEvent.click(screen.getAllByTestId('placed-mushroom')[0]!);
    fireEvent.click(screen.getByTestId('pizza-done'));
    fireEvent.click(screen.getByTestId('choice-3'));
    expect(onSubmit).toHaveBeenCalledWith({ type: 'pizza', placed: { mushroom: 2, tomato: 1 }, total: 3 });
  });
});

const countQ: CountQuestion = {
  id: 'c1',
  subject: 'maths',
  topic: 'counting',
  level: 1,
  kind: 'count',
  variant: 'count',
  creature: 'rabbit',
  groups: [3],
  leaving: 0,
  placements: [
    { x: 20, y: 30, scale: 1, flip: false },
    { x: 50, y: 50, scale: 1, flip: false },
    { x: 80, y: 70, scale: 1, flip: false },
  ],
  moving: false,
  options: [2, 3, 4],
  prompt: 'How many rabbits?',
  signature: 'count:3',
};

describe('Count the Animals', () => {
  it('shows exactly the right number of animals and never double-counts', () => {
    render(<CountGame {...common} question={countQ} onSubmit={() => undefined} />);
    const rabbits = screen.getAllByTestId(/^creature-/);
    expect(rabbits).toHaveLength(3);
    fireEvent.click(rabbits[0]!);
    fireEvent.click(rabbits[0]!);
    fireEvent.click(rabbits[1]!);
    expect(screen.getByTestId('count-indicator').textContent).toContain('2');
  });
});

describe('QuestionHost', () => {
  it('reports a rapid double submission only once', () => {
    const p = createProfile({ name: 'Q', age: 5, schoolClass: 'ukg', settings: { voice: false, sound: false } }, { maths: [...MATHS_TOPICS] });
    saveState({ ...emptyState(), profiles: [p], activeProfileId: p.profile.id });
    const onResolved = vi.fn();
    render(
      <StoreProvider>
        <QuestionHost question={countQ} mode="test" index={0} onResolved={onResolved} onNext={() => undefined} />
      </StoreProvider>,
    );
    fireEvent.click(screen.getByTestId('choice-3'));
    const done = screen.getByTestId('done');
    fireEvent.click(done);
    fireEvent.click(done);
    expect(onResolved).toHaveBeenCalledTimes(1);
    expect(onResolved.mock.calls[0]![0]).toMatchObject({ outcome: 'first', correct: true });
  });
  it('practice: wrong answer gives a hint and allows retry; outcome is "retry"', () => {
    const p = createProfile({ name: 'Q', age: 5, schoolClass: 'ukg', settings: { voice: false, sound: false } }, { maths: [...MATHS_TOPICS] });
    saveState({ ...emptyState(), profiles: [p], activeProfileId: p.profile.id });
    const onResolved = vi.fn();
    render(
      <StoreProvider>
        <QuestionHost question={countQ} mode="practice" index={0} onResolved={onResolved} onNext={() => undefined} />
      </StoreProvider>,
    );
    fireEvent.click(screen.getByTestId('choice-2'));
    expect(screen.getByTestId('feedback-text').dataset.state).toBe('wrong');
    expect(onResolved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('choice-3'));
    expect(onResolved).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'retry', correct: true, tries: 2 }));
    expect(screen.getByTestId('next')).toBeTruthy();
  });
});

describe('App reopening', () => {
  it('creating a profile persists it, and a fresh app instance restores it', async () => {
    window.location.hash = '#/welcome';
    const first = render(<App />);
    fireEvent.click(screen.getByTestId('start'));
    await act(async () => undefined);
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Atiye' } });
    fireEvent.click(screen.getByTestId('create-profile'));
    await act(async () => undefined);
    expect(screen.getByText(/Hi Atiye!/)).toBeTruthy();
    first.unmount();
    window.location.hash = '#/';
    render(<App />);
    await act(async () => undefined);
    expect(screen.getByText(/Hi Atiye!/)).toBeTruthy();
    expect(screen.getByTestId('subject-english').getAttribute('aria-label')).toMatch(/coming soon/);
  });
});
