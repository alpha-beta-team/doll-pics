import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  EyeOff,
  ExternalLink,
  FileText,
  Globe2,
  Image as ImageIcon,
  Save,
  Search,
  Settings2,
} from 'lucide-react';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { api } from '../api/client';
import { AdminTabs, type AdminTab } from '../components/AdminTabs';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { ServiceCardImageUpload } from '../components/ServiceCardImageUpload';
import {
  AdminAlert,
  AdminBreadcrumbs,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminLoadingState,
  AdminPageHeader,
  adminFieldClass,
} from '../components/ui';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  appendService,
  createEmptyService,
  normalizeServicePath,
  prepareServiceForSave,
  replaceService,
  SERVICE_ICON_OPTIONS,
  sortAndRenumberServices,
  type ServiceFormErrors,
  type ServicePublishField,
  validateService,
  validateServiceForPublish,
} from '../services/serviceNavLinks';
import type { ServiceNavLink } from '../types';

const EDITOR_TABS: AdminTab[] = [
  { id: 'details', label: 'Details', icon: Settings2 },
  { id: 'page', label: 'Page content', icon: FileText },
  { id: 'seo', label: 'SEO & publishing', icon: Search },
];

type EditorTab = 'details' | 'page' | 'seo';
type EditorLocationState = { notice?: string } | null;

const PUBLISH_FIELDS_BY_TAB: Record<EditorTab, ServicePublishField[]> = {
  details: ['label', 'path', 'description', 'icon', 'imageUrl'],
  page: ['heading', 'lead'],
  seo: ['seoTitle', 'seoDescription'],
};

const PUBLISH_FIELD_TAB = Object.fromEntries(
  Object.entries(PUBLISH_FIELDS_BY_TAB).flatMap(([tab, fields]) =>
    fields.map((field) => [field, tab]),
  ),
) as Record<ServicePublishField, EditorTab>;

const PUBLISH_FIELD_LABELS: Record<ServicePublishField, string> = {
  label: 'Service label',
  path: 'Public path',
  description: 'Card description',
  icon: 'Icon',
  imageUrl: 'Card image',
  heading: 'Page heading',
  lead: 'Lead paragraph',
  seoTitle: 'SEO title',
  seoDescription: 'Meta description',
};

const PUBLISH_FIELD_IDS: Record<ServicePublishField, string> = {
  label: 'service-label',
  path: 'service-path',
  description: 'service-description',
  icon: 'service-icon',
  imageUrl: 'service-image',
  heading: 'service-heading',
  lead: 'service-lead',
  seoTitle: 'service-seo-title',
  seoDescription: 'service-seo-description',
};

function editorTab(value: string | null): EditorTab {
  return value === 'page' || value === 'seo' ? value : 'details';
}

export function ServiceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const { canManage, isReadOnly } = useFeatureAccess('site_content');
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirmDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = editorTab(searchParams.get('tab'));
  const [services, setServices] = useState<ServiceNavLink[]>([]);
  const [form, setForm] = useState<ServiceNavLink | null>(null);
  const [baseline, setBaseline] = useState('');
  const [errors, setErrors] = useState<ServiceFormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(
    ((location.state as EditorLocationState)?.notice ?? ''),
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    setNotFound(false);
    setError('');
    void api.getSiteContent()
      .then((content) => {
        if (cancelled) return;
        const ordered = sortAndRenumberServices(content.serviceNavLinks);
        const next = isNew
          ? createEmptyService(ordered.length)
          : ordered.find((service) => service.id === id) ?? null;
        setServices(ordered);
        setForm(next);
        setBaseline(next ? JSON.stringify(next) : '');
        setNotFound(!next);
      })
      .catch((cause) => {
        if (cancelled) return;
        setLoadFailed(true);
        setError(cause instanceof Error ? cause.message : 'Could not load this service.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const dirty = Boolean(form && baseline && JSON.stringify(form) !== baseline);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const title = isNew ? 'New service' : form?.label || 'Service editor';
  const livePath = !isNew && form?.isPublished && form.path
    ? normalizeServicePath(form.path)
    : '';

  const update = <K extends keyof ServiceNavLink>(field: K, value: ServiceNavLink[K]) => {
    setForm((current) => current ? { ...current, [field]: value } : current);
    const publishField = field as ServicePublishField;
    if (PUBLISH_FIELD_TAB[publishField]) {
      setErrors((current) => ({ ...current, [publishField]: undefined }));
    }
    setError('');
    setSuccess('');
  };

  const changeTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const leave = async () => {
    if (dirty && canManage) {
      const accepted = await confirm({
        title: 'Leave with unsaved changes?',
        description: 'The changes made to this service have not been saved.',
        confirmLabel: 'Leave without saving',
        variant: 'danger',
      });
      if (!accepted) return;
    }
    navigate('/admin/services');
  };

  const showErrors = (nextErrors: ServiceFormErrors) => {
    setErrors(nextErrors);
    const firstField = (Object.keys(PUBLISH_FIELD_IDS) as ServicePublishField[])
      .find((field) => nextErrors[field]);
    if (!firstField) return;
    changeTab(PUBLISH_FIELD_TAB[firstField]);
    window.requestAnimationFrame(() => {
      document.getElementById(PUBLISH_FIELD_IDS[firstField])?.focus();
    });
  };

  const persist = async (prepared: ServiceNavLink, notice: string) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const nextServices = isNew
        ? appendService(services, prepared)
        : replaceService(services, id, prepared);
      const content = await api.updateSiteContent({ serviceNavLinks: nextServices });
      const ordered = sortAndRenumberServices(content.serviceNavLinks);
      const saved = isNew
        ? ordered.find((service) => normalizeServicePath(service.path) === prepared.path)
        : ordered.find((service) => service.id === id);

      if (!saved) {
        navigate('/admin/services', {
          replace: true,
          state: { notice: 'Service saved.' },
        });
        return;
      }

      setServices(ordered);
      setForm(saved);
      setBaseline(JSON.stringify(saved));
      setErrors({});
      setSuccess(notice);

      if (isNew && saved.id) {
        navigate(`/admin/services/${encodeURIComponent(saved.id)}?tab=${activeTab}`, {
          replace: true,
          state: { notice },
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this service.');
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!form || saving || !canManage) return;
    const prepared = prepareServiceForSave(form);
    const nextErrors = prepared.isPublished
      ? validateServiceForPublish(prepared, services)
      : validateService(prepared, services);
    if (Object.keys(nextErrors).length > 0) {
      showErrors(nextErrors);
      return;
    }
    await persist(
      prepared,
      isNew ? 'Service created as a draft.' : 'Service saved.',
    );
  };

  const setPublication = async (isPublished: boolean) => {
    if (!form || saving || !canManage) return;
    const prepared = prepareServiceForSave({ ...form, isPublished });
    const nextErrors = isPublished
      ? validateServiceForPublish(prepared, services)
      : validateService(prepared, services);
    if (Object.keys(nextErrors).length > 0) {
      showErrors(nextErrors);
      return;
    }
    await persist(
      prepared,
      isPublished
        ? isNew ? 'Service created and published.' : 'Service published.'
        : 'Service unpublished and saved as a draft.',
    );
  };

  const publishErrors = form
    ? validateServiceForPublish(prepareServiceForSave(form), services)
    : {};
  const publishIssuesByTab = (Object.keys(PUBLISH_FIELDS_BY_TAB) as EditorTab[])
    .map((tab) => ({
      tab,
      fields: PUBLISH_FIELDS_BY_TAB[tab].filter((field) => publishErrors[field]),
    }))
    .filter(({ fields }) => fields.length > 0);
  const publishReady = publishIssuesByTab.length === 0;
  const editorTabs = EDITOR_TABS.map((tab) => {
    const issues = publishIssuesByTab.find((item) => item.tab === tab.id)?.fields ?? [];
    return {
      ...tab,
      warning: issues.length > 0
        ? `${issues.length} required field${issues.length === 1 ? '' : 's'} need attention: ${issues.map((field) => PUBLISH_FIELD_LABELS[field]).join(', ')}`
        : undefined,
    };
  });

  const panelId = `service-editor-${activeTab}-panel`;
  const tabId = `service-editor-${activeTab}-tab`;

  if (loading) {
    return <AdminCard className="mx-auto max-w-4xl"><AdminLoadingState label="Loading service…" /></AdminCard>;
  }

  if (loadFailed) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <AdminAlert>{error}</AdminAlert>
        <div className="flex gap-3">
          <AdminButton variant="secondary" onClick={() => navigate('/admin/services')}>
            <ArrowLeft className="h-4 w-4" /> Back to services
          </AdminButton>
          <AdminButton onClick={() => window.location.reload()}>Try again</AdminButton>
        </div>
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="mx-auto max-w-4xl">
        <AdminEmptyState
          icon={Globe2}
          title="Service not found"
          description="This service may have been removed or the link may be incorrect."
          action={<AdminButton onClick={() => navigate('/admin/services')}>Back to services</AdminButton>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <AdminPageHeader
        eyebrow={(
          <AdminBreadcrumbs
            backAction={{
              label: 'Back to services',
              onClick: () => void leave(),
            }}
            items={[
              { label: 'Website', to: '/admin/site-content' },
              { label: 'Services', to: '/admin/services' },
            ]}
          />
        )}
        title={title}
        description={isNew
          ? 'Create the service as a draft, complete its content, and publish it when ready.'
          : `Edit how ${form.label || 'this service'} appears across the website.`}
        actions={(
          <>
            {isReadOnly && <ReadOnlyNotice />}
            {livePath && (
              <a
                href={livePath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-admin-border-strong bg-admin-surface px-4 text-sm font-semibold text-admin-secondary transition hover:bg-admin-muted hover:text-admin-text"
              >
                Open live page <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {canManage && (
              form.isPublished ? (
                <AdminButton
                  variant="secondary"
                  onClick={() => void setPublication(false)}
                  disabled={saving}
                >
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                  {saving ? 'Saving…' : 'Unpublish'}
                </AdminButton>
              ) : (
                <span
                  className="inline-flex"
                  title={publishReady ? 'Publish this service' : 'Complete all required fields before publishing'}
                >
                  <AdminButton
                    onClick={() => void setPublication(true)}
                    disabled={saving || !publishReady}
                    aria-describedby={!publishReady ? 'service-publish-requirements' : undefined}
                  >
                    <Globe2 className="h-4 w-4" aria-hidden="true" />
                    {saving ? 'Publishing…' : 'Publish'}
                  </AdminButton>
                </span>
              )
            )}
          </>
        )}
      />

      {error && <AdminAlert>{error}</AdminAlert>}
      {success && <AdminAlert tone="success">{success}</AdminAlert>}

      {publishIssuesByTab.length > 0 && (
        <AdminAlert tone="warning">
          <div id="service-publish-requirements">
            <p className="font-semibold">
              Complete all required fields before {form.isPublished ? 'saving this published service' : 'publishing'}.
            </p>
            <ul className="mt-2 space-y-1">
              {publishIssuesByTab.map(({ tab, fields }) => {
                const tabLabel = EDITOR_TABS.find((item) => item.id === tab)?.label ?? tab;
                return (
                  <li key={tab}>
                    <button
                      type="button"
                      className="rounded-sm text-left underline decoration-amber-700/40 underline-offset-2 outline-none hover:decoration-current focus-visible:ring-2 focus-visible:ring-admin-focus"
                      onClick={() => changeTab(tab)}
                    >
                      <span className="font-semibold">{tabLabel}:</span>{' '}
                      {fields.map((field) => PUBLISH_FIELD_LABELS[field]).join(', ')}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </AdminAlert>
      )}

      <AdminTabs
        tabs={editorTabs}
        value={activeTab}
        onChange={changeTab}
        label="Service editor"
      />

      <fieldset disabled={!canManage} className={!canManage ? '[&_input]:bg-admin-muted [&_select]:bg-admin-muted [&_textarea]:bg-admin-muted' : ''}>
        <section id={panelId} role="tabpanel" aria-labelledby={tabId}>
          {activeTab === 'details' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <AdminCard className="space-y-5 p-5 sm:p-6">
                <AdminField label={<RequiredLabel>Service label</RequiredLabel>} error={errors.label} hint="Used in navigation, cards, and generated landing-page fallbacks.">
                  <input
                    id="service-label"
                    type="text"
                    required
                    value={form.label}
                    onChange={(event) => update('label', event.target.value)}
                    className={adminFieldClass}
                    placeholder="Maternity"
                  />
                </AdminField>
                <AdminField label={<RequiredLabel>Public path</RequiredLabel>} error={errors.path} hint="Use a unique path without spaces, query parameters, or a hash.">
                  <input
                    id="service-path"
                    type="text"
                    required
                    value={form.path}
                    onChange={(event) => update('path', event.target.value)}
                    onBlur={() => update('path', normalizeServicePath(form.path))}
                    className={`${adminFieldClass} font-mono`}
                    placeholder="/maternity-photography-erode"
                  />
                </AdminField>
                <AdminField label={<RequiredLabel>Card description</RequiredLabel>} error={errors.description} hint="Short supporting copy shown on the homepage service card.">
                  <textarea
                    id="service-description"
                    required
                    value={form.description}
                    onChange={(event) => update('description', event.target.value)}
                    rows={3}
                    className={`${adminFieldClass} min-h-28 resize-y py-3`}
                    placeholder="Tender, timeless portraits celebrating new beginnings."
                  />
                </AdminField>
                <div className="grid gap-5 sm:grid-cols-2">
                  <AdminField label={<RequiredLabel>Icon</RequiredLabel>} error={errors.icon}>
                    <select
                      id="service-icon"
                      required
                      value={form.icon}
                      onChange={(event) => update('icon', event.target.value)}
                      className={adminFieldClass}
                    >
                      {SERVICE_ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </AdminField>
                  <ServiceCardImageUpload
                    id="service-image"
                    value={form.imageUrl}
                    disabled={!canManage}
                    required
                    error={errors.imageUrl}
                    onChange={(url) => update('imageUrl', url)}
                  />
                </div>
              </AdminCard>

              <AdminCard className="h-fit overflow-hidden p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-admin-subtle">Card image preview</p>
                <div className="aspect-[4/3] overflow-hidden rounded-xl border border-admin-border bg-admin-muted">
                  <ServiceImagePreview src={form.imageUrl} />
                </div>
              </AdminCard>
            </div>
          )}

          {activeTab === 'page' && (
            <AdminCard className="space-y-5 p-5 sm:p-6">
              <div>
                <h2 className="font-semibold text-admin-text">Landing-page introduction</h2>
                <p className="mt-1 text-sm text-admin-subtle">Both fields are required before this service can be published.</p>
              </div>
              <AdminField label={<RequiredLabel>Page heading (H1)</RequiredLabel>} error={errors.heading} hint="Primary heading displayed on the service landing page.">
                <input
                  id="service-heading"
                  type="text"
                  required
                  value={form.heading ?? ''}
                  onChange={(event) => update('heading', event.target.value)}
                  className={adminFieldClass}
                  placeholder="Maternity photography in Erode"
                />
              </AdminField>
              <AdminField label={<RequiredLabel>Lead paragraph</RequiredLabel>} error={errors.lead} hint="Introductory copy directly beneath the page heading.">
                <textarea
                  id="service-lead"
                  required
                  value={form.lead ?? ''}
                  onChange={(event) => update('lead', event.target.value)}
                  rows={5}
                  className={`${adminFieldClass} min-h-36 resize-y py-3`}
                  placeholder="Introduce this photography experience…"
                />
              </AdminField>
            </AdminCard>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-6">
              <AdminCard className="space-y-5 p-5 sm:p-6">
                <div>
                  <h2 className="font-semibold text-admin-text">Search appearance</h2>
                  <p className="mt-1 text-sm text-admin-subtle">Complete both fields to make this service ready to publish.</p>
                </div>
                <AdminField label={<RequiredLabel>SEO title</RequiredLabel>} error={errors.seoTitle} hint={`${(form.seoTitle ?? '').length}/60 characters · Aim for roughly 50–60 characters.`}>
                  <input
                    id="service-seo-title"
                    type="text"
                    required
                    value={form.seoTitle ?? ''}
                    onChange={(event) => update('seoTitle', event.target.value)}
                    className={adminFieldClass}
                    placeholder="Maternity Photoshoot in Erode | Doll Pictures"
                  />
                </AdminField>
                <AdminField label={<RequiredLabel>Meta description</RequiredLabel>} error={errors.seoDescription} hint={`${(form.seoDescription ?? '').length}/160 characters · Aim for roughly 140–160 characters.`}>
                  <textarea
                    id="service-seo-description"
                    required
                    value={form.seoDescription ?? ''}
                    onChange={(event) => update('seoDescription', event.target.value)}
                    rows={4}
                    className={`${adminFieldClass} min-h-32 resize-y py-3`}
                    placeholder="Personalized maternity photography in Erode…"
                  />
                </AdminField>
              </AdminCard>
            </div>
          )}
        </section>
      </fieldset>

      {canManage && (
        <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 flex flex-col gap-3 rounded-2xl border border-admin-border bg-admin-surface/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-4 md:bottom-3">
          <p className={`text-sm font-medium ${dirty ? 'text-amber-800' : 'text-admin-subtle'}`}>
            {dirty ? 'Unsaved changes' : 'All changes saved'}
          </p>
          <div className="flex justify-end gap-2">
            <AdminButton variant="secondary" onClick={() => void leave()} disabled={saving}>Cancel</AdminButton>
            <AdminButton onClick={() => void save()} disabled={saving || !dirty}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Saving…' : isNew ? 'Save draft' : 'Save changes'}
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <>
      {children}<span className="text-red-700" aria-hidden="true"> *</span>
      <span className="sr-only"> required</span>
    </>
  );
}

function ServiceImagePreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-admin-subtle">
        <ImageIcon className="h-8 w-8" aria-hidden="true" />
        <span className="text-sm">{failed ? 'Image could not be loaded' : 'No image uploaded'}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Service card preview"
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
