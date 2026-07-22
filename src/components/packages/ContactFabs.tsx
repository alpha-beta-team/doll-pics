import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Mail, MessageCircle, Phone, Plus } from 'lucide-react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { trackPhoneClick, trackWhatsAppClick } from '../../lib/analytics';
import { whatsappDigits } from '../../lib/pricing';

interface ContactFabsProps {
  phone: string;
  whatsapp: string;
  email: string;
}

interface ContactAction {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  bgColor: string;
  icon: ReactNode;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ContactFabs({ phone, whatsapp, email }: ContactFabsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const tel = phone.replace(/\s/g, '');
  const wa = whatsappDigits(whatsapp);

  const actions: ContactAction[] = [];
  if (tel) {
    actions.push({
      id: 'call',
      label: 'Call Now',
      href: `tel:${tel}`,
      bgColor: '#EF4444',
      icon: <Phone className="h-5 w-5" strokeWidth={2} />,
    });
  }
  if (email) {
    actions.push({
      id: 'email',
      label: 'Send Email',
      href: `mailto:${email}`,
      bgColor: '#3B82F6',
      icon: <Mail className="h-5 w-5" strokeWidth={2} />,
    });
  }
  if (wa) {
    actions.push({
      id: 'whatsapp',
      label: 'WhatsApp Us',
      href: `https://wa.me/${wa}`,
      external: true,
      bgColor: '#25D366',
      icon: <WhatsAppIcon className="h-5 w-5" />,
    });
  }

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed bottom-6 right-6 z-[900] flex flex-col items-end gap-3"
    >
      <div role="menu" aria-label="Contact options" className="flex flex-col items-end gap-3">
        {actions.map((action, index) => {
          const openDelay = (actions.length - 1 - index) * 120;
          const closeDelay = index * 80;

          return (
            <div
              key={action.id}
              role="none"
              className={`fab-item flex items-center gap-3 ${open ? 'fab-item-open' : 'fab-item-closed'}`}
              style={{ transitionDelay: `${open ? openDelay : closeDelay}ms` }}
            >
              <span className="pointer-events-none whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-on-gold shadow-md">
                {action.label}
              </span>
              <a
                role="menuitem"
                href={action.href}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noreferrer' : undefined}
                data-cursor="hover"
                aria-label={action.label}
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  if (action.id === 'whatsapp') {
                    trackWhatsAppClick({ cta_location: 'floating_button' });
                  } else if (action.id === 'call') {
                    trackPhoneClick({ cta_location: 'floating_button' });
                  }
                  setOpen(false);
                }}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 ${
                  open ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
                style={{ backgroundColor: action.bgColor }}
              >
                {action.icon}
              </a>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        data-cursor="hover"
        aria-label={open ? 'Close contact menu' : 'Open contact menu'}
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-cyan-400 to-blue-500 text-white shadow-lg shadow-blue-500/30 transition-transform duration-300 hover:scale-110 hover:-translate-y-0.5 active:scale-95"
      >
        {!open && (
          <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-ink-950" />
        )}
        <span className="relative flex h-6 w-6 items-center justify-center">
          <MessageCircle
            className={`absolute h-6 w-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
            strokeWidth={2}
          />
          <Plus
            className={`absolute h-6 w-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            }`}
            strokeWidth={2.5}
          />
        </span>
      </button>
    </div>
  );
}

export function ContactFabHost() {
  const { siteContent } = useSiteData();
  return (
    <ContactFabs
      phone={siteContent.phone}
      whatsapp={siteContent.whatsapp}
      email={siteContent.contactEmail}
    />
  );
}
