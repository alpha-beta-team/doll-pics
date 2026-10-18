import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Package } from '../types';
export function useBookingPricing(packageId: string, preserve: boolean) {
  const [preview, setPreview] = useState<Package | null>(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [reason, setReason] = useState('');
  useEffect(() => {
    setPreview(null); setError('');
    if (!packageId || preserve) return;
    let cancelled = false;
    void api.getPricingPreview(packageId).then(value => { if (!cancelled) setPreview(value); }).catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : 'Could not load price'); });
    return () => { cancelled = true; };
  }, [packageId, preserve, refreshKey]);
  return { preview, error, reason, setReason, preserve, refresh: () => setRefreshKey(key => key + 1), pending: Boolean(packageId && !preserve && !preview && !error) };
}
