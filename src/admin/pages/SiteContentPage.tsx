import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  FileText,
  Globe,
  Instagram,
  Facebook,
  Mail,
  Save,
  Share2,
  Twitter,
  Youtube,
} from 'lucide-react';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { api } from '../api/client';
import { AdminTabs, type AdminTab } from '../components/AdminTabs';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminField,
  AdminLoadingState,
  AdminPageHeader,
  adminFieldClass,
} from '../components/ui';
import {
  defaultSiteSettings,
  normalizeSettingsTab,
  pickSiteSettings,
  type SiteSettings,
} from '../siteSettings';

const SETTINGS_TABS: AdminTab[] = [
  { id: 'brand', label: 'Brand & home', icon: Building2 },
  { id: 'about', label: 'About', icon: FileText },
  { id: 'contact', label: 'Contact & social', icon: Mail },
];

export function SiteContentPage() {
  const { canManage, isReadOnly } = useFeatureAccess('site_content');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeSettingsTab(searchParams.get('tab'));
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [baseline, setBaseline] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const content = await api.getSiteContent();
      const next = pickSiteSettings(content);
      setSettings(next);
      setBaseline(JSON.stringify(next));
      setLoaded(true);
    } catch (cause) {
      setLoaded(false);
      setError(cause instanceof Error ? cause.message : 'Could not load site settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = Boolean(baseline && JSON.stringify(settings) !== baseline);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const update = <K extends keyof SiteSettings>(field: K, value: SiteSettings[K]) => {
    setSettings((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const updateSocial = (platform: keyof SiteSettings['socials'], value: string) => {
    setSettings((current) => ({
      ...current,
      socials: { ...current.socials, [platform]: value },
    }));
    setError('');
    setSuccess('');
  };

  const save = async () => {
    if (!canManage || saving || !dirty) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const content = await api.updateSiteContent(settings);
      const saved = pickSiteSettings(content);
      setSettings(saved);
      setBaseline(JSON.stringify(saved));
      setSuccess('Site settings saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save site settings.');
    } finally {
      setSaving(false);
    }
  };

  const changeTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const panelId = `site-settings-${activeTab}-panel`;
  const tabId = `site-settings-${activeTab}-tab`;

  if (loading) {
    return <AdminCard className="mx-auto max-w-5xl"><AdminLoadingState label="Loading site settings…" /></AdminCard>;
  }

  if (!loaded) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <AdminAlert>{error || 'Could not load site settings.'}</AdminAlert>
        <AdminButton onClick={() => void load()}>Try again</AdminButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <AdminPageHeader
        eyebrow="Website"
        title="Site Settings"
        description="Manage global brand, homepage, about, contact, and social content."
        actions={isReadOnly ? <ReadOnlyNotice /> : undefined}
      />

      {error && <AdminAlert>{error}</AdminAlert>}
      {success && <AdminAlert tone="success">{success}</AdminAlert>}

      <AdminTabs
        tabs={SETTINGS_TABS}
        value={activeTab}
        onChange={changeTab}
        label="Site settings"
      />

      <fieldset disabled={!canManage} className={!canManage ? '[&_input]:bg-admin-muted [&_textarea]:bg-admin-muted' : ''}>
        <section id={panelId} role="tabpanel" aria-labelledby={tabId}>
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <AdminCard className="p-5 sm:p-6">
                <SectionHeading icon={Building2} title="Brand" description="Core identity used across the public website." />
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <AdminField label="Brand name">
                    <input
                      type="text"
                      value={settings.brandName}
                      onChange={(event) => update('brandName', event.target.value)}
                      className={adminFieldClass}
                      placeholder="Studio Name"
                    />
                  </AdminField>
                  <AdminField label="Tagline">
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(event) => update('tagline', event.target.value)}
                      className={adminFieldClass}
                      placeholder="Capturing life's beautiful moments"
                    />
                  </AdminField>
                </div>
              </AdminCard>

              <AdminCard className="p-5 sm:p-6">
                <SectionHeading icon={Globe} title="Hero section" description="Primary homepage message shown above the fold." />
                <div className="mt-5 space-y-5">
                  <AdminField label="Hero heading">
                    <input
                      type="text"
                      value={settings.heroHeading}
                      onChange={(event) => update('heroHeading', event.target.value)}
                      className={adminFieldClass}
                      placeholder="Where every frame tells your story"
                    />
                  </AdminField>
                  <AdminField label="Hero subtext">
                    <textarea
                      value={settings.heroSubtext}
                      onChange={(event) => update('heroSubtext', event.target.value)}
                      rows={3}
                      className={`${adminFieldClass} min-h-28 resize-y py-3`}
                      placeholder="Professional photography for life's precious moments."
                    />
                  </AdminField>
                </div>
              </AdminCard>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <AdminCard className="p-5 sm:p-6">
                <SectionHeading icon={FileText} title="Footer introduction" description="Short studio introduction shown in the website footer." />
                <div className="mt-5">
                  <AdminField label="About content" hint="Use line breaks to separate paragraphs.">
                    <textarea
                      value={settings.about}
                      onChange={(event) => update('about', event.target.value)}
                      rows={5}
                      className={`${adminFieldClass} min-h-40 resize-y py-3`}
                      placeholder="Tell visitors what makes the studio unique…"
                    />
                  </AdminField>
                </div>
              </AdminCard>

              <AdminCard className="p-5 sm:p-6">
                <SectionHeading icon={FileText} title="About page" description="Long-form story and mission content for the About page." />
                <div className="mt-5 space-y-5">
                  <AdminField label="About hero subtext">
                    <textarea
                      value={settings.aboutHeroSubtext}
                      onChange={(event) => update('aboutHeroSubtext', event.target.value)}
                      rows={3}
                      className={`${adminFieldClass} min-h-28 resize-y py-3`}
                      placeholder="A warm, inviting studio where craft meets whimsy…"
                    />
                  </AdminField>
                  <AdminField label="Our story" hint="Use blank lines between paragraphs.">
                    <textarea
                      value={settings.ourStory}
                      onChange={(event) => update('ourStory', event.target.value)}
                      rows={8}
                      className={`${adminFieldClass} min-h-56 resize-y py-3`}
                      placeholder="Share the studio's history and how it began…"
                    />
                  </AdminField>
                  <AdminField label="Mission" hint="A short pull-quote displayed on the About page.">
                    <textarea
                      value={settings.mission}
                      onChange={(event) => update('mission', event.target.value)}
                      rows={3}
                      className={`${adminFieldClass} min-h-28 resize-y py-3`}
                      placeholder="A short mission statement…"
                    />
                  </AdminField>
                </div>
              </AdminCard>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <AdminCard className="p-5 sm:p-6">
                <SectionHeading icon={Mail} title="Contact information" description="Primary details used by contact actions across the website." />
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <AdminField label="Contact email">
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(event) => update('contactEmail', event.target.value)}
                      className={adminFieldClass}
                      placeholder="hello@yourstudio.com"
                    />
                  </AdminField>
                  <AdminField label="Phone number">
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(event) => update('phone', event.target.value)}
                      className={adminFieldClass}
                      placeholder="+91 99999 99999"
                    />
                  </AdminField>
                  <div className="md:col-span-2 md:max-w-[calc(50%-0.625rem)]">
                    <AdminField label="WhatsApp number" hint="Include the country code used for website booking links.">
                      <input
                        type="tel"
                        value={settings.whatsapp}
                        onChange={(event) => update('whatsapp', event.target.value)}
                        className={adminFieldClass}
                        placeholder="+91 99999 99999"
                      />
                    </AdminField>
                  </div>
                </div>
              </AdminCard>

              <AdminCard className="p-5 sm:p-6">
                <SectionHeading icon={Share2} title="Social links" description="Leave a platform blank to hide its public link." />
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <SocialField icon={Instagram} label="Instagram" value={settings.socials.instagram ?? ''} placeholder="https://instagram.com/yourstudio" onChange={(value) => updateSocial('instagram', value)} />
                  <SocialField icon={Facebook} label="Facebook" value={settings.socials.facebook ?? ''} placeholder="https://facebook.com/yourstudio" onChange={(value) => updateSocial('facebook', value)} />
                  <SocialField icon={Twitter} label="Twitter / X" value={settings.socials.twitter ?? ''} placeholder="https://x.com/yourstudio" onChange={(value) => updateSocial('twitter', value)} />
                  <SocialField icon={Youtube} label="YouTube" value={settings.socials.youtube ?? ''} placeholder="https://youtube.com/@yourstudio" onChange={(value) => updateSocial('youtube', value)} />
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
          <AdminButton onClick={() => void save()} disabled={!dirty || saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving…' : 'Save changes'}
          </AdminButton>
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-admin-muted text-admin-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-semibold text-admin-text">{title}</h2>
        <p className="mt-0.5 text-sm text-admin-subtle">{description}</p>
      </div>
    </div>
  );
}

function SocialField({
  icon: Icon,
  label,
  value,
  placeholder,
  onChange,
}: {
  icon: typeof Instagram;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <AdminField label={<span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" aria-hidden="true" />{label}</span>}>
      <input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={adminFieldClass}
        placeholder={placeholder}
      />
    </AdminField>
  );
}
