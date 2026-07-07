import { useEffect, useState } from 'react';
import { Menu, X, Aperture } from 'lucide-react';
import { scrollToSection } from '../hooks/useScroll';

const links = [
  { label: 'Work', href: '#work' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#behind' },
  { label: 'Stories', href: '#testimonials' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 group"
              data-cursor="hover"
            >
              <div className="transition-transform duration-700 group-hover:rotate-180">
                <Aperture className="w-7 h-7 text-gold-400" strokeWidth={1.5} />
              </div>
              <span className="font-display text-xl font-semibold tracking-[0.3em] text-ink-50">
                DOLL PICTURES
              </span>
            </button>

            <div className="hidden lg:flex items-center gap-10">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  data-cursor="hover"
                  className="relative text-sm font-medium tracking-wide text-ink-100/80 hover:text-ink-50 transition-colors duration-300 group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold-400 transition-all duration-400 group-hover:w-full" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => scrollToSection('#booking')}
                data-cursor="hover"
                className="hidden sm:inline-flex items-center px-6 py-2.5 text-xs font-medium tracking-widest uppercase text-ink-950 bg-gradient-to-r from-gold-300 to-gold-500 rounded-full hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-400"
              >
                Book Now
              </button>
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
          {links.map((link, i) => (
            <button
              key={link.label}
              onClick={() => { setOpen(false); scrollToSection(link.href); }}
              className="font-display text-4xl text-ink-50 hover:text-gold-400 transition-colors"
              style={{ animation: `fadeInUp 0.5s ${i * 0.08}s ease-out both` }}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { setOpen(false); scrollToSection('#booking'); }}
            className="mt-4 px-8 py-4 text-sm tracking-widest uppercase text-ink-950 bg-gradient-to-r from-gold-300 to-gold-500 rounded-full"
            style={{ animation: 'fadeInUp 0.5s 0.4s ease-out both' }}
          >
            Book Now
          </button>
        </div>
      )}
    </>
  );
}
