import { getSupabaseBrowserClient } from "./supabase-client";

export const authEnabled = import.meta.env.VITE_SUPABASE_URL != null;

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!authEnabled) return null;
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
    image: data.user.user_metadata?.avatar_url ?? null,
  };
}

export async function signInWithGoogle(callbackURL = "/"): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${callbackURL}`,
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = "/";
}
