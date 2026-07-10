import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSiteData } from '../contexts/SiteDataContext';
import { BOOKING_ROUTE, NAV_LINKS } from '../lib/navigation';

export function Navbar() {
  const { siteContent } = useSiteData();
  const { pathname } = useLocation();
  const brand = siteContent.brandName || 'DOLL PICTURES';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClass = (path: string) =>
    `relative text-sm font-medium tracking-wide transition-colors duration-300 group ${
      pathname === path ? 'text-ink-50' : 'text-ink-100/80 hover:text-ink-50'
    }`;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-[1000] transition-transform duration-700"
        style={{ transform: 'translateY(0)', animation: 'fadeIn 1s 0.3s ease-out both' }}
      >
        <div
          className={`transition-all duration-500 ${
            scrolled ? 'glass-strong shadow-2xl shadow-black/30' : 'bg-transparent'
          }`}
        >
          <nav className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
              data-cursor="hover"
            >
              <img
                src="/logo-doll.png"
                alt="Doll Pictures logo"
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover ring-1 ring-white/15 transition-transform duration-700 group-hover:scale-105"
              />
              <span className="font-display text-xl font-semibold tracking-[0.3em] text-ink-50">
                {brand}
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-10">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  data-cursor="hover"
                  className={linkClass(link.path)}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold-400 transition-all duration-400 group-hover:w-full" />
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link
                to={BOOKING_ROUTE.path}
                data-cursor="hover"
                className="hidden sm:inline-flex items-center px-6 py-2.5 text-xs font-medium tracking-widest uppercase text-ink-950 bg-gradient-to-r from-gold-300 to-gold-500 rounded-full hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-400"
              >
                Book Now
              </Link>
              <button
                onClick={() => setOpen(!open)}
                className="lg:hidden text-ink-50"
                data-cursor="hover"
              >
                {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[999] lg:hidden bg-ink-950/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 fade-in">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className="font-display text-4xl text-ink-50 hover:text-gold-400 transition-colors"
              style={{ animation: `fadeInUp 0.5s ${i * 0.08}s ease-out both` }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={BOOKING_ROUTE.path}
            onClick={() => setOpen(false)}
            className="mt-4 px-8 py-4 text-sm tracking-widest uppercase text-ink-950 bg-gradient-to-r from-gold-300 to-gold-500 rounded-full"
            style={{ animation: 'fadeInUp 0.5s 0.4s ease-out both' }}
          >
            Book Now
          </Link>
        </div>
      )}
    </>
  );
}
