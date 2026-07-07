import { Aperture, Instagram, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  Studio: ['About Us', 'Our Team', 'Careers', 'Press'],
  Services: ['Wedding', 'Pre-Wedding', 'Portrait', 'Commercial', 'Drone'],
  Work: ['Portfolio', 'Gallery', 'Behind the Scenes', 'Awards'],
  Connect: ['Book a Session', 'Free Consultation', 'Pricing', 'FAQ'],
};

export function Footer() {
  return (
    <footer className="relative bg-ink-950 border-t border-white/5 pt-20 pb-10 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Top */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-6">
              <Aperture className="w-7 h-7 text-gold-400" strokeWidth={1.5} />
              <span className="font-display text-2xl font-medium text-ink-50">
                Lumi<span className="text-gold-400">è</span>re
              </span>
            </div>
            <p className="text-ink-200/60 max-w-sm leading-relaxed mb-6">
              A premium photography studio crafting cinematic visual stories for
              weddings, portraits, and brands worldwide.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  data-cursor="hover"
                  className="w-10 h-10 glass rounded-full flex items-center justify-center text-ink-200/70 hover:text-gold-400 hover:scale-110 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs tracking-widest uppercase text-gold-400 mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      data-cursor="hover"
                      className="text-sm text-ink-200/60 hover:text-ink-50 transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-t border-white/5">
          <a href="#" data-cursor="hover" className="flex items-center gap-3 text-ink-200/60 hover:text-gold-400 transition-colors">
            <Mail className="w-5 h-5" /> hello@lumiere.studio
          </a>
          <a href="#" data-cursor="hover" className="flex items-center gap-3 text-ink-200/60 hover:text-gold-400 transition-colors">
            <Phone className="w-5 h-5" /> +1 (555) 012-3456
          </a>
          <div className="flex items-center gap-3 text-ink-200/60">
            <MapPin className="w-5 h-5" /> Studio 7, Arts District, NYC
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-300/40 tracking-wide">
            © 2024 Lumière Studio. All rights reserved. Crafted with devotion.
          </p>
          <div className="flex gap-6 text-xs text-ink-300/40">
            <a href="#" data-cursor="hover" className="hover:text-ink-200 transition-colors">Privacy</a>
            <a href="#" data-cursor="hover" className="hover:text-ink-200 transition-colors">Terms</a>
            <a href="#" data-cursor="hover" className="hover:text-ink-200 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
