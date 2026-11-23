// NEW LOOK (Nov 2026): an optional Keka-style look (purple accent, light
// sidebar with labels, rounded white cards). The current look stays the
// default; each employee can switch from the profile menu. The choice is
// remembered in this browser only (localStorage).

export type Theme = 'default' | 'new';

const STORAGE_KEY = 'cbt-timesheet-theme';

/** The look saved in this browser, or 'default'. */
export function getSavedTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'new' ? 'new' : 'default';
  } catch {
    return 'default'; // storage blocked (private window etc.) - just use the default look
  }
}

/** Shows the given look now and remembers it for next time. */
export function applyTheme(theme: Theme) {
  // The new look's styles (styles/theme-new.css) only apply while
  // <html data-theme="new"> is set.
  if (theme === 'new') document.documentElement.dataset.theme = 'new';
  else delete document.documentElement.dataset.theme;

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage blocked - the look still applies for this visit
  }
}
