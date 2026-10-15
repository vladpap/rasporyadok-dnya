/**
 * Supabase client for the schedule app.
 *
 * The schedule and the done marks both live in Supabase, so every read and write
 * goes through this one client. The project URL and the anon key are public by
 * design: they ship inside the browser bundle, and the database protects itself
 * with row level security, which lets everyone read the schedule and only signed
 * in users change it. The service role key is never used here, because it
 * bypasses those policies.
 *
 * Values come from the environment so a deployment can point at another project
 * without a code change, and fall back to the project this app was built for.
 */

import {createClient} from '@supabase/supabase-js';

/** Default project URL, used when the environment does not override it. */
const DEFAULT_URL = 'https://wglfgvtzlrjqjhjfyyoz.supabase.co';

/** Default anon key of that project. Safe to publish; see the note above. */
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbGZndnR6bHJqcWpoamZ5eW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NjkzMDcsImV4cCI6MjEwNzU0NTMwN30.aik9SGUaZDYhttT1obgdI1EqREenuPqpnSe_3Lr4lkI';

/** The Supabase project URL in use. */
export const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL ?? DEFAULT_URL;

/** The public anon key in use. */
export const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? DEFAULT_ANON_KEY;

/**
 * The single client the app talks to Supabase with.
 *
 * Sessions are persisted and refreshed automatically, so a signed in editor
 * stays signed in across visits.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
