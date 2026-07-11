import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { SiteContent } from '../types';
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
  beforeAfter: { before: '', after: '' },
};

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
          beforeAfter: data.beforeAfter ?? { before: '', after: '' },
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

  const handleBeforeAfterChange = (field: 'before' | 'after', value: string) => {
    setContent(prev => ({
      ...prev,
      beforeAfter: { ...prev.beforeAfter, [field]: value },
    }));
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Before / After</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Before Image URL</label>
              <input
                type="url"
                value={content.beforeAfter?.before || ''}
                onChange={e => handleBeforeAfterChange('before', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">After Image URL</label>
              <input
                type="url"
                value={content.beforeAfter?.after || ''}
                onChange={e => handleBeforeAfterChange('after', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
