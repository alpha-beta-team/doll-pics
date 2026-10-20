import { useCallback, useEffect, useState } from 'react';
import type { PublicPackage } from '../shared/types';

type PackageLoader = (signal?: AbortSignal) => Promise<PublicPackage[]>;
type State = { packages: PublicPackage[]; status: 'idle' | 'loading' | 'ready' | 'error'; error: string };

/** Packages have their own lifecycle; optional page content never gates this resource. */
export function usePublicPackages(load: PackageLoader, enabled: boolean, initialPackages: PublicPackage[] = []) {
  const [state, setState] = useState<State>({ packages: initialPackages, status: 'idle', error: '' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const controller = new AbortController();
    setState(previous => ({ ...previous, status: 'loading', error: '' }));
    void load(controller.signal).then(packages => {
      if (cancelled) return;
      setState({ packages, status: 'ready', error: '' });
    }).catch(error => {
      if (cancelled) return;
      setState(previous => ({ ...previous, status: 'error', error: error instanceof Error ? error.message : 'Could not load packages.' }));
    });
    return () => { cancelled = true; controller.abort(); };
  }, [load, enabled, attempt]);

  useEffect(() => {
    if (!enabled) return;
    const focus = () => retry();
    const visible = () => { if (document.visibilityState === 'visible') retry(); };
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visible);
    return () => { window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visible); };
  }, [enabled, retry]);

  useEffect(() => {
    if (!enabled || !state.packages.length || state.status === 'loading') return;
    const boundaries = state.packages.map(pkg => pkg.pricing?.nextTransitionAt)
      .filter((value): value is string => Boolean(value)).map(value => +new Date(value)).filter(Number.isFinite);
    const remaining = boundaries.length ? Math.min(...boundaries) - Date.now() : 60000;
    const delay = remaining <= 0 ? 30000 : Math.max(500, Math.min(60000, remaining + 100));
    const timer = window.setTimeout(retry, delay);
    return () => window.clearTimeout(timer);
  }, [enabled, state.packages, state.status, retry]);

  return { packages: state.packages, packagesLoading: enabled && (state.status === 'idle' || state.status === 'loading'),
    packagesError: state.error, retryPackages: retry };
}
