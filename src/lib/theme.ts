/**
 * Theme + accent preferences. These are per-device display preferences, so they
 * live in localStorage (not the settings repository) and are applied by an
 * inline script in index.html before first paint to avoid a flash.
 */

export type Theme = 'light' | 'dark';
export type Accent = 'blue' | 'green' | 'violet';

export const ACCENTS: { value: Accent; label: string; swatch: string }[] = [
  { value: 'blue', label: 'Professional Blue', swatch: '#2563e8' },
  { value: 'green', label: 'Emerald', swatch: '#059669' },
  { value: 'violet', label: 'Violet', swatch: '#7c3aed' },
];

const THEME_KEY = 'jobmaster-theme';
const ACCENT_KEY = 'jobmaster-accent';

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage unavailable (private mode etc.) — fall through to the system theme.
  }
  return systemTheme();
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Non-fatal: the theme still applies for this session.
  }
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function getAccent(): Accent {
  try {
    const stored = localStorage.getItem(ACCENT_KEY);
    if (stored === 'blue' || stored === 'green' || stored === 'violet') return stored;
  } catch {
    // Fall through to the default accent.
  }
  return 'blue';
}

export function setAccent(accent: Accent): void {
  try {
    localStorage.setItem(ACCENT_KEY, accent);
  } catch {
    // Non-fatal.
  }
  if (accent === 'blue') {
    document.documentElement.removeAttribute('data-accent');
  } else {
    document.documentElement.setAttribute('data-accent', accent);
  }
}
