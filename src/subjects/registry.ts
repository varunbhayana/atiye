/**
 * Subject registry. To add a subject: implement SubjectModule, then register it here
 * (and register its activity renderers in src/games/registry.tsx). See docs/ADDING_A_SUBJECT.md.
 */
import type { SubjectModule } from '../core/types';
import { mathsSubject } from './maths';

export interface SubjectEntry {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: 'available' | 'coming-soon';
  module?: SubjectModule;
}

export const SUBJECTS: SubjectEntry[] = [
  { id: 'maths', name: 'Maths', emoji: '🔢', color: '#f97316', status: 'available', module: mathsSubject as unknown as SubjectModule },
  { id: 'english', name: 'English', emoji: '🔤', color: '#3b82f6', status: 'coming-soon' },
  { id: 'hindi', name: 'Hindi', emoji: 'अ', color: '#ec4899', status: 'coming-soon' },
  { id: 'science', name: 'Science', emoji: '🔬', color: '#22c55e', status: 'coming-soon' },
  { id: 'logic', name: 'Logical Reasoning', emoji: '🧠', color: '#8b5cf6', status: 'coming-soon' },
  { id: 'gk', name: 'General Knowledge', emoji: '🌍', color: '#06b6d4', status: 'coming-soon' },
];

export function getSubject(id: string): SubjectEntry | undefined {
  return SUBJECTS.find((s) => s.id === id);
}
