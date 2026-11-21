import { money, shortDate } from '../../reports/ownerDashboardFormat';
import type { SalarySummary } from '../../api/salary';
import type { OwnerOverviewReport } from '../../types';
import { Bars, Metric, Panel, PaymentsChart, SectionTitle, TablePanel, type OpenQueue } from './OwnerDashboardWidgets';
export function OwnerFinance({ report, salary, salaryError, retrySalary, openQueue, onPayment }: { report: OwnerOverviewReport; salary: SalarySummary | null; salaryError: string; retrySalary: () => void; openQueue: OpenQueue; onPayment: (id: string) => void }) {
  const d = report.dashboard!, f = report.finance, s = f.summary, p = d.previous;
  const period = `${shortDate(report.period.dateFrom)}–${shortDate(report.period.dateTo)}`;
  const ageing = ['0–7 days', '8–30 days', '31–60 days', '60+ days'].map((label, i) => ({ label, value: d.ageing.find(row => row.label === label)?.amount || 0, color: ['#D98A0B', '#C2410C', '#B42318', '#7F1D1D'][i] }));
  return <>
    <SectionTitle title="Selected period" detail={`${period} · hover or focus a change to see the previous value`} />
    <div className="od-grid od-five">
      <Metric label="Payments received" value={money(s.paymentsReceived)} current={s.paymentsReceived} previous={p.paymentsReceived} previousFormat={money} detail={`${s.paymentTransactions} payments · avg ${money(s.averagePaymentReceived)} · by paid date`} onClick={() => openQueue('collections', 'Payments received')} />
      <Metric label="Booked revenue" value={money(s.bookedRevenue)} current={s.bookedRevenue} previous={p.bookedRevenue} previousFormat={money} detail={`${s.confirmedBookings} priced bookings · avg ${money(s.averageBookingValue)} · by confirmed date`} onClick={() => openQueue('confirmations', 'Priced confirmations')} />
      <Metric label="Shoot value" value={money(s.shootValue)} current={s.shootValue} previous={p.shootValue} previousFormat={money} detail="Agreed totals by shoot date · not proof the shoot happened" />
      <Metric higherIsBetter={false} label="Salary spend" value={money(s.salarySpend)} current={s.salarySpend} previous={p.salarySpend} previousFormat={money} detail="All salary types · by transaction date" />
      <Metric label="Net cash after salary" value={money(s.netCashAfterSalary)} current={s.netCashAfterSalary} previous={p.netCashAfterSalary} previousFormat={money} detail="Payments − salary. Not profit: rent, printing and other costs are not recorded" />
    </div>
    <div className="od-grid od-chart-grid od-spaced">
      <Panel title="Payments, selected vs previous period" detail={period}><PaymentsChart report={report} /></Panel>
      <Panel title="By payment method" detail={period}><Bars currency rows={['upi', 'cash', 'bank_transfer', 'card', 'other'].map((method, i) => ({ label: ['UPI', 'Cash', 'Bank transfer', 'Card', 'Other'][i], value: d.paymentMethods.filter(row => row.method === method || (method === 'other' && !['upi', 'cash', 'bank_transfer', 'card'].includes(row.method))).reduce((sum, row) => sum + row.amount, 0), color: ['#0B5C60', '#2F6B1F', '#1D5A8C', '#5B2A9A', '#9AA5A4'][i] }))} footer="Recorded method · cash deposits must be checked against the cash book" /></Panel>
    </div>
    <SectionTitle title="Receivables right now" detail="All dates · not affected by the date range" />
    <div className="od-grid od-receivables">
      <Metric label="Outstanding" value={money(s.outstandingNow)} detail={`All dates · includes ${money(d.draftOutstanding)} on draft bookings`} onClick={() => openQueue('outstanding', 'Outstanding balances')} />
      <Metric label="Due next 7 days" value={money(d.totals.dueSoon.amount)} detail={`${d.totals.dueSoon.count} bookings · tomorrow through seven days from today`} onClick={() => openQueue('dueSoon', 'Due in the next 7 days')} />
      <Metric label="Overpaid" value={money(Math.abs(d.totals.overpaid.amount))} detail={`${d.totals.overpaid.count} bookings · kept visible, not clamped to zero`} onClick={() => openQueue('overpaid', 'Overpaid bookings')} />
      <div className="od-metric"><button className="od-link" onClick={() => openQueue('overdue', 'Overdue balances')}>Overdue {money(s.overdueNow)} · by days past due →</button><div className="od-ageing-bar" aria-hidden="true">{ageing.map(row => <i key={row.label} style={{ flex: row.value || 0, background: row.color }} />)}</div><div className="od-ageing-labels">{ageing.map(row => <div key={row.label}><span><i style={{ background: row.color }} />{row.label}</span><b>{money(row.value)}</b></div>)}</div></div>
    </div>
    <div className="od-grid od-tables-grid od-spaced">
      <TablePanel title="Overdue balances" data={d.overduePayments} detail="Top 20 by balance · Record payment is owner only" onView={() => openQueue('overdue', 'Overdue balances')} onPayment={onPayment} />
      <TablePanel title="Due in the next 7 days" data={d.dueSoon} onView={() => openQueue('dueSoon', 'Due in the next 7 days')} onPayment={onPayment} />
    </div>
    <div className="od-grid od-three od-spaced">
      <Panel title="Payment state"><Bars rows={(['paid', 'partial', 'unpaid', 'overpaid'] as const).map((key, i) => ({ label: key[0].toUpperCase() + key.slice(1), value: f.paymentStatus[key], color: ['#2F6B1F', '#D98A0B', '#B42318', '#1D5A8C'][i] }))} footer="Bookings · excludes cancelled, includes drafts · unpriced listed separately" /></Panel>
      <Panel title="Booked revenue by shoot type" detail={`All types · ${period}`}><Bars currency rows={f.revenueByShootType.map(row => ({ label: row.shootType, value: row.bookedRevenue }))} total={s.bookedRevenue} /></Panel>
      <Panel title="Salary by staff" detail={`${money(s.salarySpend)} · ${period}`}>{salaryError ? <p role="alert" className="od-padded">{salaryError} <button className="od-link" onClick={retrySalary}>Try again</button></p> : salary ? <><div className="od-salary-types">{salary.byType.map(row => <span key={row.type}>{row.type} <b>{money(row.total)}</b></span>)}</div><Bars currency rows={salary.byEmployee.map(row => ({ label: `${row.staff.name}${row.staff.employeeCode ? ` · ${row.staff.employeeCode}` : ''}`, value: row.total }))} /></> : <p role="status" className="od-empty">Loading salary breakdown…</p>}</Panel>
    </div>
    <div className="od-grid od-two od-spaced">
      <TablePanel unpriced title="Unpriced bookings" data={d.unpriced} detail={`${d.unpriced.total} bookings · not counted in revenue or outstanding until priced. Open a booking to set its price.`} onView={() => openQueue('unpriced', 'Unpriced bookings')} />
      <Panel title="Read these numbers carefully"><ul className="od-caveats"><li>Past periods can change: reports read current, editable bookings and payments.</li><li>Cancelling a booking does not record a refund; its payments stay in collections.</li><li>Outstanding includes drafts; booked revenue does not.</li><li>No refunds, GST, invoices or expenses are recorded in these figures.</li></ul></Panel>
    </div>
  </>;
}
