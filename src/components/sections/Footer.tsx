import { Link } from 'react-router-dom';
import { useSiteData } from '../../contexts/SiteDataContext';
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks: Record<
  string,
  Array<{ label: string; to: string }>
> = {
  Studio: [
    { label: 'About Us', to: '/about' },
    { label: 'Our Team', to: '/about#team' },
  ],
  Services: [
    { label: 'Wedding', to: '/services' },
    { label: 'Pre-Wedding', to: '/services' },
    { label: 'Portrait', to: '/services' },
    { label: 'Commercial', to: '/services' },
    { label: 'Drone', to: '/services' },
  ],
  Work: [
    { label: 'Portfolio', to: '/work' },
    { label: 'Gallery', to: '/gallery' },
    { label: 'Behind the Scenes', to: '/#behind' },
  ],
  Connect: [
    { label: 'Book a Session', to: '/booking' },
    { label: 'Free Consultation', to: '/booking' },
    { label: 'Pricing', to: '/packages' },
  ],
};

const socialIcons = [
  { key: 'instagram', Icon: Instagram },
  { key: 'facebook', Icon: Facebook },
  { key: 'youtube', Icon: Youtube },
] as const;

export function Footer() {
  const { siteContent } = useSiteData();
  const brand = siteContent.brandName || 'DOLL PICTURES';

  return (
    <footer className="relative bg-ink-950 border-t border-white/5 pt-20 pb-10 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="font-display text-xl font-semibold tracking-[0.3em] text-ink-50">
                {brand}
              </span>
            </div>
            <p className="text-ink-200/60 max-w-sm leading-relaxed mb-6">
              {siteContent.about || siteContent.tagline}
            </p>
            <div className="flex gap-3">
              {socialIcons.map(({ key, Icon }) => {
                const href = siteContent.socials?.[key];
                if (!href) return null;
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor="hover"
                    className="w-10 h-10 glass rounded-full flex items-center justify-center text-ink-200/70 hover:text-gold-400 hover:scale-110 transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs tracking-widest uppercase text-gold-400 mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      data-cursor="hover"
                      className="text-sm text-ink-200/60 hover:text-ink-50 transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-t border-white/5">
          {siteContent.contactEmail && (
            <a href={`mailto:${siteContent.contactEmail}`} data-cursor="hover" className="flex items-center gap-3 text-ink-200/60 hover:text-gold-400 transition-colors">
              <Mail className="w-5 h-5" /> {siteContent.contactEmail}
            </a>
          )}
          {siteContent.phone && (
            <a href={`tel:${siteContent.phone.replace(/\s/g, '')}`} data-cursor="hover" className="flex items-center gap-3 text-ink-200/60 hover:text-gold-400 transition-colors">
              <Phone className="w-5 h-5" /> {siteContent.phone}
            </a>
          )}
          <a
            href="https://www.google.com/maps/search/?api=1&query=URT%20TOWERS%2C%20139%2F4-D%2C%20Perundurai%20Rd%2C%20Teachers%20Colony%2C%20Palayapalayam%2C%20Erode%2C%20Tamil%20Nadu%20638011"
            data-cursor="hover"
            className="flex items-center gap-3 text-ink-200/60 hover:text-gold-400 transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            <MapPin className="w-5 h-5" /> URT TOWERS, Erode, Tamil Nadu
          </a>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-300/40 tracking-wide">
            © 2026 {brand}. All rights reserved. Crafted with devotion.
          </p>
          <div className="flex gap-6 text-xs text-ink-300/40">
            <Link
              to="/privacy"
              data-cursor="hover"
              className="hover:text-ink-200 transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              data-cursor="hover"
              className="hover:text-ink-200 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
