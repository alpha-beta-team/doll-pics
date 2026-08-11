import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
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
import {
  AdminAlert,
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
  validateService,
} from '../services/serviceNavLinks';
import type { ServiceNavLink } from '../types';

const EDITOR_TABS: AdminTab[] = [
  { id: 'details', label: 'Details', icon: Settings2 },
  { id: 'page', label: 'Page content', icon: FileText },
  { id: 'seo', label: 'SEO & publishing', icon: Search },
];

type EditorTab = 'details' | 'page' | 'seo';
type EditorLocationState = { notice?: string } | null;

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
    if (field === 'label' || field === 'path') {
      setErrors((current) => ({ ...current, [field]: undefined }));
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

  const save = async () => {
    if (!form || saving || !canManage) return;
    const prepared = prepareServiceForSave(form);
    const nextErrors = validateService(prepared, services);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      changeTab('details');
      window.requestAnimationFrame(() => {
        document.getElementById(nextErrors.label ? 'service-label' : 'service-path')?.focus();
      });
      return;
    }

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
      setSuccess(isNew && !saved.isPublished ? 'Service created as a draft.' : 'Service saved.');

      if (isNew && saved.id) {
        navigate(`/admin/services/${encodeURIComponent(saved.id)}?tab=${activeTab}`, {
          replace: true,
          state: { notice: saved.isPublished ? 'Service created and published.' : 'Service created as a draft.' },
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this service.');
    } finally {
      setSaving(false);
    }
  };

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
        eyebrow="Website · Services"
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
            <AdminButton variant="secondary" onClick={() => void leave()}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
            </AdminButton>
          </>
        )}
      />

      {error && <AdminAlert>{error}</AdminAlert>}
      {success && <AdminAlert tone="success">{success}</AdminAlert>}

      <AdminTabs
        tabs={EDITOR_TABS}
        value={activeTab}
        onChange={changeTab}
        label="Service editor"
      />

      <fieldset disabled={!canManage} className={!canManage ? '[&_input]:bg-admin-muted [&_select]:bg-admin-muted [&_textarea]:bg-admin-muted' : ''}>
        <section id={panelId} role="tabpanel" aria-labelledby={tabId}>
          {activeTab === 'details' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <AdminCard className="space-y-5 p-5 sm:p-6">
                <AdminField label="Service label" error={errors.label} hint="Used in navigation, cards, and generated landing-page fallbacks.">
                  <input
                    id="service-label"
                    type="text"
                    value={form.label}
                    onChange={(event) => update('label', event.target.value)}
                    className={adminFieldClass}
                    placeholder="Maternity"
                  />
                </AdminField>
                <AdminField label="Public path" error={errors.path} hint="Use a unique path without spaces, query parameters, or a hash.">
                  <input
                    id="service-path"
                    type="text"
                    value={form.path}
                    onChange={(event) => update('path', event.target.value)}
                    onBlur={() => update('path', normalizeServicePath(form.path))}
                    className={`${adminFieldClass} font-mono`}
                    placeholder="/maternity-photography-erode"
                  />
                </AdminField>
                <AdminField label="Card description" hint="Short supporting copy shown on the homepage service card and used as a content fallback.">
                  <textarea
                    value={form.description}
                    onChange={(event) => update('description', event.target.value)}
                    rows={3}
                    className={`${adminFieldClass} min-h-28 resize-y py-3`}
                    placeholder="Tender, timeless portraits celebrating new beginnings."
                  />
                </AdminField>
                <div className="grid gap-5 sm:grid-cols-2">
                  <AdminField label="Icon">
                    <select
                      value={form.icon}
                      onChange={(event) => update('icon', event.target.value)}
                      className={adminFieldClass}
                    >
                      {SERVICE_ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </AdminField>
                  <AdminField label="Image URL" hint="Used on the homepage service card.">
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(event) => update('imageUrl', event.target.value)}
                      className={adminFieldClass}
                      placeholder="https://…"
                    />
                  </AdminField>
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
                <p className="mt-1 text-sm text-admin-subtle">Blank fields keep the existing static or generated fallback content.</p>
              </div>
              <AdminField label="Page heading (H1)" hint="Primary heading displayed on the service landing page.">
                <input
                  type="text"
                  value={form.heading ?? ''}
                  onChange={(event) => update('heading', event.target.value)}
                  className={adminFieldClass}
                  placeholder="Maternity photography in Erode"
                />
              </AdminField>
              <AdminField label="Lead paragraph" hint="Introductory copy directly beneath the page heading.">
                <textarea
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
                  <p className="mt-1 text-sm text-admin-subtle">These optional fields override the static SEO defaults after the site rebuilds.</p>
                </div>
                <AdminField label="SEO title" hint={`${(form.seoTitle ?? '').length}/60 characters · Aim for roughly 50–60 characters.`}>
                  <input
                    type="text"
                    value={form.seoTitle ?? ''}
                    onChange={(event) => update('seoTitle', event.target.value)}
                    className={adminFieldClass}
                    placeholder="Maternity Photoshoot in Erode | Doll Pictures"
                  />
                </AdminField>
                <AdminField label="Meta description" hint={`${(form.seoDescription ?? '').length}/160 characters · Aim for roughly 140–160 characters.`}>
                  <textarea
                    value={form.seoDescription ?? ''}
                    onChange={(event) => update('seoDescription', event.target.value)}
                    rows={4}
                    className={`${adminFieldClass} min-h-32 resize-y py-3`}
                    placeholder="Personalized maternity photography in Erode…"
                  />
                </AdminField>
              </AdminCard>

              <AdminCard className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-admin-text">Publication status</h2>
                    <p className="mt-1 max-w-2xl text-sm text-admin-subtle">
                      Published services appear in navigation, homepage cards, landing routes, and the sitemap. SEO changes request a frontend rebuild.
                    </p>
                  </div>
                  <label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-3 rounded-xl border border-admin-border px-4 text-sm font-semibold text-admin-secondary">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(event) => update('isPublished', event.target.checked)}
                      className="h-4 w-4 rounded border-admin-control text-admin-primary focus:ring-admin-focus"
                    />
                    Published
                  </label>
                </div>
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
              {saving ? 'Saving…' : isNew ? 'Create service' : 'Save changes'}
            </AdminButton>
          </div>
        </div>
      )}
    </div>
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
        <span className="text-sm">{failed ? 'Image could not be loaded' : 'No image URL'}</span>
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
