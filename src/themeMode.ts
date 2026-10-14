/**
 * Colour mode preference: whether the app renders light or dark.
 *
 * The choice is kept in local storage so it survives a reload. Until the user
 * picks one, the operating system preference decides, which is what `system`
 * would do inside the theme provider; resolving it here keeps the switch in one
 * piece of state instead of two.
 */

import {useEffect, useState} from 'react';

/** A colour mode the user can choose. */
export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'rasporyadok-dnya.theme-mode';

/** Media query that reports a dark operating system preference. */
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

/**
 * Read the stored preference.
 *
 * @returns The stored mode, or null when nothing is stored yet.
 */
function readStoredMode(): ThemeMode | null {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

/**
 * Resolve the operating system preference.
 *
 * @returns `dark` when the system asks for dark, otherwise `light`.
 */
function readSystemMode(): ThemeMode {
  return window.matchMedia?.(DARK_MODE_QUERY).matches ? 'dark' : 'light';
}

/**
 * Track the colour mode and persist every change.
 *
 * @returns The active mode and its setter.
 */
export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredMode() ?? readSystemMode());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return [mode, setMode];
}
