import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  AlertCircle,
  CheckCircle2,
  EyeOff,
  ExternalLink,
  FileText,
  Globe2,
  Image as ImageIcon,
  PanelsTopLeft,
  Plus,
  Save,
  Search,
  Settings2,
  Trash2,
  Upload,
  X,
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
  AdminModal,
  AdminPageHeader,
  adminFieldClass,
} from '../components/ui';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  appendService,
  createEmptyServiceSection,
  createEmptyService,
  MAX_SERVICE_SECTIONS,
  normalizeServicePath,
  prepareServiceForSave,
  replaceService,
  SERVICE_ICON_OPTIONS,
  serviceCategorySlug,
  sortAndRenumberServices,
  type ServiceFormErrors,
  type ServicePublishField,
  validateService,
  validateServiceForPublish,
} from '../services/serviceNavLinks';
import type { Photo, ServiceContentSection, ServiceNavLink } from '../types';
import { META_DESCRIPTION_MAX_LENGTH } from '../../lib/seo-core';

const EDITOR_TABS: AdminTab[] = [
  { id: 'details', label: 'Details', icon: Settings2 },
  { id: 'page', label: 'Page content', icon: FileText },
  { id: 'sections', label: 'Page sections', icon: PanelsTopLeft },
  { id: 'seo', label: 'SEO & publishing', icon: Search },
];

type EditorTab = 'details' | 'page' | 'sections' | 'seo';
type EditorLocationState = { notice?: string } | null;
type SaveToastState = { tone: 'success' | 'error'; message: string } | null;

const PUBLISH_FIELDS_BY_TAB: Record<EditorTab, ServicePublishField[]> = {
  details: ['label', 'path', 'description', 'icon', 'imageUrl'],
  page: ['heading', 'lead'],
  sections: ['sections'],
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
  sections: 'Page sections',
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
  sections: 'service-section-0-heading',
};

function editorTab(value: string | null): EditorTab {
  return value === 'page' || value === 'sections' || value === 'seo'
    ? value
    : 'details';
}

export function ServiceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const { canManage, isReadOnly } = useFeatureAccess('services');
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
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [toast, setToast] = useState<SaveToastState>(() => {
    const notice = (location.state as EditorLocationState)?.notice;
    return notice ? { tone: 'success', message: notice } : null;
  });
  const pendingSectionScrollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const index = pendingSectionScrollRef.current;
    if (index === null || activeTab !== 'sections') return;
    const card = document.getElementById(`service-section-card-${index}`);
    if (!card) return;
    pendingSectionScrollRef.current = null;
    window.requestAnimationFrame(() => {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        document.getElementById(`service-section-${index}-heading`)?.focus({
          preventScroll: true,
        });
      }, 450);
    });
  }, [activeTab, form?.sections.length, selectedSectionIndex]);

  useEffect(() => {
    setSelectedSectionIndex((current) => Math.min(current, Math.max(0, (form?.sections.length ?? 1) - 1)));
  }, [form?.sections.length]);

  useEffect(() => {
    setSelectedSectionIndex(0);
  }, [id]);

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
  };

  const updateSection = <K extends keyof ServiceContentSection>(
    index: number,
    field: K,
    value: ServiceContentSection[K],
  ) => {
    if (!form) return;
    const sections = form.sections.map((section, sectionIndex) =>
      sectionIndex === index ? { ...section, [field]: value } : section,
    );
    update('sections', sections);
    setErrors((current) => ({ ...current, sections: undefined }));
  };

  const addSection = () => {
    if (!form || form.sections.length >= MAX_SERVICE_SECTIONS) return;
    const newSectionIndex = form.sections.length;
    pendingSectionScrollRef.current = newSectionIndex;
    setSelectedSectionIndex(newSectionIndex);
    update('sections', [...form.sections, createEmptyServiceSection()]);
  };

  const removeSection = (index: number) => {
    if (!form || form.sections.length <= 1) return;
    update('sections', form.sections.filter((_, sectionIndex) => sectionIndex !== index));
    setSelectedSectionIndex(Math.min(index, form.sections.length - 2));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    if (!form) return;
    const target = index + direction;
    if (target < 0 || target >= form.sections.length) return;
    const sections = [...form.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    update('sections', sections);
    setSelectedSectionIndex(target);
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
    setToast({
      tone: 'error',
      message: nextErrors[firstField]
        || 'Please correct the highlighted fields before saving.',
    });
    if (firstField === 'sections') {
      const invalidSection = form?.sections.findIndex(
        (section) => !section.heading.trim() || !section.body.trim(),
      ) ?? -1;
      setSelectedSectionIndex(Math.max(0, invalidSection));
    }
    changeTab(PUBLISH_FIELD_TAB[firstField]);
    window.requestAnimationFrame(() => {
      document.getElementById(PUBLISH_FIELD_IDS[firstField])?.focus();
    });
  };

  const persist = async (prepared: ServiceNavLink, notice: string) => {
    setSaving(true);
    setError('');
    setToast(null);
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
      setToast({ tone: 'success', message: notice });

      if (isNew && saved.id) {
        navigate(`/admin/services/${encodeURIComponent(saved.id)}?tab=${activeTab}`, {
          replace: true,
          state: { notice },
        });
      }
    } catch (cause) {
      setToast({
        tone: 'error',
        message: cause instanceof Error ? cause.message : 'Could not save this service.',
      });
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
      <SaveToast toast={toast} onClose={() => setToast(null)} />
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

          {activeTab === 'sections' && (
            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-admin-text">Page sections</h2>
                    <p className="mt-1 text-sm text-admin-subtle">Add 1–6 ordered sections. Each section can have its own image.</p>
                  </div>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    onClick={addSection}
                    disabled={form.sections.length >= MAX_SERVICE_SECTIONS}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" /> Add section
                  </AdminButton>
                </div>

                {errors.sections && <AdminAlert>{errors.sections}</AdminAlert>}

                <section aria-label="Service page sections" className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface shadow-sm">
                  <div className="overflow-x-auto p-2">
                    <div className="flex min-w-max gap-1" role="tablist" aria-label="Choose a page section">
                      {form.sections.map((_, index) => (
                        <SectionTab
                          key={form.sections[index].id || `new-section-tab-${index}`}
                          active={selectedSectionIndex === index}
                          label={`Section ${index + 1}`}
                          onClick={() => setSelectedSectionIndex(index)}
                        />
                      ))}
                    </div>
                  </div>
                </section>

                {form.sections.map((section, index) => selectedSectionIndex === index && (
                  <AdminCard
                    key={section.id || `new-section-${index}`}
                    id={`service-section-card-${index}`}
                    role="tabpanel"
                    aria-label={`Section ${index + 1}`}
                    className="scroll-mt-28 p-5 sm:p-6"
                  >
                    <div className="mb-5 flex items-center justify-between gap-3 border-b border-admin-border pb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-admin-subtle">Section {index + 1}</p>
                        <p className="mt-1 text-sm text-admin-secondary">Displayed in this order on the public service page.</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label={`Move section ${index + 1} up`} className="rounded-lg p-2 text-admin-secondary hover:bg-admin-muted disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => moveSection(index, 1)} disabled={index === form.sections.length - 1} aria-label={`Move section ${index + 1} down`} className="rounded-lg p-2 text-admin-secondary hover:bg-admin-muted disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => removeSection(index)} disabled={form.sections.length <= 1} aria-label={`Remove section ${index + 1}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="space-y-5">
                        <AdminField label="Section heading">
                          <input
                            id={`service-section-${index}-heading`}
                            type="text"
                            value={section.heading}
                            onChange={(event) => updateSection(index, 'heading', event.target.value)}
                            className={adminFieldClass}
                            placeholder="A calm, guided experience"
                          />
                        </AdminField>
                        <AdminField label="Section body" hint="Use blank lines to create separate paragraphs.">
                          <textarea
                            value={section.body}
                            onChange={(event) => updateSection(index, 'body', event.target.value)}
                            rows={7}
                            className={`${adminFieldClass} min-h-44 resize-y py-3`}
                            placeholder="Describe this part of the service experience…"
                          />
                        </AdminField>
                        <AdminField label="Image alt text" hint="Describe the image for visitors using screen readers.">
                          <input
                            type="text"
                            value={section.imageAlt}
                            onChange={(event) => updateSection(index, 'imageAlt', event.target.value)}
                            className={adminFieldClass}
                            placeholder="Mother holding her newborn in the studio"
                          />
                        </AdminField>
                      </div>
                      <SectionImageField
                        value={section.imageUrl}
                        serviceLabel={form.label}
                        onChange={(value) => updateSection(index, 'imageUrl', value)}
                        onLibrarySelect={(value, altText) => {
                          updateSection(index, 'imageUrl', value);
                          if (!section.imageAlt.trim() && altText.trim()) {
                            updateSection(index, 'imageAlt', altText);
                          }
                        }}
                      />
                    </div>
                  </AdminCard>
                ))}

                <p className="text-right text-xs font-medium text-admin-subtle">{form.sections.length} of {MAX_SERVICE_SECTIONS} sections</p>
            </div>
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
                <AdminField label={<RequiredLabel>Meta description</RequiredLabel>} error={errors.seoDescription} hint={`${(form.seoDescription ?? '').length}/${META_DESCRIPTION_MAX_LENGTH} characters · Aim for roughly 140–${META_DESCRIPTION_MAX_LENGTH} characters.`}>
                  <textarea
                    id="service-seo-description"
                    required
                    maxLength={META_DESCRIPTION_MAX_LENGTH}
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

function SectionTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition ${active ? 'bg-admin-primary text-white shadow-sm' : 'text-admin-secondary hover:bg-admin-muted hover:text-admin-text'}`}
    >
      {label}
    </button>
  );
}

function SaveToast({
  toast,
  onClose,
}: {
  toast: SaveToastState;
  onClose: () => void;
}) {
  if (!toast) return null;
  const success = toast.tone === 'success';
  const Icon = success ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={success ? 'status' : 'alert'}
      aria-live={success ? 'polite' : 'assertive'}
      className={`fixed left-4 right-4 top-4 z-[120] flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur sm:left-auto sm:max-w-md ${
        success
          ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
          : 'border-red-200 bg-red-50/95 text-red-900'
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm font-semibold leading-6">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="-mr-1 rounded-lg p-1 opacity-65 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
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

const SECTION_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const SECTION_IMAGE_MAX_BYTES = 25 * 1024 * 1024;

function SectionImageField({
  value,
  serviceLabel,
  onChange,
  onLibrarySelect,
}: {
  value: string;
  serviceLabel: string;
  onChange: (value: string) => void;
  onLibrarySelect: (value: string, altText: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);

  const upload = async (file: File) => {
    if (!SECTION_IMAGE_TYPES.includes(file.type)) {
      setError('Use a JPEG, PNG, WebP, or AVIF image.');
      return;
    }
    if (file.size > SECTION_IMAGE_MAX_BYTES) {
      setError('Image must be 25 MB or smaller.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const result = await api.uploadServiceSectionImage(file);
      onChange(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload the image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-admin-secondary">Section image</p>
      <div className="aspect-[5/6] overflow-hidden rounded-xl border border-admin-border bg-admin-muted">
        <ServiceImagePreview src={value} />
      </div>
      <div className="flex flex-wrap gap-2">
        <AdminButton type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
        </AdminButton>
        <AdminButton type="button" variant="secondary" onClick={() => setLibraryOpen(true)} disabled={uploading || !serviceLabel.trim()}>
          <ImageIcon className="h-4 w-4" aria-hidden="true" /> Choose from Photos
        </AdminButton>
        {value && (
          <AdminButton type="button" variant="secondary" onClick={() => onChange('')} disabled={uploading}>
            Remove
          </AdminButton>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={SECTION_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = '';
        }}
      />
      <details>
        <summary className="cursor-pointer text-xs font-medium text-admin-subtle">Use an image URL instead</summary>
        <input type="url" value={value} onChange={(event) => onChange(event.target.value)} className={`${adminFieldClass} mt-2`} placeholder="https://…" />
      </details>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <PhotoLibraryPicker
        open={libraryOpen}
        serviceLabel={serviceLabel}
        selectedUrl={value}
        onClose={() => setLibraryOpen(false)}
        onSelect={(photo) => {
          const url = photo.variants.large
            || photo.variants.webp
            || photo.variants.avif
            || photo.variants.original;
          onLibrarySelect(url, photo.altText || photo.title);
          setLibraryOpen(false);
        }}
      />
    </div>
  );
}

function PhotoLibraryPicker({
  open,
  serviceLabel,
  selectedUrl,
  onClose,
  onSelect,
}: {
  open: boolean;
  serviceLabel: string;
  selectedUrl: string;
  onClose: () => void;
  onSelect: (photo: Photo) => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const categorySlug = serviceCategorySlug(serviceLabel);

  useEffect(() => {
    if (!open || !categorySlug) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setSearch('');
    void api.getPhotos({ category: categorySlug, published: true })
      .then((items) => {
        if (!cancelled) setPhotos(items);
      })
      .catch((cause) => {
        if (!cancelled) {
          setPhotos([]);
          setError(cause instanceof Error ? cause.message : 'Could not load category photos.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categorySlug, open]);

  const normalizedSearch = search.trim().toLowerCase();
  const visiblePhotos = normalizedSearch
    ? photos.filter((photo) => `${photo.title} ${photo.altText}`.toLowerCase().includes(normalizedSearch))
    : photos;

  return (
    <AdminModal
      open={open}
      title={`Choose a ${serviceLabel || 'service'} photo`}
      description={`Showing published images from Admin → Photos in the “${serviceLabel || categorySlug}” category.`}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        <AdminField label="Search category photos">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={adminFieldClass}
            placeholder="Search by title or alt text…"
          />
        </AdminField>

        {error ? <AdminAlert>{error}</AdminAlert> : null}
        {loading ? <AdminLoadingState label="Loading category photos…" /> : null}

        {!loading && !error && visiblePhotos.length === 0 ? (
          <AdminEmptyState
            icon={ImageIcon}
            title={photos.length ? 'No matching photos' : `No published ${serviceLabel} photos`}
            description={photos.length
              ? 'Try a different title or alt-text search.'
              : 'Upload and publish images in Admin → Photos under this service category first.'}
            action={!photos.length ? (
              <Link to="/admin/photos" onClick={onClose} className="inline-flex min-h-10 items-center rounded-xl bg-admin-primary px-4 text-sm font-semibold text-white">
                Open Admin Photos
              </Link>
            ) : undefined}
          />
        ) : null}

        {!loading && visiblePhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visiblePhotos.map((photo) => {
              const fullUrl = photo.variants.large
                || photo.variants.webp
                || photo.variants.avif
                || photo.variants.original;
              const thumbnail = photo.variants.webp || photo.variants.avif || photo.variants.original;
              const selected = Boolean(selectedUrl && selectedUrl === fullUrl);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onSelect(photo)}
                  className={`overflow-hidden rounded-xl border-2 bg-admin-surface text-left outline-none transition hover:border-admin-primary focus-visible:ring-2 focus-visible:ring-admin-focus ${selected ? 'border-admin-primary ring-2 ring-admin-primary/20' : 'border-admin-border'}`}
                >
                  <img src={thumbnail} alt={photo.altText || photo.title} className="aspect-[4/3] w-full bg-admin-muted object-cover" loading="lazy" />
                  <span className="block truncate px-3 py-2 text-sm font-medium text-admin-text">{photo.title || 'Untitled photo'}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </AdminModal>
  );
}
