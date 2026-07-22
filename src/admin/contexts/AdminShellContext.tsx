import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { SIDEBAR_COLLAPSED_KEY } from '../nav/config';

type AdminShellContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  isMobile: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
};

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

function readStoredCollapsed(): boolean | null {
  try {
    const raw = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (raw === null) return null;
    return raw === 'true';
  } catch {
    return null;
  }
}

function writeStoredCollapsed(value: boolean) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

function getIsMobile() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

function getIsTablet() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches
  );
}

export function AdminShellProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [collapsed, setCollapsedState] = useState(() => {
    const stored = readStoredCollapsed();
    if (stored !== null) return stored;
    return getIsTablet();
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mobileMq = window.matchMedia('(max-width: 767px)');
    const tabletMq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');

    const sync = () => {
      const nextMobile = mobileMq.matches;
      setIsMobile(nextMobile);
      if (nextMobile) {
        setMobileOpen(false);
      }
      // Only apply tablet default when user has never saved a preference
      if (readStoredCollapsed() === null && tabletMq.matches) {
        setCollapsedState(true);
      }
    };

    sync();
    mobileMq.addEventListener('change', sync);
    tabletMq.addEventListener('change', sync);
    return () => {
      mobileMq.removeEventListener('change', sync);
      tabletMq.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    writeStoredCollapsed(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      writeStoredCollapsed(next);
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);

  return (
    <AdminShellContext.Provider
      value={{
        collapsed,
        mobileOpen,
        isMobile,
        setCollapsed,
        toggleCollapsed,
        openMobile,
        closeMobile,
        toggleMobile,
      }}
    >
      {children}
    </AdminShellContext.Provider>
  );
}

export function useAdminShell() {
  const context = useContext(AdminShellContext);
  if (!context) {
    throw new Error('useAdminShell must be used within an AdminShellProvider');
  }
  return context;
}
