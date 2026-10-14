/**
 * Rewards that recognise effort, improvement and mastery — never speed.
 * Stickers are earned in a fixed album order (no random loot), one per finished activity session.
 */
import type { ProfileData } from './state';

export interface AchievementDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  check: (d: ProfileData) => boolean;
}

const correctIn = (d: ProfileData, topic: string) => d.attempts.filter((a) => a.topic === topic && a.outcome !== 'incorrect' && a.outcome !== 'skipped').length;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-steps', name: 'First Steps', emoji: '👣', description: 'Answered your first question', check: (d) => d.attempts.some((a) => a.outcome !== 'skipped' && a.outcome !== 'incorrect') },
  { id: 'counting-explorer', name: 'Counting Explorer', emoji: '🐰', description: 'Solved 10 counting puzzles', check: (d) => correctIn(d, 'counting') >= 10 },
  { id: 'number-hero', name: 'Number Hero', emoji: '🦸', description: 'Solved 15 number puzzles', check: (d) => correctIn(d, 'numbers') >= 15 },
  { id: 'addition-star', name: 'Addition Star', emoji: '➕', description: 'Solved 10 adding puzzles', check: (d) => correctIn(d, 'addition') >= 10 },
  { id: 'take-away-champ', name: 'Take-Away Champ', emoji: '➖', description: 'Solved 10 take-away puzzles', check: (d) => correctIn(d, 'subtraction') >= 10 },
  { id: 'shape-detective', name: 'Shape Detective', emoji: '🔍', description: 'Found shapes 8 times', check: (d) => correctIn(d, 'shapes') >= 8 },
  { id: 'pattern-champion', name: 'Pattern Champion', emoji: '🌈', description: 'Solved 8 patterns', check: (d) => correctIn(d, 'patterns') >= 8 },
  { id: 'brave-learner', name: 'Brave Learner', emoji: '💪', description: 'Kept trying and got 5 answers after a mistake', check: (d) => d.attempts.filter((a) => a.outcome === 'retry' || a.outcome === 'hint').length >= 5 },
  { id: 'treasure-finder', name: 'Treasure Finder', emoji: '🏴‍☠️', description: 'Finished a treasure hunt', check: (d) => d.rewards.treasureHunts >= 1 },
  { id: 'island-explorer', name: 'Island Explorer', emoji: '🏝️', description: 'Played in every zone of the island', check: (d) => new Set(d.attempts.filter((a) => a.subject === 'maths').map((a) => a.topic)).size >= 9 },
  { id: 'test-taker', name: 'Quiz Whiz', emoji: '📝', description: 'Finished a quiz', check: (d) => d.tests.some((t) => t.status === 'finished') },
  { id: 'steady-learner', name: 'Steady Learner', emoji: '📅', description: 'Played on 3 different days', check: (d) => new Set(d.daysPlayed).size >= 3 },
  { id: 'growing-up', name: 'Growing Brain', emoji: '🌱', description: 'Moved up a level in any topic', check: (d) => Object.values(d.topics).some((m) => Object.values(m).some((t) => t.history.some((h) => h.to > h.from))) },
  { id: 'lesson-lover', name: 'Curious Mind', emoji: '💡', description: 'Watched 3 different lessons', check: (d) => d.rewards.lessonsDone.length >= 3 },
];

export function newAchievements(d: ProfileData): string[] {
  const have = new Set(d.rewards.achievements.map((a) => a.id));
  return ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.check(d)).map((a) => a.id);
}

export function achievementDef(id: string) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export const STICKER_ALBUM = ['🦄', '🐳', '🦁', '🐼', '🚀', '🌈', '🦕', '🐙', '🍩', '🎠', '🦋', '🐯', '🌻', '🦒', '🪐', '🐬', '🍉', '🦊', '🎨', '🐨', '🏰', '🦚', '⛵', '🐘'];

export function nextSticker(d: ProfileData): string | null {
  return STICKER_ALBUM.find((s) => !d.rewards.stickers.includes(s)) ?? null;
}

/** Island friends unlocked by collecting stickers. */
export const FRIENDS = [
  { stickers: 3, emoji: '🐬', name: 'Dolly the Dolphin' },
  { stickers: 6, emoji: '🦜', name: 'Pip the Parrot' },
  { stickers: 10, emoji: '🐢', name: 'Tico the Turtle' },
  { stickers: 15, emoji: '🦩', name: 'Fifi the Flamingo' },
  { stickers: 20, emoji: '🐉', name: 'Daisy the Dragon' },
];
