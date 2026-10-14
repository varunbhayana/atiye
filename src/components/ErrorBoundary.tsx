import { Component, type ReactNode } from 'react';

/** Last-resort safety net: never show a blank screen to a child. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('Maths Adventure error:', error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="emoji text-7xl">🦉</div>
        <h1 className="text-4xl font-bold">Oops! Ollie tripped over a twig.</h1>
        <p className="max-w-lg text-xl text-slate-600">Your progress is saved. Press the button to carry on.</p>
        <button
          className="btn3d btn-green px-10 py-5 text-2xl"
          onClick={() => {
            window.location.hash = '#/home';
            window.location.reload();
          }}
        >
          Carry on
        </button>
        <details className="max-w-xl text-left text-sm text-slate-500">
          <summary>Details for grown-ups</summary>
          <pre className="whitespace-pre-wrap">{String(this.state.error?.stack ?? this.state.error)}</pre>
        </details>
      </div>
    );
  }
}
