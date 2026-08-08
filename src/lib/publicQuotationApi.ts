import type { PublicWeddingQuotation } from '../shared/types';
import { publicFetch } from './api';

export function getPublicQuotation(token: string, signal?: AbortSignal) {
  return publicFetch<PublicWeddingQuotation>(`/quotations/${encodeURIComponent(token)}`, { signal, referrerPolicy: 'no-referrer', cache: 'no-store' });
}

export function recordQuotationView(token: string, signal?: AbortSignal) {
  return publicFetch<{ recorded: true }>(`/quotations/${encodeURIComponent(token)}/viewed`, { method: 'POST', signal, referrerPolicy: 'no-referrer', cache: 'no-store' });
}

export function recordQuotationDownload(token: string, signal?: AbortSignal) {
  return publicFetch<{ recorded: true }>(`/quotations/${encodeURIComponent(token)}/downloaded`, { method: 'POST', signal, referrerPolicy: 'no-referrer', cache: 'no-store' });
}
