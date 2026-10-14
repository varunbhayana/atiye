/**
 * Persistent application state model (subject-agnostic) and factory helpers.
 */
import type { Level, Mode, Outcome, QuestionBase, AnswerResponse } from './types';
import { AGE_APPROPRIATE_MAX_LEVEL, MAX_LEVEL, clampLevel } from './types';

/** v2: Hinglish became the default child language (existing profiles are switched once on load). */
/** v3: Hindi voice became the default (Hinglish profiles switch to the Hindi voice once on load). */
export const SCHEMA_VERSION = 3;

export const CLASS_LEVELS = [
  { id: 'nursery', label: 'Nursery', typicalAge: 3 },
  { id: 'lkg', label: 'LKG / Pre-K', typicalAge: 4 },
  { id: 'ukg', label: 'UKG / Kindergarten', typicalAge: 5 },
  { id: 'class1', label: 'Class 1', typicalAge: 6 },
  { id: 'class2', label: 'Class 2', typicalAge: 7 },
  { id: 'class3', label: 'Class 3', typicalAge: 8 },
  { id: 'class4', label: 'Class 4', typicalAge: 9 },
  { id: 'class5', label: 'Class 5', typicalAge: 10 },
  { id: 'class6', label: 'Class 6', typicalAge: 11 },
  { id: 'class7', label: 'Class 7', typicalAge: 12 },
] as const;
export type ClassLevel = (typeof CLASS_LEVELS)[number]['id'];
export const AGES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type DifficultyPref = 'gentle' | 'standard' | 'challenge';
export type SessionLength = 'short' | 'normal' | 'long';
/** language of everything the child sees and hears (parent area stays in English) */
/** en: English · hinglish: Hinglish text + Indian-English voice · hindi: Hinglish text + Hindi voice speaking Hindi */
export type Language = 'en' | 'hinglish' | 'hindi';
export type VoiceSpeed = 'very-slow' | 'slow' | 'normal';

export interface ChildProfile {
  id: string;
  name: string;
  /** optional: how Ollie should say the name, e.g. अतिये or Ah-tee-yeh */
  nameSay: string;
  age: number;
  schoolClass: ClassLevel;
  companion: string; // emoji of chosen buddy colour/style
  createdAt: number;
}

export interface ProfileSettings {
  sound: boolean;
  voice: boolean;
  /** 'system' follows the OS setting */
  reducedMotion: 'system' | 'on' | 'off';
  difficulty: DifficultyPref;
  autoAdapt: boolean;
  allowAdvanced: boolean;
  sessionLength: SessionLength;
  voiceName: string | null;
  language: Language;
  voiceSpeed: VoiceSpeed;
}

export interface LevelChange {
  ts: number;
  from: Level;
  to: Level;
  reason: string;
  auto: boolean;
}

export interface TopicProgress {
  level: Level;
  history: LevelChange[];
}

export interface AttemptRecord {
  id: string;
  ts: number;
  sessionId: string;
  mode: Mode;
  subject: string;
  topic: string;
  kind: string;
  level: Level;
  outcome: Outcome;
  tries: number;
  hintUsed: boolean;
  signature: string;
  question: string; // human summary
  response: string; // human summary of the child's final answer
  correctAnswer: string;
}

export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  mode: Mode;
  subject: string;
  label: string;
  total: number;
  firstTry: number;
  correct: number;
  stars: number;
}

export interface TestConfig {
  subject: string;
  topics: string[]; // one topic or several (mixed)
  level: Level;
  count: 5 | 10 | 15 | 20;
  ageLabel: string;
}

export interface TestAnswer {
  response: AnswerResponse;
  correct: boolean;
  ts: number;
}

export interface TestRecord {
  id: string;
  config: TestConfig;
  questions: QuestionBase[];
  answers: (TestAnswer | null)[];
  current: number;
  status: 'in-progress' | 'finished' | 'abandoned';
  startedAt: number;
  finishedAt: number | null;
}

export interface Rewards {
  stars: number;
  stickers: string[];
  achievements: { id: string; ts: number }[];
  zoneStars: Record<string, number>;
  treasureHunts: number;
  lessonsDone: string[];
}

export interface ProfileData {
  profile: ChildProfile;
  settings: ProfileSettings;
  /** subject → topic → progress */
  topics: Record<string, Record<string, TopicProgress>>;
  attempts: AttemptRecord[];
  sessions: SessionRecord[];
  tests: TestRecord[];
  rewards: Rewards;
  daysPlayed: string[];
}

export interface AppState {
  schemaVersion: number;
  profiles: ProfileData[];
  activeProfileId: string | null;
  updatedAt: number;
}

export const MAX_ATTEMPTS_STORED = 3000;
export const MAX_SESSIONS_STORED = 500;
export const MAX_TESTS_STORED = 100;

export function newId(prefix: string): string {
  const rand = Math.floor(Math.random() * 1e9).toString(36);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

export function defaultSettings(): ProfileSettings {
  return {
    sound: true,
    voice: true,
    reducedMotion: 'system',
    difficulty: 'standard',
    autoAdapt: true,
    allowAdvanced: false,
    sessionLength: 'normal',
    voiceName: null,
    language: 'hindi',
    voiceSpeed: 'slow',
  };
}

export function emptyRewards(): Rewards {
  return { stars: 0, stickers: [], achievements: [], zoneStars: {}, treasureHunts: 0, lessonsDone: [] };
}

export function emptyState(): AppState {
  return { schemaVersion: SCHEMA_VERSION, profiles: [], activeProfileId: null, updatedAt: Date.now() };
}

/** Is the chosen age/class covered by the fully-built curriculum? Honest about what is supported. */
export function supportInfo(age: number, cls: ClassLevel): { full: boolean; message: string } {
  if (age === 5 || cls === 'ukg') return { full: true, message: 'Age 5 / UKG Maths is fully supported.' };
  if (age < 5) return { full: false, message: `A dedicated age-${age} curriculum is coming soon. For now we use the easiest levels of the Age-5 Maths curriculum.` };
  return { full: false, message: `A dedicated curriculum for age ${age} / ${CLASS_LEVELS.find((c) => c.id === cls)?.label ?? cls} is coming soon. For now we use the Age-5 Maths curriculum with its advanced levels switched on.` };
}

export function maxLevelFor(settings: ProfileSettings): Level {
  return settings.allowAdvanced ? MAX_LEVEL : AGE_APPROPRIATE_MAX_LEVEL;
}

/** Starting level for a topic from age, class and difficulty preference. */
export function initialLevel(topic: string, profile: Pick<ChildProfile, 'age' | 'schoolClass'>, settings: ProfileSettings): Level {
  const clsAge = CLASS_LEVELS.find((c) => c.id === profile.schoolClass)?.typicalAge ?? 5;
  const age = Math.round((profile.age + clsAge) / 2);
  let base = 1;
  if (topic === 'counting' && age >= 5) base = 2;
  if (age >= 6) base += 1;
  if (age <= 4) base = 1;
  if (settings.difficulty === 'gentle') base -= 1;
  if (settings.difficulty === 'challenge') base += 1;
  return clampLevel(base, maxLevelFor(settings));
}

export function createProfile(input: { name: string; age: number; schoolClass: ClassLevel; companion?: string; settings?: Partial<ProfileSettings> }, topicIds: Record<string, string[]>): ProfileData {
  const settings = { ...defaultSettings(), ...input.settings };
  if (input.age >= 6) settings.allowAdvanced = input.settings?.allowAdvanced ?? true;
  const profile: ChildProfile = {
    id: newId('child'),
    name: input.name.trim().slice(0, 24),
    nameSay: '',
    age: input.age,
    schoolClass: input.schoolClass,
    companion: input.companion ?? '🦉',
    createdAt: Date.now(),
  };
  const topics: ProfileData['topics'] = {};
  for (const [subject, ids] of Object.entries(topicIds)) {
    topics[subject] = {};
    for (const t of ids) topics[subject][t] = { level: initialLevel(t, profile, settings), history: [] };
  }
  return { profile, settings, topics, attempts: [], sessions: [], tests: [], rewards: emptyRewards(), daysPlayed: [] };
}

export function topicLevel(data: ProfileData, subject: string, topic: string): Level {
  return data.topics[subject]?.[topic]?.level ?? 1;
}

export function todayKey(ts = Date.now()): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
