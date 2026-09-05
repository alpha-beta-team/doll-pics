import type { OwnerOverviewReport } from '../types';
import { AdminCard, AdminEmptyState } from './ui';

export function CampaignPerformance({ report }: { report: OwnerOverviewReport }) {
  if (!report.campaigns) return null;
  const totals = report.campaigns.reduce((sum, row) => ({
    enquiries: sum.enquiries + row.enquiries,
    bookings: sum.bookings + row.confirmedBookings,
    value: sum.value + row.bookedValue,
    unpriced: sum.unpriced + row.unpricedBookings,
  }), { enquiries: 0, bookings: 0, value: 0, unpriced: 0 });
  const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  return <AdminCard className="overflow-hidden">
    <div className="border-b border-admin-border p-4">
      <h2 className="text-sm font-semibold text-admin-text">Campaign performance</h2>
      <p className="mt-1 text-xs text-admin-subtle">First-touch campaigns for enquiries created in the selected period (Asia/Kolkata).</p>
    </div>
    <div className="p-4">
      <details className="mb-4 text-xs text-admin-subtle"><summary className="cursor-pointer py-2 font-medium">How these totals are calculated</summary><p className="mt-1">Bookings include currently confirmed, shoot-completed, and delivered bookings linked to these enquiries, even if confirmed later. Agreed booking value excludes unpriced bookings and is not cash received. Drafts and cancellations are excluded. Untagged means the visit was recorded without a source, medium, or campaign; Not recorded includes legacy and manually entered enquiries.</p></details>
      {report.campaigns.length ? <div role="region" aria-label="Campaign performance table" tabIndex={0} className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"><table className="min-w-[720px] w-full text-left text-sm">
        <caption className="sr-only">Campaign enquiries and linked booking values</caption>
        <thead className="text-xs text-admin-subtle"><tr>{['Campaign', 'Source / medium', 'Enquiries', 'Bookings', 'Agreed booking value', 'Unpriced'].map(label => <th key={label} scope="col" className="whitespace-nowrap px-3 py-2">{label}</th>)}</tr></thead>
        <tbody>{report.campaigns.map(row => <tr key={JSON.stringify([row.recorded, row.source, row.medium, row.campaign])} className="border-t border-admin-border">
          <th scope="row" className="max-w-64 break-words px-3 py-3 font-medium">{!row.recorded ? 'Not recorded' : row.campaign || (!row.source && !row.medium ? 'Untagged' : 'Campaign not set')}</th>
          <td className="max-w-64 break-words px-3 py-3">{[row.source || '—', row.medium || '—'].join(' / ')}</td>
          <td className="px-3 py-3">{row.enquiries}</td><td className="px-3 py-3">{row.confirmedBookings}</td><td className="whitespace-nowrap px-3 py-3">{money(row.bookedValue)}</td><td className="px-3 py-3">{row.unpricedBookings}</td>
        </tr>)}</tbody>
        <tfoot className="border-t border-admin-border font-semibold"><tr><th scope="row" colSpan={2} className="px-3 py-3">Total</th><td className="px-3 py-3">{totals.enquiries}</td><td className="px-3 py-3">{totals.bookings}</td><td className="whitespace-nowrap px-3 py-3">{money(totals.value)}</td><td className="px-3 py-3">{totals.unpriced}</td></tr></tfoot>
      </table></div> : <AdminEmptyState title="No enquiries in this period" description="Choose a different date range." />}
    </div>
  </AdminCard>;
}
