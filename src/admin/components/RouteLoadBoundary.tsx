import { Component, type ReactNode } from 'react';

/** Keep the studio navigation usable if a route chunk is unavailable after a release. */
export class RouteLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" className="rounded-xl border border-admin-border bg-admin-surface p-6 text-admin-text">
      <h1 className="text-lg font-semibold">This page couldn’t load</h1>
      <p className="mt-2 text-sm">Check your connection, then reload to get the latest version.</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-admin-primary px-4 py-2 font-semibold text-white">Reload page</button>
    </div>;
  }
}
