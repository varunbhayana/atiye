/** Big, friendly display of a number task (3 + 2 = ?, what comes after 6, …). */
import type { ReactNode } from 'react';
import type { NumberTask } from '../subjects/maths/types';
import { Dots } from './controls';

function Big({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <span className={`inline-flex min-w-16 items-center justify-center rounded-2xl px-3 text-6xl font-bold ${muted ? 'text-slate-400' : 'text-slate-800'}`}>{children}</span>;
}
function Q() {
  return <span className="inline-flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-dashed border-orange-400 bg-orange-50 text-5xl font-bold text-orange-500">?</span>;
}

export function TaskBoard({ task: t, showDots }: { task: NumberTask; showDots: boolean }) {
  return (
    <div className="card flex flex-wrap items-center justify-center gap-3 px-8 py-3" data-testid="task-board">
      {t.type === 'add' || t.type === 'sub' ? (
        <>
          <div className="flex flex-col items-center gap-1">
            <Big>{t.a}</Big>
            {showDots && t.a <= 10 && <Dots n={t.a} color="#f97316" />}
          </div>
          <Big>{t.type === 'add' ? '+' : '−'}</Big>
          <div className="flex flex-col items-center gap-1">
            <Big>{t.b}</Big>
            {showDots && t.b <= 10 && <Dots n={t.b} color={t.type === 'add' ? '#3b82f6' : '#94a3b8'} />}
          </div>
          <Big>=</Big>
          <Q />
        </>
      ) : t.type === 'identify' ? (
        <>
          <span className="text-3xl font-semibold text-slate-600">Find</span>
          <Big>{t.n}</Big>
        </>
      ) : t.type === 'after' ? (
        <>
          <Big muted>{t.n > 0 ? t.n - 1 : ''}</Big>
          <Big>{t.n}</Big>
          <Q />
        </>
      ) : t.type === 'before' ? (
        <>
          <Q />
          <Big>{t.n}</Big>
          <Big muted>{t.n + 1}</Big>
        </>
      ) : (
        <>
          <Big>{t.low}</Big>
          <Q />
          <Big>{t.high}</Big>
        </>
      )}
    </div>
  );
}
