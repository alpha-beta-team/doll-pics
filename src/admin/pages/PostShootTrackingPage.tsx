import './booking-detail.css';
import './post-shoot.css';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RefreshCw, Search, UserRound, CalendarDays, Plus } from 'lucide-react';
import { api } from '../api/client';
import { orderWorkflowApi } from '../api/orderWorkflow';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { queueFor, isOverdue, trackingActions, type TrackingRow } from '../components/postShootTracking';
import { BulkOrderUpdate } from '../components/bookings/BulkOrderUpdate';
import { OrderWorkflowPanel, type OrderWorkflowHandle } from '../components/bookings/OrderWorkflowPanel';
import { BookingDialog } from '../components/bookings/BookingDetailSections';
import { subForRow, subLabels, tabForQueue, trackingTabs, shootAge } from '../components/trackingStages';
import { ORDER_STAGE_LABELS, orderDate, type OrderStage } from '../../shared/orderWorkflow';
import type { Booking, StaffAccountOption } from '../types';
function TrackingDialog({
  booking,
  staff,
  canManage,
  autoOpen,
  actionStage,
  onClose,
  onSaved,
}: {
  booking: Booking;
  staff: StaffAccountOption[];
  canManage: boolean;
  autoOpen: boolean | 'details';
  actionStage?: OrderStage | 'initialize';
  onClose: () => void;
  onSaved: () => void;
}) {
  const panel = useRef<OrderWorkflowHandle>(null),
    opened = useRef(false);
  const ready = useCallback(
    (value: boolean) => {
      if (value && autoOpen && !opened.current) {
        opened.current = true;
        setTimeout(
          () => (autoOpen === 'details' ? panel.current?.openDetails() : panel.current?.openStatus(actionStage)),
          0,
        );
      }
    },
    [autoOpen, actionStage],
  );
  if (autoOpen === true && actionStage === 'awaiting_selection') {
    return <OrderWorkflowPanel dialogsOnly initialStage={actionStage} booking={booking} staff={staff}
      canManage={canManage} onDismiss={onClose} onSaved={() => { onClose(); onSaved(); }} />;
  }
  return (
    <BookingDialog
      variant="drawer"
      title={`Order tracking · ${booking.customerName}`}
      className="admin-theme booking-detail"
      onClose={onClose}
    >
      <Link
        to={`/admin/bookings/${booking.id}`}
        className="mb-3 inline-block text-sm font-semibold text-teal-800 underline"
      >
        Open booking details / Follow up
      </Link>
      <OrderWorkflowPanel
        ref={panel}
        booking={booking}
        staff={staff}
        canManage={canManage}
        onSaved={onSaved}
        onReadyChange={ready}
      />
    </BookingDialog>
  );
}
export function PostShootTrackingPage() {
  const { canManage } = useFeatureAccess('bookings');
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [staff, setStaff] = useState<StaffAccountOption[]>([]);
  const rowCache = useRef(new Map<string, TrackingRow>());
  const scope = params.get('scope') === 'overdue' || params.get('filter') === 'overdue' ? 'overdue' : 'all';
  const query = params.get('search') || '',
    from = params.get('from') || '',
    to = params.get('to') || '';
  const stage = params.get('stage') || (params.get('scope') === 'delivered' ? 'delivered' : '');
  const filters = useMemo(() => ({ search: query, from, to }), [query, from, to]);
  const legacyQueue = stage === 'edited' ? 'editing' : stage;
  const tab = trackingTabs.find((item) => item.key === params.get('tab')) || tabForQueue(legacyQueue);
  const sub = params.get('sub') || (stage === 'prints' ? '' : legacyQueue);
  const sort = params.get('sort') || 'newest';
  const [start, setStart] = useState(false);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set()),
    [bulk, setBulk] = useState<TrackingRow[] | null>(null);
  const [individual, setIndividual] = useState<{
      booking: Booking;
      action: boolean | 'details';
      actionStage?: OrderStage | 'initialize';
    } | null>(null),
    [opening, setOpening] = useState('');
  const [now, setNow] = useState(Date.now());
  const requestSequence = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError('');
    try {
      const data = await orderWorkflowApi.list(filters);
      if (sequence !== requestSequence.current) return;
      data.rows.forEach((row) => rowCache.current.set(row.id, row));
      setRows(data.rows);
      setNow(Date.now());
    } catch (cause) {
      if (sequence === requestSequence.current) {
        setError(cause instanceof Error ? cause.message : 'Could not load orders');
        throw cause;
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [filters]);
  useEffect(() => {
    void load().catch(() => {});
    const sequence = requestSequence;
    return () => {
      sequence.current++;
    };
  }, [load]);
  useEffect(() => {
    if (canManage)
      void api
        .getAssignableStaffAccounts()
        .then(setStaff)
        .catch(() => setNotice('Staff options unavailable. Refresh to retry.'));
  }, [canManage]);
  useEffect(() => {
    const timer = setInterval(() => {
      void load().catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, [load]);
  const updateParams = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    next.delete('page');
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setParams(next);
  };
  const changeView = (changes: Record<string, string>) => {
    updateParams(changes);
    void load().catch(() => {});
  };
  const stageRows = rows.filter((row) => {
    const queue = queueFor(row);
    if (tab.key !== 'all' && tabForQueue(queue) !== tab) return false;
    if (stage === 'prints' && !params.has('sub')) return queue === 'prints';
    return !sub || subForRow(row) === sub;
  });
  const overdueCount = stageRows.filter((row) => isOverdue(row, now)).length;
  const filtered = stageRows.filter((row) => scope !== 'overdue' || isOverdue(row, now));
  filtered.sort((a, b) => {
    if (sort === 'customer') return a.customerName.localeCompare(b.customerName);
    if (sort === 'stage') {
      const diff = trackingTabs.indexOf(tabForQueue(queueFor(a))) - trackingTabs.indexOf(tabForQueue(queueFor(b)));
      if (diff) return diff;
    }
    return sort === 'oldest'
      ? a.bookingDate.localeCompare(b.bookingDate)
      : b.bookingDate.localeCompare(a.bookingDate);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / 25));
  const page = Math.min(pageCount, Math.max(1, Math.floor(Number(params.get('page')) || 1)));
  const visible = filtered.slice((page - 1) * 25, page * 25);
  const selectedRows = [...selected]
    .map((id) => rowCache.current.get(id))
    .filter((row): row is TrackingRow => Boolean(row));
  const hiddenSelected = selectedRows.filter((row) => !filtered.some((item) => item.id === row.id)).length;
  const selectPage = (checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      visible.forEach((row) => (checked ? next.add(row.id) : next.delete(row.id)));
      return next;
    });
  const allPage = visible.length > 0 && visible.every((row) => selected.has(row.id));
  const open = async (row: TrackingRow, action: boolean | 'details', actionStage?: OrderStage | 'initialize') => {
    if (opening) return;
    setOpening(row.id);
    setError('');
    try {
      const booking = await api.getBooking(row.id);
      if (!booking) throw new Error('Booking no longer available');
      setIndividual({ booking, action, actionStage });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open order');
    } finally {
      setOpening('');
    }
  };
  const refresh = () => {
    void load().catch(() => {});
    if (canManage)
      void api
        .getAssignableStaffAccounts()
        .then(setStaff)
        .catch(() => setNotice('Staff options unavailable. Try Refresh again.'));
  };
  const completed = async (ids: string[]) => {
    setSelected((current) => new Set([...current].filter((id) => !ids.includes(id))));
    await load();
  };
  const movePage = (value: number) => {
    const next = new URLSearchParams(params);
    next.set('page', String(value));
    setParams(next);
  };
  const setupRows = rows.filter((row) => !row.order);
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const group = tabForQueue(queueFor(row)).key;
    counts.set(group, (counts.get(group) || 0) + 1);
    const key = 'sub-' + subForRow(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const subs = Object.entries(subLabels).filter(
    ([key]) => tabForQueue(key === 'printer_finished' ? 'prints' : key) === tab,
  );
  const clear = { search: '', from: '', to: '', tab: '', sub: '', stage: '', scope: '', filter: '' };
  const hasFilters = Boolean(query || from || to || tab.key !== 'all' || scope === 'overdue');
  const blocked = loading || Boolean(error);
  const openBulk = (candidates: TrackingRow[], initialize: boolean) => {
    setStart(initialize);
    setBulk(candidates);
  };
  const groupDates = sort === 'newest' || sort === 'oldest';
  const dateCounts = new Map<string, number>();
  visible.forEach((row) => dateCounts.set(row.bookingDate, (dateCounts.get(row.bookingDate) || 0) + 1));
  return (
    <section className="ps-workspace" aria-labelledby="ps-title">
      {error && (
        <p role="alert">
          {error} <button onClick={refresh}>Retry loading</button>
        </p>
      )}
      {notice && (
        <p role="status">
          {notice} <button onClick={() => setNotice('')}>Dismiss</button>
        </p>
      )}
      <header className="ps-heading">
        <div>
          <h1 id="ps-title">Post-shoot tracking</h1>
          <p>
            {loading
              ? 'Loading orders…'
              : `${rows.length} orders · ${setupRows.length} to start · ${counts.get('sub-photos') || 0} to share for selection`}
          </p>
        </div>
        <div className="ps-heading-actions">
          {canManage && (
            <button
              className="ps-primary"
              disabled={blocked || !setupRows.length}
              onClick={() => openBulk(setupRows, true)}
            >
              <Plus size={15} /> Start order tracking <span>{setupRows.length}</span>
            </button>
          )}
          <button
            title="Refresh orders"
            aria-label="Refresh orders"
            disabled={loading || !!bulk}
            onClick={refresh}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>
      <div className="ps-tabs" role="group" aria-label="Order stages">
        {trackingTabs.map((item) => (
          <button
            key={item.key}
            aria-label={item.label}
            aria-pressed={tab === item}
            onClick={() => changeView({ tab: item.key, stage: '', sub: '', scope: '', filter: '' })}
          >
            {item.label} <b>{item.key === 'all' ? rows.length : counts.get(item.key) || 0}</b>
          </button>
        ))}
      </div>
      {subs.length > 0 && (
        <div className="ps-subs" aria-label="Stage filters">
          <button aria-pressed={!sub} onClick={() => changeView({ tab: tab.key, sub: '', stage: '' })}>
            All in stage
          </button>
          {subs.map(([key, label]) => (
            <button
              key={key}
              aria-pressed={sub === key}
              onClick={() => changeView({ tab: tab.key, sub: key, stage: '', scope: '', filter: '' })}
            >
              {label} <b>{counts.get('sub-' + key) || 0}</b>
            </button>
          ))}
        </div>
      )}
      <section className="ps-card" aria-label="Order workspace">
        {canManage && selectedRows.length > 0 && (
          <div className="ps-selection" role="region" aria-label="Order selection">
            <strong>{selectedRows.length} orders selected</strong>
            {hiddenSelected > 0 && <span>{hiddenSelected} outside current filters.</span>}
            <button disabled={blocked} onClick={() => setSelected(new Set(filtered.map((row) => row.id)))}>
              Select all {filtered.length} matching orders
            </button>
            <button disabled={blocked} onClick={() => openBulk(selectedRows, true)}>
              Start order tracking
            </button>
            <button disabled={blocked} onClick={() => openBulk(selectedRows, false)}>
              Bulk update
            </button>
            <button onClick={() => setSelected(new Set())}>Clear selection</button>
          </div>
        )}
        <div className="ps-toolbar">
          <label className="ps-search">
            <Search size={16} />
            <input
              aria-label="Search orders"
              placeholder="Customer, phone or reference"
              value={query}
              onChange={(e) => updateParams({ search: e.target.value })}
            />
          </label>
          <div className="ps-range" role="group" aria-label="Shoot date range">
            <CalendarDays size={15} />
            <input
              aria-label="Shoot from"
              type="date"
              value={from}
              onChange={(e) => updateParams({ from: e.target.value })}
            />{' '}
            –{' '}
            <input
              aria-label="Shoot to"
              type="date"
              min={from}
              value={to}
              onChange={(e) => updateParams({ to: e.target.value })}
            />
          </div>
          <button
            aria-label="Overdue"
            aria-pressed={scope === 'overdue'}
            onClick={() => changeView({ scope: scope === 'overdue' ? '' : 'overdue', filter: '', tab: tab.key })}
          >
            Overdue {overdueCount}
          </button>
          {hasFilters && <button onClick={() => updateParams(clear)}>Clear filters</button>}
          <select aria-label="Sort orders" value={sort} onChange={(e) => updateParams({ sort: e.target.value })}>
            <option value="newest">Shoot date, newest</option>
            <option value="oldest">Waiting longest</option>
            <option value="stage">Stage</option>
            <option value="customer">Customer name</option>
          </select>
        </div>
        <div className="ps-table-wrap">
          <table className="ps-table">
            <thead>
              <tr>
                {canManage && (
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select current page"
                      checked={allPage}
                      disabled={blocked || !visible.length}
                      onChange={(e) => selectPage(e.target.checked)}
                    />
                  </th>
                )}
                {['Customer', 'Shoot · owner', 'Since shoot', 'Progress', 'Actions'].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, index) => {
                const queue = queueFor(row),
                  phase = tabForQueue(queue),
                  position = trackingTabs.indexOf(phase);
                const age = shootAge(row.bookingDate, now);
                const late = isOverdue(row, now);
                const actions = trackingActions(row);
                const detail = row.order ? ORDER_STAGE_LABELS[row.order.stage] : 'No order workflow';
                const subKey = subForRow(row);
                const segmentCount = row.order?.mode === 'digital' ? 3 : 5;
                const waiting = queue === 'selection' || queue === 'print_selection';
                const rowSummary =
                  queue === 'delivered' && row.order?.mode === 'digital'
                    ? 'Digital order · completed at edit sharing'
                    : subKey === 'printer_finished'
                      ? 'Printer finished · awaiting studio receipt'
                      : detail;
                return (
                  <Fragment key={row.id}>
                    {groupDates && (index === 0 || visible[index - 1].bookingDate !== row.bookingDate) && (
                      <tr className="ps-group">
                        <th colSpan={canManage ? 6 : 5} scope="rowgroup">
                          {age.group} <small>{dateCounts.get(row.bookingDate)} on this page</small>
                        </th>
                      </tr>
                    )}
                    <tr className="ps-row" data-selected={selected.has(row.id)}>
                      {canManage && (
                        <td className="ps-check">
                          <input
                            type="checkbox"
                            aria-label={'Select ' + row.customerName}
                            checked={selected.has(row.id)}
                            disabled={blocked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelected((current) => {
                                const next = new Set(current);
                                if (checked) next.add(row.id);
                                else next.delete(row.id);
                                return next;
                              });
                            }}
                          />
                        </td>
                      )}
                      <td>
                        <div className="ps-person">
                          <i aria-hidden="true" data-tone={row.customerName.charCodeAt(0) % 4}>
                            {row.customerName
                              .trim()
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((word) => word[0])
                              .join('')
                              .toUpperCase()}
                          </i>
                          <div>
                            <button className="ps-name" disabled={!!opening} onClick={() => void open(row, false)}>
                              {row.customerName}
                            </button>
                            <small>
                              {[row.customerPhone, row.customerCode || row.reference].filter(Boolean).join(' · ')}
                            </small>
                            {row.order && age.days < 0 && (
                              <small className="ps-warning">Shoot is scheduled in the future</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {row.shootType || 'Shoot type unavailable'}
                        <small>
                          <UserRound size={12} /> {row.order?.assigneeName || 'Owner unavailable'}
                        </small>
                      </td>
                      <td>
                        <span className="ps-age" data-future={age.days < 0}>
                          {age.label}
                        </span>
                      </td>
                      <td>
                        <div className="ps-progress" aria-hidden="true">
                          {[1, 2, 3, 4, 5].slice(0, segmentCount).map((n) => (
                            <i
                              key={n}
                              data-fill={
                                phase.key === 'cancelled'
                                  ? ''
                                  : n < position
                                    ? 'done'
                                    : n === position
                                      ? 'current'
                                      : ''
                              }
                            />
                          ))}
                        </div>
                        <strong>{phase.label}</strong>
                        <small>
                          {row.order?.state === 'active' && `Stage ${position} of ${segmentCount} · `}
                          {rowSummary}
                        </small>
                        {queue === 'editing' && row.order?.editingDueAt && (
                          <small className={late ? 'ps-warning' : undefined}>
                            {late ? 'Editing overdue' : 'Editing due'} · {orderDate(row.order.editingDueAt)} IST
                          </small>
                        )}
                      </td>
                      <td>
                        <div className="ps-actions">
                          {waiting && <span className="ps-wait">{subLabels[queue]}</span>}
                          {canManage &&
                            actions.map((action, i) => (
                              <button
                                key={action.stage || 'start'}
                                className={
                                  i === 0 &&
                                  ['photos', 'editing', 'print', 'prints', 'handover', 'receipt'].includes(queue)
                                    ? 'ps-primary'
                                    : ''
                                }
                                disabled={blocked || !!opening || (!row.order && age.days < 0)}
                                onClick={() => void open(row, true, action.stage || 'initialize')}
                              >
                                {action.label}
                              </button>
                            ))}
                          {canManage && row.order?.stage === 'printing' && subKey === 'prints' && (
                            <button disabled={blocked || !!opening} onClick={() => void open(row, 'details')}>
                              Record completion
                            </button>
                          )}
                          <button
                            className="ps-chevron"
                            title="View tracking"
                            aria-label="View tracking"
                            disabled={!!opening}
                            onClick={() => void open(row, false)}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && !error && !visible.length && <p className="ps-empty">No orders match these filters.</p>}
        <footer>
          <span role="status">{loading ? 'Loading orders…' : filtered.length + ' matching orders'}</span>
          <div>
            <button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => movePage(page - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button
              aria-label="Next page"
              disabled={page >= pageCount || loading}
              onClick={() => movePage(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>
      {bulk && (
        <BulkOrderUpdate
          start={start}
          rows={bulk}
          staff={staff}
          onClose={() => setBulk(null)}
          onUpdated={completed}
        />
      )}
      {individual && (
        <TrackingDialog
          booking={individual.booking}
          autoOpen={individual.action}
          actionStage={individual.actionStage}
          staff={staff}
          canManage={canManage}
          onClose={() => setIndividual(null)}
          onSaved={() => {
            void load().catch(() => {});
            if (individual.actionStage === 'awaiting_selection') return;
            void api
              .getBooking(individual.booking.id)
              .then((booking) => {
                if (booking)
                  setIndividual((current) =>
                    current?.booking.id === booking.id ? { ...current, booking } : current,
                  );
              })
              .catch(() => setNotice('Order updated. Reopen tracking to refresh booking details.'));
          }}
        />
      )}
    </section>
  );
}
