import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Camera,
  Eye,
  GripVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { api } from '../api/client';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminIconButton,
  AdminLoadingState,
  AdminPageHeader,
} from '../components/ui';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  removeService,
  reorderServices,
  sortAndRenumberServices,
} from '../services/serviceNavLinks';
import type { ServiceNavLink } from '../types';

type ServicesLocationState = { notice?: string } | null;

function sortableServiceId(service: ServiceNavLink, index: number): string {
  return service.id || `service-without-id-${index}`;
}

export function ServicesPage() {
  const { canManage, isReadOnly } = useFeatureAccess('site_content');
  const confirm = useConfirmDialog();
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState<ServiceNavLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(
    ((location.state as ServicesLocationState)?.notice ?? ''),
  );
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const sortableIds = useMemo(
    () => services.map(sortableServiceId),
    [services],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const content = await api.getSiteContent();
      setServices(sortAndRenumberServices(content.serviceNavLinks));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (
    next: ServiceNavLink[],
    action: string,
    successMessage: string,
    optimistic = false,
  ) => {
    const previous = services;
    if (optimistic) setServices(next);
    setSavingAction(action);
    setError('');
    setSuccess('');
    try {
      const saved = await api.updateSiteContent({ serviceNavLinks: next });
      setServices(sortAndRenumberServices(saved.serviceNavLinks));
      setSuccess(successMessage);
    } catch (cause) {
      if (optimistic) setServices(previous);
      setError(cause instanceof Error ? cause.message : 'Could not update services.');
    } finally {
      setSavingAction(null);
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || savingAction) return;
    const fromIndex = sortableIds.indexOf(String(active.id));
    const toIndex = sortableIds.indexOf(String(over.id));
    if (fromIndex < 0 || toIndex < 0) return;
    void persist(
      reorderServices(services, fromIndex, toIndex),
      `reorder:${String(active.id)}`,
      'Service order updated.',
      true,
    );
  };

  const handleDelete = async (service: ServiceNavLink) => {
    if (!service.id) return;
    const accepted = await confirm({
      title: `Delete ${service.label || 'this service'}?`,
      description:
        'It will be removed from the header, footer, homepage cards, landing route, and sitemap. This action cannot be undone.',
      confirmLabel: 'Delete service',
      variant: 'danger',
    });
    if (!accepted) return;
    await persist(
      removeService(services, service.id),
      `delete:${service.id}`,
      'Service deleted.',
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AdminPageHeader
        eyebrow="Website"
        title="Services"
        description={canManage
          ? 'Drag the handle to reorder services across the website. Changes save automatically after each drop.'
          : 'Review the services shown in the website header, footer, homepage cards, landing pages, and sitemap.'}
        actions={canManage ? (
          <AdminButton onClick={() => navigate('/admin/services/new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add service
          </AdminButton>
        ) : isReadOnly ? <ReadOnlyNotice /> : undefined}
      />

      {error && (
        <AdminAlert>
          <div className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="font-semibold underline underline-offset-2">
              Try again
            </button>
          </div>
        </AdminAlert>
      )}
      {success && <AdminAlert tone="success">{success}</AdminAlert>}

      {loading ? (
        <AdminCard><AdminLoadingState label="Loading services…" /></AdminCard>
      ) : services.length === 0 ? (
        <AdminEmptyState
          icon={Camera}
          title="No services yet"
          description="Create a draft service, complete its content, and publish it when it is ready for the website."
          action={canManage ? (
            <AdminButton onClick={() => navigate('/admin/services/new')}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add service
            </AdminButton>
          ) : undefined}
        />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className={`hidden items-center gap-4 border-b border-admin-border bg-admin-muted/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-admin-subtle md:grid ${canManage ? 'grid-cols-[40px_minmax(0,1.5fr)_minmax(0,1.25fr)_auto_auto]' : 'grid-cols-[minmax(0,1.5fr)_minmax(0,1.25fr)_auto_auto]'}`}>
            {canManage && <span><span className="sr-only">Reorder</span></span>}
            <span>Service</span>
            <span>Public path</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-admin-border">
                {services.map((service, index) => (
                  <SortableServiceRow
                    key={sortableIds[index]}
                    sortId={sortableIds[index]}
                    service={service}
                    canManage={canManage}
                    disabled={Boolean(savingAction)}
                    deleting={savingAction === `delete:${service.id ?? index}`}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </AdminCard>
      )}
    </div>
  );
}

function SortableServiceRow({
  sortId,
  service,
  canManage,
  disabled,
  deleting,
  onDelete,
}: {
  sortId: string;
  service: ServiceNavLink;
  canManage: boolean;
  disabled: boolean;
  deleting: boolean;
  onDelete: (service: ServiceNavLink) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortId, disabled: !canManage || disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`relative grid gap-4 px-4 py-4 transition-[background-color,box-shadow,opacity] md:items-center md:px-5 ${canManage ? 'grid-cols-[40px_minmax(0,1fr)] md:grid-cols-[40px_minmax(0,1.5fr)_minmax(0,1.25fr)_auto_auto]' : 'md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.25fr)_auto_auto]'} ${isDragging ? 'bg-admin-surface opacity-90 shadow-xl ring-2 ring-inset ring-admin-primary/30' : 'bg-admin-surface'}`}
    >
      {canManage && (
        <div className="flex items-center justify-center self-stretch">
          <button
            ref={setActivatorNodeRef}
            type="button"
            disabled={disabled}
            aria-label={`Drag to reorder ${service.label || 'service'}`}
            title="Drag to reorder"
            className="touch-none rounded-lg p-2 text-admin-subtle outline-none transition hover:bg-admin-muted hover:text-admin-text focus-visible:ring-2 focus-visible:ring-admin-focus disabled:cursor-wait disabled:opacity-40 data-[dragging=true]:cursor-grabbing"
            data-dragging={isDragging}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 items-center gap-3">
        <ServiceThumbnail service={service} />
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-admin-text">{service.label || 'Untitled service'}</h2>
          <p className="mt-0.5 line-clamp-1 text-xs text-admin-subtle">
            {service.description || 'No card description'}
          </p>
        </div>
      </div>

      <p className={`break-all font-mono text-xs text-admin-secondary md:text-sm ${canManage ? 'col-span-2 md:col-span-1' : ''}`}>
        {service.path || 'No path'}
      </p>

      <div className={canManage ? 'col-start-2 md:col-start-auto' : ''}>
        <AdminBadge className={service.isPublished
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-amber-100 text-amber-900'}>
          {service.isPublished ? 'Published' : 'Draft'}
        </AdminBadge>
      </div>

      <div className={`flex items-center justify-end gap-1.5 ${canManage ? 'col-span-2 md:col-span-1' : ''}`}>
        {service.id ? (
          <Link
            to={`/admin/services/${encodeURIComponent(service.id)}`}
            aria-label={`${canManage ? 'Edit' : 'View'} ${service.label || 'service'}`}
            title={`${canManage ? 'Edit' : 'View'} service`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-admin-border bg-admin-surface text-admin-secondary outline-none transition hover:border-admin-primary/40 hover:bg-admin-muted hover:text-admin-text focus-visible:ring-2 focus-visible:ring-admin-focus"
          >
            {canManage ? <Pencil className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </Link>
        ) : (
          <AdminIconButton label="Service is missing an id" disabled>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </AdminIconButton>
        )}

        {canManage && (
          <AdminIconButton
            label={`Delete ${service.label || 'service'}`}
            disabled={!service.id || disabled}
            onClick={() => void onDelete(service)}
            className="text-red-700 hover:border-red-200 hover:bg-red-50 hover:text-red-800"
          >
            {deleting
              ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              : <Trash2 className="h-4 w-4" aria-hidden="true" />}
          </AdminIconButton>
        )}
      </div>
    </article>
  );
}

function ServiceThumbnail({ service }: { service: ServiceNavLink }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(service.imageUrl) && !failed;
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-admin-border bg-admin-muted text-admin-subtle">
      {showImage ? (
        <img
          src={service.imageUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Camera className="h-5 w-5" aria-hidden="true" />
      )}
    </div>
  );
}
