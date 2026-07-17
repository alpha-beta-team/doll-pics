import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, Moon, Sun, X } from 'lucide-react';
import { EnquiryModal } from './EnquiryModal';
import { useSiteData } from '../contexts/SiteDataContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  NAV_LINKS,
  getPublishedServiceNavLinks,
} from '../lib/navigation';

export function Navbar() {
  const { siteContent, packageNavLinks } = useSiteData();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const brand = siteContent.brandName || 'DOLL PICTURES';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [packagesOpen, setPackagesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobilePackagesOpen, setMobilePackagesOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const openBookingModal = () => {
    setOpen(false);
    setShowBookingModal(true);
  };

  const serviceLinks = getPublishedServiceNavLinks(siteContent.serviceNavLinks);
  const servicesActive =
    pathname === '/services' ||
    serviceLinks.some((link) => link.path === pathname);
  const packagesActive =
    pathname === '/packages' ||
    packageNavLinks.some((link) => link.path === pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setServicesOpen(false);
    setPackagesOpen(false);
    setMobileServicesOpen(false);
    setMobilePackagesOpen(false);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!servicesOpen && !packagesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setServicesOpen(false);
        setPackagesOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [servicesOpen, packagesOpen]);

  const linkClass = (path: string) =>
    `relative text-sm font-medium tracking-wide transition-colors duration-300 group ${
      pathname === path ? 'text-ink-50' : 'text-ink-100/80 hover:text-ink-50'
    }`;

  const renderDesktopDropdown = (
    label: string,
    active: boolean,
    isOpen: boolean,
    setIsOpen: (v: boolean | ((prev: boolean) => boolean)) => void,
    items: Array<{ path: string; label: string }>,
    showAllLink?: { path: string; label: string },
  ) => (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        data-cursor="hover"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((v) => !v)}
        onFocus={() => setIsOpen(true)}
        className={`relative flex items-center gap-1 text-sm font-medium tracking-wide transition-colors duration-300 group ${
          active ? 'text-ink-50' : 'text-ink-100/80 hover:text-ink-50'
        }`}
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
        <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold-400 transition-all duration-400 group-hover:w-full" />
      </button>

      {isOpen ? (
        <div className="absolute left-1/2 top-full z-50 pt-3 -translate-x-1/2">
          <div className="min-w-[14rem] rounded-xl border border-hairline/10 bg-ink-950/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    data-cursor="hover"
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      pathname === item.path
                        ? 'bg-hairline/5 text-gold-400'
                        : 'text-ink-200/80 hover:bg-hairline/5 hover:text-ink-50'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            {showAllLink ? (
              <div className="mt-2 border-t border-hairline/10 pt-2">
                <Link
                  to={showAllLink.path}
                  data-cursor="hover"
                  className="block rounded-lg px-3 py-2 text-xs uppercase tracking-widest text-gold-400 transition-colors hover:bg-hairline/5"
                  onClick={() => setIsOpen(false)}
                >
                  {showAllLink.label}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-[1000] transition-transform duration-700"
        style={{ transform: 'translateY(0)', animation: 'fadeIn 1s 0.3s ease-out both' }}
      >
        <div
          className={`transition-all duration-500 ${
            scrolled || theme === 'light'
              ? 'glass-strong shadow-2xl shadow-black/30'
              : 'bg-transparent'
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
                className="h-11 w-11 rounded-full object-cover ring-1 ring-hairline/15 transition-transform duration-700 group-hover:scale-105"
              />
              <span className="font-display text-xl font-semibold tracking-[0.3em] text-ink-50">
                {brand}
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-10">
              {NAV_LINKS.map((link) => {
                if (link.path === '/services') {
                  return (
                    <div key={link.path}>
                      {renderDesktopDropdown(
                        'Services',
                        servicesActive,
                        servicesOpen,
                        setServicesOpen,
                        serviceLinks,
                        { path: '/services', label: 'All services' },
                      )}
                    </div>
                  );
                }
                if (link.path === '/packages') {
                  return (
                    <div key={link.path}>
                      {renderDesktopDropdown(
                        'Packages',
                        packagesActive,
                        packagesOpen,
                        setPackagesOpen,
                        packageNavLinks,
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    data-cursor="hover"
                    className={linkClass(link.path)}
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold-400 transition-all duration-400 group-hover:w-full" />
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center text-ink-100/80 transition-colors duration-300 hover:text-gold-400"
                data-cursor="hover"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Moon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={openBookingModal}
                data-cursor="hover"
                className="hidden sm:inline-flex items-center px-6 py-2.5 text-xs font-medium tracking-widest uppercase text-on-gold bg-gradient-to-r from-gold-300 to-gold-500 rounded-full hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-400"
              >
                Book Now
              </button>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="lg:hidden text-ink-50"
                data-cursor="hover"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
              >
                {open ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[999] lg:hidden bg-ink-950/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-6 fade-in overflow-y-auto py-24">
          {NAV_LINKS.map((link, i) => {
            if (link.path === '/services') {
              return (
                <div
                  key={link.path}
                  className="flex w-full max-w-xs flex-col items-center"
                  style={{ animation: `fadeInUp 0.5s ${i * 0.08}s ease-out both` }}
                >
                  <button
                    type="button"
                    className="flex items-center gap-2 font-display text-4xl text-ink-50 hover:text-gold-400 transition-colors"
                    aria-expanded={mobileServicesOpen}
                    onClick={() => setMobileServicesOpen((v) => !v)}
                  >
                    Services
                    <ChevronDown
                      className={`h-6 w-6 transition-transform ${mobileServicesOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {mobileServicesOpen ? (
                    <ul className="mt-4 space-y-3 text-center">
                      {serviceLinks.map((item) => (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={() => setOpen(false)}
                            className="text-lg text-ink-200/80 hover:text-gold-400 transition-colors"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          to="/services"
                          onClick={() => setOpen(false)}
                          className="text-sm uppercase tracking-widest text-gold-400"
                        >
                          All services
                        </Link>
                      </li>
                    </ul>
                  ) : null}
                </div>
              );
            }
            if (link.path === '/packages') {
              return (
                <div
                  key={link.path}
                  className="flex w-full max-w-xs flex-col items-center"
                  style={{ animation: `fadeInUp 0.5s ${i * 0.08}s ease-out both` }}
                >
                  <button
                    type="button"
                    className="flex items-center gap-2 font-display text-4xl text-ink-50 hover:text-gold-400 transition-colors"
                    aria-expanded={mobilePackagesOpen}
                    onClick={() => setMobilePackagesOpen((v) => !v)}
                  >
                    Packages
                    <ChevronDown
                      className={`h-6 w-6 transition-transform ${mobilePackagesOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {mobilePackagesOpen ? (
                    <ul className="mt-4 space-y-3 text-center">
                      {packageNavLinks.map((item) => (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={() => setOpen(false)}
                            className="text-lg text-ink-200/80 hover:text-gold-400 transition-colors"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            }
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className="font-display text-4xl text-ink-50 hover:text-gold-400 transition-colors"
                style={{ animation: `fadeInUp 0.5s ${i * 0.08}s ease-out both` }}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggleTheme}
            className="mt-2 inline-flex items-center gap-2 text-sm tracking-widest uppercase text-ink-200/80 transition-colors hover:text-gold-400"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            style={{ animation: 'fadeInUp 0.5s 0.35s ease-out both' }}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
          <button
            type="button"
            onClick={openBookingModal}
            className="mt-4 px-8 py-4 text-sm tracking-widest uppercase text-on-gold bg-gradient-to-r from-gold-300 to-gold-500 rounded-full"
            style={{ animation: 'fadeInUp 0.5s 0.4s ease-out both' }}
          >
            Book Now
          </button>
        </div>
      )}

      {showBookingModal ? (
        <EnquiryModal onClose={() => setShowBookingModal(false)} />
      ) : null}
    </>
  );
}
