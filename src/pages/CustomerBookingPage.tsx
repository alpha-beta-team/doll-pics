import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { CustomerBookingContact, CustomerBookingPresentation } from '../components/CustomerBookingPresentation';
import { ApiError, publicFetch } from '../lib/api';
import type { CustomerBooking } from '../shared/customerBooking';

export function CustomerBookingPage() {
  const { token = '' } = useParams();
  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading');
  const requestId = useRef(0);
  const load = useCallback(async (signal?: AbortSignal) => {
    const current = ++requestId.current;
    setBooking(null);
    setState('loading');
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) { setState('unavailable'); return; }
    try {
      const result = await publicFetch<CustomerBooking>(`/customer-bookings/${encodeURIComponent(token)}`, {
        signal, cache: 'no-store', referrerPolicy: 'no-referrer',
      });
      if (signal?.aborted || current !== requestId.current) return;
      setBooking(result); setState('ready');
    } catch (error) {
      if (signal?.aborted || current !== requestId.current) return;
      setState(error instanceof ApiError && error.status === 404 ? 'unavailable' : 'error');
    }
  }, [token]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => { controller.abort(); };
  }, [load]);
  useEffect(() => {
    const title = document.title;
    const metas = ['robots', 'referrer'].map((name, index) => {
      const existing = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      const meta = existing || document.createElement('meta');
      const previous = meta.getAttribute('content');
      meta.name = name; meta.content = index === 0 ? 'noindex, nofollow' : 'no-referrer';
      if (!existing) document.head.appendChild(meta);
      return { meta, existing, previous };
    });
    document.title = 'Your booking · Doll Pictures';
    return () => { document.title = title; metas.forEach(({ meta, existing, previous }) => {
      if (!existing) meta.remove();
      else if (previous === null) meta.removeAttribute('content');
      else meta.setAttribute('content', previous);
    }); };
  }, []);
  return <main className="min-h-screen bg-[#f7f3ec] px-4 py-7 sm:px-6 sm:py-12">
    {state === 'ready' && booking ? <><CustomerBookingPresentation booking={booking} /><div className="mt-3 flex justify-center"><button type="button" onClick={() => void load()} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-[#294d40]"><RefreshCw className="h-4 w-4" />Refresh booking</button></div></> : <div className="mx-auto flex min-h-[75vh] max-w-md flex-col items-center justify-center text-center text-[#332d25]" aria-live="polite">
      <img src="/logo-doll.png" alt="Doll Pictures" className="h-20 w-20 rounded-full object-cover" />
      <h1 className="mt-6 font-display text-3xl">{state === 'loading' ? 'Opening your booking…' : state === 'unavailable' ? 'This booking page is unavailable' : 'We couldn’t refresh your booking'}</h1>
      <p className="my-5 text-sm leading-7 text-[#716553]">{state === 'loading' ? 'Please wait while we load your latest details.' : state === 'unavailable' ? 'Check your private link or ask the studio to share a current link.' : 'Check your connection and try again. Previous booking details are hidden until we can load the latest information.'}</p>
      {state === 'error' && <button type="button" onClick={() => void load()} className="mb-5 min-h-12 rounded-xl bg-[#294d40] px-6 font-semibold text-white">Try again</button>}
      {state !== 'loading' && <CustomerBookingContact />}
    </div>}
  </main>;
}
