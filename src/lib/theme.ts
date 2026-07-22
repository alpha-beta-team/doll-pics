export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'doll-theme';

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    /* ignore quota / private mode */
  }
  return 'dark';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Brand gold RGB channels for canvas / inline styles (follows --gold-glow). */
export function getGoldGlowRgb(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--gold-glow')
    .trim();
  return raw || '212 162 73';
}
