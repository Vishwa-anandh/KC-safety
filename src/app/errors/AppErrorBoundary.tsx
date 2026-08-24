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
      <main className="access-state">
        <section>
          <h1>The workspace could not be loaded</h1>
          <p>Reload the page. If the problem continues, contact EHS&amp;S support.</p>
          <button type="button" className="button button--primary button--default" onClick={() => window.location.reload()}>
            Reload workspace
          </button>
        </section>
      </main>
    );
  }
}
