import type { useBookingPricing } from '../hooks/useBookingPricing';
import { formatINR } from '../../lib/pricing';
export function SaleBookingPricing({ pricing, onApply }: { pricing: ReturnType<typeof useBookingPricing>; onApply?: (value: string) => void }) {
  const offer = pricing.preview?.pricing?.activeOffer;
  return <div className="col-span-full space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-slate-800">
    {pricing.pending ? <p>Checking package price…</p> : pricing.error ? <p role="alert">{pricing.error}</p> : <p>{offer ? `${offer.name}: ${formatINR(offer.basePrice)} → ${formatINR(offer.salePrice)} (save ${formatINR(offer.discountAmount)})` : pricing.preserve ? 'This booking keeps its saved package price.' : 'Current package pricing checked.'}</p>}
    {pricing.preview?.pricingMode === 'startingFrom' && <p>This is a starting price. Enter the final agreed total explicitly.</p>}
    <p className="text-xs">A sale is applied when the booking is confirmed. Refresh and review the amount if the offer changes.</p>
    {pricing.preview?.pricingMode === 'price' && pricing.preview.pricing?.effectivePrice != null && onApply && <button type="button" className="mr-4 font-semibold text-blue-700 underline" onClick={() => onApply(String(pricing.preview!.pricing!.effectivePrice))}>Use {formatINR(pricing.preview.pricing.effectivePrice)}</button>}
    <button type="button" onClick={pricing.refresh} className="font-semibold text-blue-700 underline">Refresh price</button>
    <label className="block text-xs">Owner price override reason (required when changing sale price)<input maxLength={500} value={pricing.reason} onChange={event => pricing.setReason(event.target.value)} className="mt-1 block w-full rounded-lg border border-blue-200 bg-white p-2" /></label>
  </div>;
}
