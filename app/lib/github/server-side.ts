import { getSupabase } from "@/app/lib/supabase/server-side";
import { Octokit } from "@octokit/rest";

export async function getOctokit() {
  const supabase = await getSupabase();
  const authToken = (await supabase.auth.getSession()).data.session?.access_token;
  if (!authToken) throw new Error("No auth token found");
  return new Octokit({ auth: authToken });
}

export async function getGitHubUser(octo?: Octokit) {
  const octokit = octo ?? (await getOctokit());
  return (await octokit.users.getAuthenticated()).data;
}
