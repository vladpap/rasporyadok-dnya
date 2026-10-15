/**
 * The colour theme a person has chosen.
 *
 * Two homes, because the app has two kinds of visitor. Someone just reading the
 * schedule has no account, so their choice lives in local storage and belongs to
 * that browser alone. Once someone signs in the choice belongs to them, so it is
 * read from and written to the database and follows them to another device.
 *
 * A signed in choice wins over the local one: otherwise signing in on a new
 * device would silently overwrite the saved preference with that browser's.
 */

import {useCallback, useEffect, useState} from 'react';

import {supabase} from './supabase';
import {isThemeKey, type ThemeKey} from './themes';

/** The theme choice and how to change it. */
export type ThemeChoice = {
  /** The active theme. */
  themeKey: ThemeKey;
  /** Choose another theme and remember it. */
  setThemeKey: (key: ThemeKey) => void;
};

/** Where a signed out choice is kept. */
const STORAGE_KEY = 'rasporyadok-dnya.theme';

/** The theme used until someone chooses one. */
export const DEFAULT_THEME_KEY: ThemeKey = 'violet';

/**
 * Read the choice kept in this browser.
 *
 * @returns The stored theme, or null when nothing usable is stored.
 */
function readStoredTheme(): ThemeKey | null {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isThemeKey(stored) ? stored : null;
}

/**
 * Read the choice saved against an account.
 *
 * A missing row is not an error: it means the person has not chosen yet, and the
 * local choice stands. A failure to reach the database is treated the same way,
 * so a network problem never blocks the page.
 *
 * @returns The saved theme, or null when there is none to read.
 */
async function readSavedTheme(): Promise<ThemeKey | null> {
  const {data, error} = await supabase.from('preferences').select('theme').maybeSingle();
  if (error) {
    return null;
  }
  const saved = (data as {theme?: unknown} | null)?.theme;
  return isThemeKey(saved) ? saved : null;
}

/**
 * Save the choice against the signed in account.
 *
 * @param themeKey Theme to remember.
 * @param email Email the row belongs to, which the policy checks.
 */
async function saveTheme(themeKey: ThemeKey, email: string): Promise<void> {
  await supabase
    .from('preferences')
    .upsert({email, theme: themeKey, updated_at: new Date().toISOString()});
}

/**
 * Track the chosen theme and persist every change.
 *
 * The local choice is written on every change so the page survives a reload even
 * with no account, and the account copy is written as well while someone is
 * signed in. When a session appears, its saved choice replaces the local one.
 *
 * @returns The active theme and its setter.
 */
export function useThemeChoice(): ThemeChoice {
  const [themeKey, setThemeKeyState] = useState<ThemeKey>(
    () => readStoredTheme() ?? DEFAULT_THEME_KEY,
  );

  // Follow sign in and sign out: a session brings its saved choice, and leaving
  // one drops back to whatever this browser remembers.
  useEffect(() => {
    let isActive = true;

    const applySession = async (email: string | null) => {
      if (!isActive) {
        return;
      }
      if (!email) {
        setThemeKeyState(readStoredTheme() ?? DEFAULT_THEME_KEY);
        return;
      }
      const saved = await readSavedTheme();
      if (isActive && saved) {
        setThemeKeyState(saved);
        window.localStorage.setItem(STORAGE_KEY, saved);
      }
    };

    void supabase.auth.getSession().then(({data}) => {
      void applySession(data.session?.user.email ?? null);
    });

    const {data: subscription} = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user.email ?? null);
    });

    return () => {
      isActive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const setThemeKey = useCallback((key: ThemeKey) => {
    setThemeKeyState(key);
    window.localStorage.setItem(STORAGE_KEY, key);

    // The account copy is best effort: a failure to save must not stop the page
    // from showing the theme that was just picked.
    void supabase.auth.getSession().then(({data}) => {
      const email = data.session?.user.email;
      if (email) {
        void saveTheme(key, email);
      }
    });
  }, []);

  return {themeKey, setThemeKey};
}
