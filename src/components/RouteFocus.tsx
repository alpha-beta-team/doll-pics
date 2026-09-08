import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { syncWindowScroll } from './SmoothScroll';

/** One focus move per navigation, including lazy destinations; never on CMS rerenders. */
export function RouteFocus() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef(location);
  const positions = useRef(new Map<string, number>());

  useEffect(() => {
    const savedPositions = positions.current;
    const from = previous.current;
    const changed = from.key !== location.key;
    previous.current = location;
    const shouldFocus = changed && (from.pathname !== location.pathname || from.hash !== location.hash);
    let frame = 0;
    let finished = false;
    const attempt = () => {
      if (finished) return;
      const main = document.getElementById('main-content');
      if (!main || !main.getClientRects().length || main.closest('[inert]')) return;
      let hashTarget: HTMLElement | null = null;
      try { hashTarget = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; } catch { /* Invalid URL escape: use main. */ }
      const target = hashTarget ?? main.querySelector<HTMLElement>('h1') ?? main;
      if (!target.getClientRects().length) return;
      finished = true;
      if (shouldFocus || hashTarget) {
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
        target.focus({ preventScroll: true });
      }
      if (hashTarget) {
        hashTarget.scrollIntoView();
        syncWindowScroll(window.scrollY);
      } else if (changed) {
        syncWindowScroll(navigationType === 'POP' ? savedPositions.get(location.key) ?? 0 : 0);
      }
      observer.disconnect();
    };
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(attempt);
    });
    observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'inert'] });
    frame = requestAnimationFrame(attempt);
    return () => {
      savedPositions.set(location.key, window.scrollY);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [location, navigationType]);
  return null;
}
