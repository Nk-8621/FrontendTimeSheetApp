// Display mode (light / dark) and theme colour (purple / blue). Purely
// visual: sets attributes on <html> that swap the CSS variables in
// styles/variables.css. Defaults match the KEKA reference: light + purple.
// Choices are remembered per browser.

export type Theme = 'light' | 'dark';
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
  return read(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export function getAccent(): Accent {
  const a = read(ACCENT_KEY);
  return a === 'blue' || a === 'teal' ? a : 'purple';
}

export function applyTheme(theme: Theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  write(THEME_KEY, theme);
}

export function applyAccent(accent: Accent) {
  if (accent !== 'purple') document.documentElement.setAttribute('data-accent', accent);
  else document.documentElement.removeAttribute('data-accent');
  write(ACCENT_KEY, accent);
}
