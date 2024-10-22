import { Octokit } from "@octokit/rest";
import { createServerClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function createClient() {
  const cookieStore = cookies();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!key || !url) throw new Error("Missing Supabase credentials");

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

export async function getSupabase() {
  return createClient();
}

export async function getOctokit() {
  const supabase = createClient();
  const providerToken = (await supabase.auth.getSession()).data.session?.provider_token;
  if (!providerToken) throw new Error("No auth token found");
  return new Octokit({ auth: providerToken });
}

/**
 * Server-side only
 */
export async function getUser(sb?: SupabaseClient) {
  const supabase = sb ?? createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}