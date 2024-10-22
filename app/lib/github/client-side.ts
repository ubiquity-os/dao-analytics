import { Octokit } from "@octokit/rest";
import { getSupabase } from "../supabase/client-side";

export async function getClientOctokit() {
  const supabase = await getSupabase();
  const providerToken = (await supabase.auth.getSession()).data.session?.provider_token;
  if (!providerToken) throw new Error("No auth token found");
  return new Octokit({ auth: providerToken });
}

export async function getGitHubUser(octo?: Octokit) {
  const octokit = octo ?? (await getClientOctokit());
  return (await octokit.users.getAuthenticated()).data;
}
