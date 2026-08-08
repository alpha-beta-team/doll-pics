import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, MessageCircle, RefreshCw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { QuotationPresentation } from '../components/quotation/QuotationPresentation';
import { ApiError } from '../lib/api';
import { getPublicQuotation, recordQuotationDownload, recordQuotationView } from '../lib/publicQuotationApi';
import type { PublicWeddingQuotation } from '../shared/types';

export function QuotationPage() {
  const { token = '' } = useParams();
  const [quotation, setQuotation] = useState<PublicWeddingQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [error, setError] = useState<'missing' | 'archived' | 'failed' | ''>('');
  const viewed = useRef(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const row = await getPublicQuotation(token, signal);
      setQuotation(row);
      if (!viewed.current) {
        viewed.current = true;
        void recordQuotationView(token).catch(() => undefined);
      }
    } catch (cause) {
      if (signal?.aborted) return;
      setQuotation(null);
      setError(cause instanceof ApiError && cause.status === 410 ? 'archived' : cause instanceof ApiError && cause.status === 404 ? 'missing' : 'failed');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    const previousTitle = document.title;
    const robots = ensureMeta('robots');
    const referrer = ensureMeta('referrer');
    robots.setAttribute('content', 'noindex, nofollow');
    referrer.setAttribute('content', 'no-referrer');
    document.title = quotation?.coupleNames ? `${quotation.coupleNames} · Doll Pictures` : 'Private wedding quotation · Doll Pictures';
    return () => {
      document.title = previousTitle;
      robots.remove();
      referrer.remove();
    };
  }, [quotation?.coupleNames]);

  const whatsappUrl = useMemo(() => {
    if (!quotation) return '#';
    const phone = (quotation.brand.whatsapp || quotation.brand.phone).replace(/\D/g, '');
    const target = phone.length === 10 ? `91${phone}` : phone;
    const message = `Hi Doll Pictures, I would like to discuss wedding quotation ${quotation.quotationNumber}.`;
    return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
  }, [quotation]);

  const download = async () => {
    if (!quotation || downloading) return;
    setDownloading(true);
    setActionError('');
    try {
      const { downloadQuotationPdf } = await import('../components/quotation/downloadQuotationPdf');
      await downloadQuotationPdf(quotation);
      void recordQuotationDownload(token).catch(() => undefined);
    } catch {
      setActionError('The PDF could not be prepared. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <QuotationState title="Preparing your quotation" description="Loading the details created especially for you…" />;
  if (!quotation) return <QuotationState title={error === 'archived' ? 'This quotation is unavailable' : error === 'missing' ? 'Quotation not found' : 'We couldn’t open this quotation'} description={error === 'archived' ? 'Please contact Doll Pictures for a current quotation.' : error === 'missing' ? 'Check that the private link is complete or ask Doll Pictures to share it again.' : 'Please check your connection and try again.'} action={error === 'failed' ? <button onClick={() => void load()} className="flex h-12 items-center gap-2 rounded-full bg-[#8d6938] px-5 font-semibold text-white"><RefreshCw className="h-4 w-4" />Try again</button> : undefined} />;

  return <QuotationPresentation quotation={quotation} actions={<><button type="button" disabled={downloading} onClick={() => void download()} className="flex min-h-12 items-center gap-2 rounded-full bg-[#8d6938] px-6 py-3 font-semibold text-white disabled:opacity-50"><Download className="h-4 w-4" />{downloading ? 'Preparing PDF…' : 'Download PDF'}</button><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-2 rounded-full border border-current px-6 py-3 font-semibold"><MessageCircle className="h-4 w-4" />Contact Doll Pictures</a>{actionError && <p className="w-full text-sm font-semibold text-red-700" role="alert">{actionError}</p>}</>} />;
}

function ensureMeta(name: string) {
  const element = document.createElement('meta');
  element.setAttribute('name', name);
  document.head.appendChild(element);
  return element;
}

function QuotationState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#f6f0e5] px-6 text-center text-[#29241f]"><div className="max-w-md"><img src="/logo-doll.png" alt="Doll Pictures" className="mx-auto h-20 w-20 rounded-full object-cover shadow-xl" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.25em] text-[#9a7440]">Doll Pictures</p><h1 className="mt-3 font-display text-4xl">{title}</h1><p className="mt-4 leading-7 opacity-70">{description}</p>{action && <div className="mt-7 flex justify-center">{action}</div>}</div></main>;
}
