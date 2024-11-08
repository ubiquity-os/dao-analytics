import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { logger } from "./logger";

export async function collectAllOrgRepos(octokit: Octokit, org: string): Promise<RestEndpointMethodTypes["repos"]["listForOrg"]["response"]["data"]> {
  try {
    return await octokit.paginate(octokit.repos.listForOrg, {
      org,
      type: "all",
    });
  } catch (er) {
    logger.error("Error in collectAllOrgRepos", { org, er });
    return [];
  }
}

export async function collectAllRepoPrs(octokit: Octokit, owner: string, repo: string): Promise<RestEndpointMethodTypes["pulls"]["list"]["response"]["data"]> {
  try {
    return await octokit.paginate(octokit.pulls.list, {
      owner,
      repo,
      state: "all",
    });
  } catch (er) {
    logger.error("Error in collectAllRepoPrs", { owner, repo, er });
    return [];
  }
}

export async function collectAllOrgIssues(octokit: Octokit, org: string, repo: string): Promise<
  RestEndpointMethodTypes["issues"]["listForRepo"]["response"]["data"]
> {
  try {
    return await octokit.paginate(octokit.issues.listForRepo, {
      owner: org,
      repo,
      state: "all",
    });
  } catch (er) {
    logger.error("Error in collectAllOrgIssues", { org, repo, er });
    return [];
  }
}

// DEV: No throwing errors because deleted issues etc are common, might add specific handling in the future

export async function getIssue(octokit: Octokit, owner: string, repo: string, issueNumber: number):
  Promise<RestEndpointMethodTypes["issues"]["get"]["response"]["data"] | null> {
  try {
    const { data } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });

    if (!data) {
      logger.debug("getIssue: No data returned", { owner, repo, issueNumber });
    }

    if (typeof data === "object" && Array.isArray(data)) {
      if (data.length === 0) {
        logger.debug("getIssue: No data returned", { owner, repo, issueNumber });
      } else if (data.length > 1) {
        logger.debug("getIssue: Multiple data returned", { owner, repo, issueNumber });
        return data.find((d) => d.number === issueNumber && d.issue_url === `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`);
      } else {
        return data[0];
      }
    }
    return data;

  } catch (error) {
    logger.error("Error in getIssue:", { er: error });
  }

  return null;
}

export async function getPullRequest(octokit: Octokit, owner: string, repo: string, prNumber: number):
  Promise<RestEndpointMethodTypes["pulls"]["get"]["response"]["data"] | null> {
  try {
    const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNumber });
    return data;
  } catch (error) {
    logger.error("Error in getPullRequest:", { er: error });
  }

  return null;
}

export async function getIssueComments(octokit: Octokit, owner: string, repo: string, issueNumber: number):
  Promise<RestEndpointMethodTypes["issues"]["listComments"]["response"]["data"] | null | undefined> {
  try {
    return await octokit.paginate(octokit.issues.listComments, {
      owner,
      repo,
      issue_number: issueNumber,
    });
  } catch (error) {
    logger.error("Error in getIssueComments:", { er: error });
  }
}

export async function getPullRequestReviews(octokit: Octokit, owner: string, repo: string, prNumber: number) {
  try {
    return await octokit.paginate(octokit.pulls.listReviews, {
      owner,
      repo,
      pull_number: prNumber,
    });
  } catch (error) {
    logger.error("Error in getPullRequestReviews:", { er: error });
  }
}

export async function getPullRequestReviewComments(octokit: Octokit, owner: string, repo: string, prNumber: number) {
  try {
    return await octokit.paginate(octokit.pulls.listReviewComments, {
      owner,
      repo,
      pull_number: prNumber,
    });
  } catch (error) {
    logger.error("Error in getPullRequestReviewComments:", { er: error });
  }
}

export async function getPullRequestCommits(octokit: Octokit, owner: string, repo: string, prNumber: number) {
  try {
    return await octokit.paginate(octokit.pulls.listCommits, {
      owner,
      repo,
      pull_number: prNumber,
    });
  } catch (error) {
    logger.error("Error in getPullRequestCommits:", { er: error });
  }
}

export async function getPullRequestFiles(octokit: Octokit, owner: string, repo: string, prNumber: number) {
  try {
    return await octokit.paginate(octokit.pulls.listFiles, {
      owner,
      repo,
      pull_number: prNumber,
    });
  } catch (error) {
    logger.error("Error in getPullRequestFiles:", { er: error });
  }
}

export async function getIssueEvents(octokit: Octokit, owner: string, repo: string, issueNumber: number) {
  try {
    return await octokit.paginate(octokit.issues.listEvents, {
      owner,
      repo,
      issue_number: issueNumber,
    });
  } catch (error) {
    logger.error("Error in getIssueEvents:", { er: error });
  }
}

export async function getIssueLabels(octokit: Octokit, owner: string, repo: string, issueNumber: number) {
  try {
    const { data } = await octokit.issues.listLabelsOnIssue({ owner, repo, issue_number: issueNumber });
    return data;
  } catch (error) {
    logger.error("Error in getIssueLabels:", { er: error });
  }
}
