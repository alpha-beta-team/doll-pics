import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ServiceNavLink, SiteContent } from '../types';
import { DEFAULT_SERVICE_NAV_LINKS } from '../../lib/navigation';
import {
  Save,
  AlertCircle,
  Check,
  Globe,
  Mail,
  Phone,
  Camera,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  LayoutList,
} from 'lucide-react';

const defaultSiteContent: SiteContent = {
  brandName: '',
  tagline: '',
  heroHeading: '',
  heroSubtext: '',
  about: '',
  ourStory: '',
  mission: '',
  aboutHeroSubtext: '',
  contactEmail: '',
  whatsapp: '',
  phone: '',
  socials: {},
  serviceNavLinks: DEFAULT_SERVICE_NAV_LINKS.map((l) => ({ ...l })),
};

const ICON_OPTIONS = ['Heart', 'Camera', 'Gift', 'Baby', 'Sparkles', 'Briefcase', 'Plane'];

function emptyServiceLink(order: number): ServiceNavLink {
  return {
    label: '',
    path: '',
    description: '',
    icon: 'Camera',
    imageUrl: '',
    seoTitle: '',
    seoDescription: '',
    heading: '',
    lead: '',
    order,
    isPublished: true,
  };
}

export function SiteContentPage() {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await api.getSiteContent();
        setContent({
          ...defaultSiteContent,
          ...data,
          ourStory: data.ourStory ?? '',
          mission: data.mission ?? '',
          aboutHeroSubtext: data.aboutHeroSubtext ?? '',
          socials: data.socials ?? {},
          serviceNavLinks:
            data.serviceNavLinks?.length > 0
              ? data.serviceNavLinks
              : DEFAULT_SERVICE_NAV_LINKS.map((l) => ({ ...l })),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load site content');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleChange = (field: keyof SiteContent, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSocialChange = (platform: string, value: string) => {
    setContent(prev => ({
      ...prev,
      socials: { ...prev.socials, [platform]: value },
    }));
    setSuccess(false);
  };

  const updateServiceLink = (index: number, patch: Partial<ServiceNavLink>) => {
    setContent((prev) => {
      const next = [...prev.serviceNavLinks];
      next[index] = { ...next[index], ...patch };
      return { ...prev, serviceNavLinks: next };
    });
    setSuccess(false);
  };

  const addServiceLink = () => {
    setContent((prev) => ({
      ...prev,
      serviceNavLinks: [
        ...prev.serviceNavLinks,
        emptyServiceLink(prev.serviceNavLinks.length),
      ],
    }));
    setSuccess(false);
  };

  const removeServiceLink = (index: number) => {
    setContent((prev) => ({
      ...prev,
      serviceNavLinks: prev.serviceNavLinks
        .filter((_, i) => i !== index)
        .map((link, i) => ({ ...link, order: i })),
    }));
    setSuccess(false);
  };

  const moveServiceLink = (index: number, direction: -1 | 1) => {
    setContent((prev) => {
      const next = [...prev.serviceNavLinks];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return {
        ...prev,
        serviceNavLinks: next.map((link, i) => ({ ...link, order: i })),
      };
    });
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await api.updateSiteContent(content);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save site content');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Site Content</h1>
          <p className="text-gray-500 mt-1">
            Manage your website's global content and settings
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="ml-auto hover:text-red-900">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <Check className="w-5 h-5 flex-shrink-0" />
          Settings saved successfully
        </div>
      )}

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">Brand</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name
              </label>
              <input
                type="text"
                value={content.brandName}
                onChange={e => handleChange('brandName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Studio Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={content.tagline}
                onChange={e => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Capturing Life's Beautiful Moments"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">Hero Section</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero Heading
              </label>
              <input
                type="text"
                value={content.heroHeading}
                onChange={e => handleChange('heroHeading', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Where Every Frame Tells Your Story"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero Subtext
              </label>
              <textarea
                value={content.heroSubtext}
                onChange={e => handleChange('heroSubtext', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Professional photography services for weddings, events, and life's precious moments."
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-medium text-gray-900">About Section</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About Content
            </label>
            <textarea
              value={content.about}
              onChange={e => handleChange('about', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Tell your story. Share your passion for photography and what makes your studio unique..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Shown in the footer. Use line breaks for paragraphs.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-medium text-gray-900">About Page</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                About Hero Subtext
              </label>
              <textarea
                value={content.aboutHeroSubtext}
                onChange={e => handleChange('aboutHeroSubtext', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="A warm, inviting studio where craft meets whimsy..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Our Story
              </label>
              <textarea
                value={content.ourStory}
                onChange={e => handleChange('ourStory', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Company history and how the studio began..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use blank lines between paragraphs.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mission
              </label>
              <textarea
                value={content.mission}
                onChange={e => handleChange('mission', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="A short mission statement shown as a pull-quote..."
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={content.contactEmail}
                onChange={e => handleChange('contactEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="hello@yourstudio.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                value={content.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1-555-123-4567"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={content.whatsapp}
                onChange={e => handleChange('whatsapp', e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1-555-123-4567"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Social Links</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Instagram className="w-4 h-4 text-pink-500" />
                Instagram
              </label>
              <input
                type="url"
                value={content.socials.instagram || ''}
                onChange={e => handleSocialChange('instagram', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://instagram.com/yourstudio"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook
              </label>
              <input
                type="url"
                value={content.socials.facebook || ''}
                onChange={e => handleSocialChange('facebook', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://facebook.com/yourstudio"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Twitter className="w-4 h-4 text-sky-500" />
                Twitter / X
              </label>
              <input
                type="url"
                value={content.socials.twitter || ''}
                onChange={e => handleSocialChange('twitter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://twitter.com/yourstudio"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Youtube className="w-4 h-4 text-red-500" />
                YouTube
              </label>
              <input
                type="url"
                value={content.socials.youtube || ''}
                onChange={e => handleSocialChange('youtube', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://youtube.com/@yourstudio"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <LayoutList className="w-5 h-5 text-gray-400" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">Services menu</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Powers header dropdown, footer Services column, and homepage service cards.
                  Paths like /wedding-photography-erode, /newborn-baby-photography-erode, etc.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={addServiceLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <Plus className="w-4 h-4" />
              Add service
            </button>
          </div>

          <div className="space-y-4">
            {content.serviceNavLinks.map((link, index) => (
              <div
                key={link.id || `new-${index}`}
                className="rounded-lg border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Service {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Move up"
                      onClick={() => moveServiceLink(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      onClick={() => moveServiceLink(index, 1)}
                      disabled={index === content.serviceNavLinks.length - 1}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove service"
                      onClick={() => removeServiceLink(index)}
                      className="p-1.5 rounded text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateServiceLink(index, { label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Wedding"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                    <input
                      type="text"
                      value={link.path}
                      onChange={(e) => updateServiceLink(index, { path: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/wedding-photography-erode"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (card blurb)
                    </label>
                    <textarea
                      value={link.description}
                      onChange={(e) => updateServiceLink(index, { description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="md:col-span-2 border-t border-gray-100 pt-3 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Landing SEO</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Overrides static JSON when filled. Leave blank to keep defaults.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SEO title
                      </label>
                      <input
                        type="text"
                        value={link.seoTitle ?? ''}
                        onChange={(e) =>
                          updateServiceLink(index, { seoTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Maternity Photoshoot in Erode | Doll Pictures"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta description
                      </label>
                      <textarea
                        value={link.seoDescription ?? ''}
                        onChange={(e) =>
                          updateServiceLink(index, { seoDescription: e.target.value })
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Personalized maternity photography in Erode…"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Page heading (H1)
                      </label>
                      <input
                        type="text"
                        value={link.heading ?? ''}
                        onChange={(e) =>
                          updateServiceLink(index, { heading: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Maternity photography in Erode"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lead paragraph
                      </label>
                      <textarea
                        value={link.lead ?? ''}
                        onChange={(e) =>
                          updateServiceLink(index, { lead: e.target.value })
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Intro copy under the heading"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <select
                      value={link.icon}
                      onChange={(e) => updateServiceLink(index, { icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Published
                    </label>
                    <label className="inline-flex items-center gap-2 mt-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={link.isPublished}
                        onChange={(e) =>
                          updateServiceLink(index, { isPublished: e.target.checked })
                        }
                        className="rounded border-gray-300"
                      />
                      Show in nav, footer, and cards
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={link.imageUrl}
                      onChange={(e) => updateServiceLink(index, { imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
