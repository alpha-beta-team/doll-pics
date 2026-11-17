import { milestoneLabel, orderDate } from '../shared/orderWorkflow';
import { formatCustomerName } from '../shared/formatCustomerName';
import { CalendarDays, Camera, Check, Clock3, ExternalLink, MapPin, MessageCircle, Phone } from 'lucide-react';
import identity from '../data/business-identity.json';
import type { CustomerBooking } from '../shared/customerBooking';
import { formatTimeWindow } from '../shared/bookingTime';

function dateLabel(value: string) {
  if (!value) return 'To be confirmed';
  const date = new Date(`${value.slice(0, 10)}T12:00:00+05:30`);
  return Number.isNaN(date.getTime()) ? 'To be confirmed' : new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
  }).format(date);
}

export function CustomerBookingContact() {
  return <div className="flex flex-wrap justify-center gap-3">
    <a href={`https://wa.me/${identity.whatsapp.e164.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#294d40] px-5 py-3 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" />WhatsApp studio</a>
    <a href={`tel:${identity.phone.e164}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d9ccba] bg-white px-5 py-3 text-sm font-semibold text-[#332d25]"><Phone className="h-4 w-4" />Call studio</a>
  </div>;
}

export function CustomerBookingPresentation({ booking }: { booking: CustomerBooking }) {
  const cancelled = booking.status === 'cancelled';
  const step = booking.status === 'delivered' ? 2 : booking.status === 'shoot_completed' ? 1 : 0;
  const links = [['Your gallery', booking.delivery.galleryUrl], ['Edited photographs', booking.delivery.editedUrl]]
    .filter((entry): entry is [string, string] => Boolean(entry[1] && /^https:\/\//i.test(entry[1])));
  return <div className="mx-auto w-full max-w-2xl space-y-5 text-[#332d25]">
    <header className="pb-2 text-center"><img src="/logo-doll.png" alt="Doll Pictures" className="mx-auto h-16 w-16 rounded-full object-cover" /><p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#82623e]">Doll Pictures · Your booking</p><h1 className="mt-2 break-words font-display text-3xl sm:text-4xl">Hello, {formatCustomerName(booking.customerName)}</h1><p className="mt-2 text-sm text-[#716553]">Your shoot details and delivery updates, in one place.</p></header>
    <section className="rounded-2xl border border-[#e2d8cb] bg-white p-5 shadow-sm sm:p-6" aria-label="Booking details">
      <h2 className="break-words text-xl font-semibold">{booking.shootType || booking.packageName || 'Your photography session'}</h2>
      {booking.packageName && booking.shootType && <p className="mt-1 break-words text-sm text-[#716553]">{booking.packageName}</p>}
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">{[
        [CalendarDays, 'Shoot date', dateLabel(booking.bookingDate)],
        [Clock3, 'Time · India', booking.startTime && booking.endTime ? formatTimeWindow(booking.startTime, booking.endTime) : 'To be confirmed'],
        [MapPin, 'Location', booking.location || 'To be confirmed'],
        [Camera, 'Expected delivery', cancelled ? 'Not applicable' : dateLabel(booking.expectedDeliveryDate)],
      ].map(([Icon, label, value]) => { const DetailIcon = Icon as typeof Camera; return <div key={String(label)} className="flex min-w-0 gap-3"><DetailIcon className="mt-1 h-4 w-4 shrink-0 text-[#947247]" /><div className="min-w-0"><dt className="text-xs text-[#716553]">{String(label)}</dt><dd className="mt-1 break-words text-sm font-medium">{String(value)}</dd></div></div>; })}</dl>
    </section>
    {Boolean(booking.deliverables?.length) && <section aria-label="Your deliverables" className="rounded-2xl border border-[#e2d8cb] bg-white p-5 sm:p-6"><h2 className="text-lg font-semibold">Your deliverables</h2><ul className="mt-3 divide-y divide-[#e2d8cb]">{booking.deliverables!.map(item => <li key={item.name} className="flex justify-between gap-4 py-3"><span className="break-words">{item.name}</span><span className="shrink-0 font-semibold">{item.quantity}</span></li>)}</ul></section>}
    <section className={`rounded-2xl border p-5 sm:p-6 ${cancelled ? 'border-rose-200 bg-rose-50' : 'border-[#e2d8cb] bg-white'}`} aria-label="Booking progress">
      <h2 className="text-lg font-semibold">{cancelled ? 'This booking has been cancelled' : 'Your progress'}</h2>
      {!cancelled && booking.orderProgress && <div className="mt-4 space-y-3"><p className="font-semibold">{milestoneLabel(booking.orderProgress.stage)}</p><p className="text-sm">{booking.orderProgress.state === 'completed' ? 'Order complete' : booking.orderProgress.state === 'cancelled' ? 'Order cancelled' : 'In progress'}</p><ul className="divide-y divide-[#e2d8cb]">{booking.orderProgress.milestones.map(item => <li key={item.stage} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{milestoneLabel(item.stage)}</span><span>{orderDate(item.at)} IST</span></li>)}</ul></div>}
      {cancelled ? <p className="mt-2 text-sm leading-6">Please contact the studio if you have a question or would like to discuss another date.</p> : !booking.orderProgress && <>
        <ol className="mt-5 space-y-5">{['Booking confirmed', 'Shoot completed', 'Delivered'].map((label, index) => <li key={label} className="flex gap-3" aria-current={index === step ? 'step' : undefined}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${index <= step ? 'bg-[#294d40] text-white' : 'bg-[#f0ebe4] text-[#716553]'}`}>{index <= step ? <Check className="h-4 w-4" /> : index + 1}</span><div><p className="pt-0.5 text-sm font-semibold">{label}</p>{index === step && <p className="mt-1 text-sm leading-6 text-[#716553]">{step === 0 ? 'We look forward to welcoming you. Check your shoot details above.' : step === 1 ? 'Preparing delivery — we’re preparing your photographs. Delivery links will appear here when released.' : links.length ? 'Your photographs are ready. Open your released links below.' : 'Your booking is marked delivered. Contact the studio for your photographs.'}</p>}</div></li>)}</ol>
      </>}
    </section>
    {booking.update && <section className="rounded-2xl border border-[#e2d8cb] bg-[#eee5d8] p-5"><h2 className="font-semibold">A note from the studio</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{booking.update}</p></section>}
    {!cancelled && booking.status === 'delivered' && links.length > 0 && <section className="rounded-2xl border border-[#cbdad0] bg-white p-5"><h2 className="text-lg font-semibold">Your photographs</h2><div className="mt-4 grid gap-3">{links.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[#edf3ee] px-4 py-3 text-sm font-semibold text-[#294d40]">{label}<ExternalLink className="h-4 w-4 shrink-0" /></a>)}</div></section>}
    <footer className="pb-3 pt-2 text-center"><p className="mb-4 text-sm text-[#716553]">Have a question? We’re here to help.</p><CustomerBookingContact /><p className="mt-5 text-xs leading-5 text-[#716553]">This is a private booking page. Share your link only with people you trust.</p></footer>
  </div>;
}
