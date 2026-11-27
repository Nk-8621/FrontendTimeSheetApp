// Display mode (light / dark / glass) and theme colour (purple / teal / blue). Purely
// visual: sets attributes on <html> that swap the CSS variables in
// styles/variables.css. Defaults match the KEKA reference: light + purple.
// Choices are remembered per browser.

export type Theme = 'light' | 'dark' | 'glass';
export type Accent = 'purple' | 'teal' | 'blue';

const THEME_KEY = 'cbt_theme';
const ACCENT_KEY = 'cbt_accent';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode) - the choice still applies for this visit
  }
}

export function getTheme(): Theme {
  const t = read(THEME_KEY);
  return t === 'dark' || t === 'glass' ? t : 'light';
}

export function getAccent(): Accent {
  const a = read(ACCENT_KEY);
  return a === 'blue' || a === 'teal' ? a : 'purple';
}

export function applyTheme(theme: Theme) {
  // GLASS (Nov 2026): frosted panels over a gradient of the theme colour.
  if (theme === 'dark' || theme === 'glass') document.documentElement.setAttribute('data-theme', theme);
  else document.documentElement.removeAttribute('data-theme');
  write(THEME_KEY, theme);
}

export function applyAccent(accent: Accent) {
  if (accent !== 'purple') document.documentElement.setAttribute('data-accent', accent);
  else document.documentElement.removeAttribute('data-accent');
  write(ACCENT_KEY, accent);
}
