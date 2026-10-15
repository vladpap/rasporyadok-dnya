/**
 * Signing in to edit the schedule.
 *
 * Reading the schedule is public, so the site needs no account for the child who
 * follows it. Editing is not, and two things stand between a visitor and a
 * change: they must sign in, and they must be on the editors list in the
 * database. Signing in only proves who they are; the list is what grants the
 * right, so adding someone is one row, not a code change.
 *
 * Supabase keeps the session and refreshes it, so an editor stays signed in
 * across visits.
 */

import {useCallback, useEffect, useState} from 'react';

import {supabase} from './supabase';

/** Who is signed in, whether they may edit, and how to change that. */
export type AuthState = {
  /** The email of the signed in user, or null when nobody is signed in. */
  email: string | null;
  /**
   * Whether the signed in user is on the editors list. False while signed out,
   * and false for a signed in user the database does not recognise as an editor.
   */
  canEdit: boolean;
  /** True while the first session check is in flight. */
  isChecking: boolean;
  /** Sign in with email and password. Resolves to an error message, or null. */
  signIn: (email: string, password: string) => Promise<string | null>;
  /** Sign in through Google. Resolves to an error message, or null. */
  signInWithGoogle: () => Promise<string | null>;
  /** Sign the editor out. */
  signOut: () => Promise<void>;
};

/**
 * Ask the database whether the signed in user may edit.
 *
 * The answer comes from the database rather than from a list in the code, so the
 * editors list has one home. Row level security lets a signed in user read only
 * their own row, which is exactly this question.
 *
 * @returns True when the user is an editor, false when they are not signed in,
 *   are not on the list, or the check could not be made.
 */
async function checkIsEditor(): Promise<boolean> {
  const {data: session} = await supabase.auth.getSession();
  if (!session.session) {
    return false;
  }

  const {data, error} = await supabase.from('editors').select('email').maybeSingle();
  if (error) {
    return false;
  }
  return Boolean(data);
}

/**
 * Track the signed in user, their editing right, and the ways to change both.
 *
 * The initial session is read once, then every later sign in or sign out updates
 * the state, so the edit entry point appears and disappears with the session and
 * the editors list together.
 *
 * @returns The session state and the three actions.
 */
export function useAuth(): AuthState {
  const [email, setEmail] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Re-read the editing right whenever the session changes, because the right
  // belongs to the person, not to the browser.
  const refreshEditorRight = useCallback(async () => {
    setCanEdit(await checkIsEditor());
  }, []);

  useEffect(() => {
    let isActive = true;

    void supabase.auth.getSession().then(async ({data}) => {
      if (!isActive) {
        return;
      }
      setEmail(data.session?.user.email ?? null);
      await refreshEditorRight();
      if (isActive) {
        setIsChecking(false);
      }
    });

    const {data: subscription} = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      void refreshEditorRight();
    });

    return () => {
      isActive = false;
      subscription.subscription.unsubscribe();
    };
  }, [refreshEditorRight]);

  const signIn = useCallback(
    async (signInEmail: string, password: string) => {
      const {error} = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password,
      });
      return error ? error.message : null;
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    // Google leaves the page and comes back, so the browser navigates away here.
    // A failure to even start the redirect is what this can report.
    const {error} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {redirectTo: window.location.origin + window.location.pathname},
    });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCanEdit(false);
  }, []);

  return {email, canEdit, isChecking, signIn, signInWithGoogle, signOut};
}
