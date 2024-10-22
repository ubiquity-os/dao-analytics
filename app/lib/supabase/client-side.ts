import { Octokit } from "@octokit/rest";
import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

export async function getSupabase() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) throw new Error("Missing Supabase credentials");
  return createBrowserClient(url, key);
}

export async function getOctokit(sb?: SupabaseClient) {
  const supabase = sb ?? (await getSupabase());
  const providerToken = (await supabase.auth.getSession()).data.session?.provider_token;
  if (!providerToken) throw new Error("No auth token found");
  return new Octokit({ auth: providerToken });
}

export async function getUser(sb?: SupabaseClient) {
  const supabase = sb ?? (await getSupabase());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}