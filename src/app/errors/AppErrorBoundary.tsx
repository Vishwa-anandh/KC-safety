import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Replace with the approved telemetry adapter when a production sink is configured.
    console.error("KC Safety application error", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="access-state grid min-h-screen place-items-center p-6">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            The workspace could not be loaded
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Reload the page. If the problem continues, contact EHS&amp;S support.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-kc-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-kc-blue-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-kc-blue-500"
            onClick={() => window.location.reload()}
          >
            Reload workspace
          </button>
        </section>
      </main>
    );
  }
}
