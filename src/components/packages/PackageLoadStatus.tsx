type Props = { loading: boolean; error: string; hasPackages: boolean; onRetry: () => void };
export function PackageLoadStatus({ loading, error, hasPackages, onRetry }: Props) {
  if (error) return <div role="alert" className="my-6 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-ink-100"><p>{hasPackages ? 'Could not refresh package prices. Previously loaded packages are shown.' : 'Packages could not be loaded. Please try again.'}</p><button type="button" onClick={onRetry} className="mt-2 font-semibold text-gold-300 underline">Try again</button></div>;
  if (loading && !hasPackages) return <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-ink-200"><span className="h-6 w-6 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" aria-hidden="true" />Loading packages…</div>;
  return null;
}
