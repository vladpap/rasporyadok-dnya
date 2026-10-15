/**
 * Signing in to edit the schedule.
 *
 * Reading the schedule is public, so the site needs no account for the child who
 * follows it. Editing is not: the database only accepts writes from a signed in
 * user, and this module is how the editor becomes one. Supabase keeps the session
 * and refreshes it, so the editor stays signed in across visits.
 */

import {useCallback, useEffect, useState} from 'react';

import {supabase} from './supabase';

/** Who is signed in, and how to change that. */
export type AuthState = {
  /** The email of the signed in editor, or null when nobody is signed in. */
  email: string | null;
  /** True while the first session check is in flight. */
  isChecking: boolean;
  /** Sign in with email and password. Resolves to an error message, or null. */
  signIn: (email: string, password: string) => Promise<string | null>;
  /** Sign the editor out. */
  signOut: () => Promise<void>;
};

/**
 * Track the signed in editor and offer the two ways to change it.
 *
 * The initial session is read once, then every later sign in or sign out updates
 * the state, so the edit entry point appears and disappears with the session.
 *
 * @returns The session state and the two actions.
 */
export function useAuth(): AuthState {
  const [email, setEmail] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isActive = true;

    void supabase.auth.getSession().then(({data}) => {
      if (isActive) {
        setEmail(data.session?.user.email ?? null);
        setIsChecking(false);
      }
    });

    const {data: subscription} = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => {
      isActive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (signInEmail: string, password: string) => {
    const {error} = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password,
    });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {email, isChecking, signIn, signOut};
}
