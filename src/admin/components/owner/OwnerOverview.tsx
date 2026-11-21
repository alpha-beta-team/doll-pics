import { money, shortDate } from '../../reports/ownerDashboardFormat';
import { Link } from 'react-router-dom';
import type { OwnerOverviewReport } from '../../types';
import { leadSourceLabel } from '../leadSource';
import { AttentionRow, Bars, Metric, Panel, SectionTitle, type OpenQueue } from './OwnerDashboardWidgets';
export function OwnerOverview({ report, openQueue, openFinance }: { report: OwnerOverviewReport; openQueue: OpenQueue; openFinance: () => void }) {
  const d = report.dashboard!, p = d.previous, e = report.enquiries;
  const conversion = e.newEnquiries ? Math.round(e.converted / e.newEnquiries * 1000) / 10 : 0;
  const period = `${shortDate(report.period.dateFrom)}–${shortDate(report.period.dateTo)}`;
  const count = (key: string) => d.totals[key]?.count || 0;
  return <>
    <SectionTitle title="Selected period" detail={`${period} · hover or focus a change to see the previous value`} />
    <div className="od-grid od-four">
      <Metric label="Collections" value={money(report.finance.summary.paymentsReceived)} current={report.finance.summary.paymentsReceived} previous={p.paymentsReceived} previousFormat={money} detail={<>Payments by paid date · <span className="od-link">Finance →</span></>} onClick={openFinance} />
      <Metric label="Enquiries received" value={e.newEnquiries} current={e.newEnquiries} previous={p.enquiries} mode="count" detail="Leads created in the period" onClick={() => openQueue('enquiries', 'Enquiries received')} />
      <Metric label="Confirmations" value={report.finance.summary.confirmedBookings} current={report.finance.summary.confirmedBookings} previous={p.confirmations} mode="count" detail="Priced bookings confirmed in the period" onClick={() => openQueue('confirmations', 'Priced confirmations')} />
      <Metric label="Lead conversion" value={`${conversion}%`} current={conversion} previous={p.conversionRate} mode="points" previousFormat={value => `${value}%`} detail={`${e.converted} of the ${e.newEnquiries} leads received this period are now booked`} onClick={() => openQueue('converted', 'Converted leads from this period')} />
    </div>
    <SectionTitle title="Right now" detail="Current position · not affected by the date range" />
    <div className="od-grid od-three">
      <Metric label="Outstanding" value={money(report.finance.summary.outstandingNow)} detail={<>All dates · {money(report.finance.summary.overdueNow)} overdue · <span className="od-link">Finance →</span></>} onClick={openFinance} />
      <Metric label="Overdue delivery" value={count('deadlines')} tone="od-red" detail="Editing or delivery deadline passed · View →" onClick={() => openQueue('deadlines', 'Overdue editing or delivery')} />
      <div className="od-metric"><div className="od-metric-label">Follow-ups</div><button className="od-follow-up" onClick={() => openQueue('followUpsToday', 'Follow-ups due today')}>{d.today} <span>due today →</span></button><button className="od-link od-follow-up-overdue" onClick={() => openQueue('followUpsOverdue', 'Overdue follow-ups')}>{d.overdue} overdue · enquiries and booking tasks →</button></div>
    </div>
    <div className="od-grid od-funnel-grid od-spaced">
      <Panel title="Enquiry funnel" detail={`${period} leads`}>
        <Bars funnel rows={[{ label: 'Received', value: e.newEnquiries, color: '#1D5A8C' }, { label: 'Contacted*', value: e.engaged, color: '#1D5A8C' }, { label: 'Converted', value: e.converted, color: '#0B5C60' }, { label: 'Lost', value: e.closedLost, color: '#B42318' }]} footer={<>Same cohort throughout: leads received {period}. *Contacted/follow-up/booked stages; not proof a call occurred. Stage and conversion measures can overlap.</>} />
      </Panel>
      <Panel title="Enquiry sources" detail={`${period} leads`}><Bars rows={e.sourceBreakdown.map(row => ({ label: leadSourceLabel(row.source), value: row.count }))} /></Panel>
    </div>
    <div className="od-grid od-two od-spaced">
      <Panel title="Production attention" detail={<Link to="/admin/post-shoot">Post-shoot tracking →</Link>}>
        <AttentionRow title="Share photos for selection" value={count('photos')} onClick={() => openQueue('photos', 'Photos to share for selection')} />
        <AttentionRow tone="danger" title="Editing past 5-day deadline" value={count('editing')} onClick={() => openQueue('editing', 'Overdue editing')} />
        <AttentionRow title="Ready for handover or courier" value={count('handover')} onClick={() => openQueue('handover', 'Ready for handover or courier')} />
        <AttentionRow tone="blue" title="Shipped, awaiting delivery" value={count('shipped')} onClick={() => openQueue('shipped', 'Shipped, awaiting delivery')} />
      </Panel>
      <Panel title="Data quality">
        <AttentionRow tone="warning" title="Shoots not set up for tracking" detail="Older shoots with no order workflow · set up in bulk" value={count('setup')} onClick={() => openQueue('setup', 'Tracking setup required')} />
        <AttentionRow tone="warning" title="Unpriced bookings" detail="Agreed total empty, not counted as ₹0" value={count('unpriced')} onClick={() => openQueue('unpriced', 'Unpriced bookings')} />
        <AttentionRow tone="warning" title="Missing payment due date" detail="Balance due but no due date" value={count('missingDueDates')} onClick={() => openQueue('missingDueDates', 'Missing payment due dates')} />
        <AttentionRow tone="blue" title="Overpaid" detail="Collected more than agreed · kept visible" value={count('overpaid')} onClick={() => openQueue('overpaid', 'Overpaid bookings')} />
      </Panel>
    </div>
  </>;
}
