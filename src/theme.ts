const STORAGE_KEY = 'manageme-theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export function getStoredTheme(): ThemePreference {
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system';
}

export function setStoredTheme(pref: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, pref);
}

export function resolveEffectiveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyDocumentTheme(pref: ThemePreference): void {
  document.documentElement.setAttribute('data-bs-theme', resolveEffectiveTheme(pref));
}

/** Sync label next to theme dropdown (call after DOM exists). */
export function updateThemeToggleLabel(labelEl: HTMLElement, pref: ThemePreference): void {
  if (pref === 'light') labelEl.textContent = 'Motyw: jasny';
  else if (pref === 'dark') labelEl.textContent = 'Motyw: ciemny';
  else labelEl.textContent = 'Motyw: system';
}

export function initThemeListeners(onSystemChange: () => void): void {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() === 'system') onSystemChange();
  });
}
