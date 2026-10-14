/**
 * Child-facing language switch (English / Hinglish). Usage: const t = useT(); t('Great job!', 'Shabaash!')
 */
import type { Language } from '../core/state';
import { useOptionalStore } from './store';

export function useLang(): Language {
  return useOptionalStore()?.active?.settings.language ?? 'hindi';
}

export function useT() {
  const lang = useLang();
  return (en: string, hinglish: string) => (lang === 'en' ? en : hinglish);
}
