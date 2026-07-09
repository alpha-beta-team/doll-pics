import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PATH_TO_SECTION } from '../lib/navigation';
import { scrollToSection } from './useScroll';
import { useReducedMotion } from './useReducedMotion';

const MAX_RETRIES = 60;

export function useSectionScroll() {
  const { pathname } = useLocation();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const sectionId = PATH_TO_SECTION[pathname];
    if (!sectionId) return;

    const behavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';
    let retries = 0;
    let raf = 0;

    const tryScroll = () => {
      if (scrollToSection(sectionId, behavior)) return;
      if (retries++ < MAX_RETRIES) {
        raf = requestAnimationFrame(tryScroll);
      }
    };

    raf = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(raf);
  }, [pathname, reducedMotion]);
}
