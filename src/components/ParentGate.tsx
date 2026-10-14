/**
 * A simple "grown-ups only" gate (an adult arithmetic question) to keep little fingers out of settings.
 * This is a convenience, NOT a security boundary.
 */
import { useMemo, useState } from 'react';
import { E2E } from '../app/testHooks';

const KEY = 'mathsAdventure.parentUnlockedUntil';
const UNLOCK_MS = 10 * 60 * 1000;

export function isParentUnlocked(): boolean {
  try {
    return Number(sessionStorage.getItem(KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}
export function lockParent() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function ParentGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  const [a, b] = useMemo(() => [6 + Math.floor(Math.random() * 4), 4 + Math.floor(Math.random() * 6)], []);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const check = () => {
    if (Number(value) === a * b) {
      try {
        sessionStorage.setItem(KEY, String(Date.now() + UNLOCK_MS));
      } catch {
        /* ignore */
      }
      onPass();
    } else {
      setWrong(true);
      setValue('');
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="Grown-ups check">
      <div className="card anim-pop-in w-full max-w-md p-8 text-center">
        <h2 className="text-3xl font-bold">Grown-ups only</h2>
        <p className="mt-2 text-lg text-slate-600">Please answer to continue.</p>
        <p className="mt-6 text-4xl font-bold" data-testid="gate-question" data-a={E2E ? a : undefined} data-b={E2E ? b : undefined}>
          {a} × {b} = ?
        </p>
        <input
          autoFocus
          inputMode="numeric"
          className="mt-4 w-40 rounded-2xl border-4 border-slate-200 px-4 py-3 text-center text-3xl font-bold outline-none focus:border-blue-400"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/\D/g, '').slice(0, 3));
            setWrong(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          aria-label="Answer"
          data-testid="gate-input"
        />
        {wrong && <p className="mt-2 text-lg text-red-600">That’s not right — try again.</p>}
        <div className="mt-6 flex justify-center gap-4">
          <button className="btn3d btn-white px-6 py-3 text-xl" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn3d btn-blue px-6 py-3 text-xl" onClick={check} disabled={!value} data-testid="gate-submit">
            Continue
          </button>
        </div>
        <p className="mt-6 text-sm text-slate-400">This check keeps children out of settings. It is not a password.</p>
      </div>
    </div>
  );
}
