import { pdf } from '@react-pdf/renderer';
import type { PublicWeddingQuotation } from '../../shared/types';
import { QuotationPdfDocument } from './QuotationPdfDocument';

function canLoadImage(url: string) {
  return new Promise<boolean>((resolve) => {
    if (!url) return resolve(false);
    const image = new window.Image();
    const timeout = window.setTimeout(() => resolve(false), 5000);
    image.onload = () => { window.clearTimeout(timeout); resolve(true); };
    image.onerror = () => { window.clearTimeout(timeout); resolve(false); };
    image.referrerPolicy = 'no-referrer';
    image.src = url;
  });
}

export async function downloadQuotationPdf(quotation: PublicWeddingQuotation) {
  const imageUrls = [quotation.coverPhoto.url, ...quotation.galleryPhotos.map(item => item.url)].filter(Boolean);
  const checks = await Promise.all(imageUrls.map(async url => [url, await canLoadImage(url)] as const));
  const safeImages = new Set(checks.filter(([, valid]) => valid).map(([url]) => url));
  const blob = await pdf(<QuotationPdfDocument quotation={quotation} safeImages={safeImages} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Doll-Pictures-Quotation-${quotation.quotationNumber || 'Wedding'}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
