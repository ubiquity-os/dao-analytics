import { Octokit } from "@octokit/rest";
import { closedByPullRequestsReferences, closingIssuesReferencesQuery, IssueClosedByPr, PrLinkedToIssue } from "./gql-queries";
import { GraphQlQueryResponseData } from "@octokit/graphql";

export async function collectClosingIssuesReferences(
  octokit: Octokit,
  issue: {
    owner: string;
    repo: string;
    issue_number: number;
  }
) {
  const { owner, repo, issue_number } = issue;

  if (!issue_number) {
    throw new Error("[collectClosingIssuesReferences]: issue_number is required");
  }
  try {
    const result = await octokit.graphql<IssueClosedByPr>(closingIssuesReferencesQuery, {
      owner,
      repo,
      issue_number,
    });

    return result.repository.issue.closingIssuesReferences.edges.map((edge) => edge.node);
  } catch {
    // probably not found/deleted
    return [];
  }
}

export async function collectIssuesToBeClosedByThisPr(
  octokit: Octokit,
  issue: {
    owner: string;
    repo: string;
    issue_number: number;
  }
) {
  const { owner, repo, issue_number } = issue;

  if (!issue_number) {
    throw new Error("[collectIssuesToBeClosedByThisPr]: issue_number is required");
  }
  try {
    const result = await octokit.graphql<PrLinkedToIssue>(closedByPullRequestsReferences, {
      owner,
      repo,
      issue_number,
    });

    return result.repository.issue.closedByPullRequestsReferences.edges.map((edge) => edge.node);
  } catch {
    // probably not found/deleted
    return [];
  }
}


export async function fetchRepoData(octokit: Octokit, owner: string, repo: string) {
  const prs = await fetchAllPRs(octokit, owner, repo);
  const issues = await fetchAllIssues(octokit, owner, repo);
  return { prs, issues };
}

export type AllPrs = {
  number: number;
  title: string;
  body: string;
  author: { login: string };
  createdAt: string;
  mergedAt: string;
  closedAt: string;
  isDraft: boolean;
  state: string;
  baseRefName: string;
  headRefName: string;
}

async function fetchAllPRs(octokit: Octokit, owner: string, repo: string): Promise<AllPrs[]> {
  let hasNextPage = true;
  let endCursor = null;
  const prs: any[] = [];

  while (hasNextPage) {
    const query = `
      query($owner: String!, $repo: String!, $after: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: 100, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              number
              title
              body
              author {
                login
              }
              createdAt
              mergedAt
              closedAt
              isDraft
              state
              baseRefName
              headRefName
            }
          }
        }
      }
    `;

    const variables = { owner, repo, after: endCursor };

    try {
      // Check rate limits before making the request
      await checkRateLimit(octokit);

      const result = await octokit.graphql(query, variables) as GraphQlQueryResponseData;
      const pullRequests = result.repository.pullRequests.nodes;
      prs.push(...pullRequests);
      hasNextPage = result.repository.pullRequests.pageInfo.hasNextPage;
      endCursor = result.repository.pullRequests.pageInfo.endCursor;
    } catch (error: any) {
      console.error(`Error fetching PRs for ${owner}/${repo}:`, error.message);
      if (error.errors && error.errors[0].type === 'RATE_LIMITED') {
        // Wait and retry if rate limited
        console.log('Rate limited. Waiting before retrying...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
        continue;
      } else {
        // Handle other errors or exit
        console.error('An error occurred:', error.errors ? error.errors[0].message : error.message);
        break;
      }
    }
  }

  return prs;
}
export type PrDetails = {
  comments: { nodes: { body: string; author: { login: string }; createdAt: string }[] } | null | undefined;
  reviews: { nodes: { author: { login: string }; state: string; submittedAt: string; body: string }[] } | null;
  commits: { nodes: { commit: { additions: number; deletions: number; committedDate: string; message: string; author: { user: { login: string } } } }[] } | null;
  closingIssuesReferences: { nodes: { number: number; title: string }[] } | null;
} | null;

export async function fetchPRDetails(octokit: Octokit, owner: string, repo: string, prNumber: number): Promise<PrDetails | null> {
  const query = `
    query($owner: String!, $repo: String!, $prNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $prNumber) {
          comments(first: 100) {
            nodes {
              body
              author {
                login
              }
              createdAt
            }
          }
          reviews(first: 100) {
            nodes {
              author {
                login
              }
              state
              submittedAt
              body
            }
          }
          commits(first: 100) {
            nodes {
              commit {
                additions
                deletions
                committedDate
                message
                author {
                  user {
                    login
                  }
                }
              }
            }
          }
          closingIssuesReferences(first: 10) {
            nodes {
              number
              title
            }
          }
        }
      }
    }
  `;

  const variables = { owner, repo, prNumber };
  try {
    const result = await octokit.graphql(query, variables) as GraphQlQueryResponseData;
    return result.repository.pullRequest;
  } catch (error) {
    console.error(`Error fetching details for PR #${prNumber}:`, error);
    return null;
  }
}

async function checkRateLimit(octokit: Octokit) {
  const rateLimit = await octokit.rateLimit.get();
  const remaining = rateLimit.data.resources.core.remaining;
  if (remaining < 100) {
    console.log('Approaching rate limit. Remaining requests:', remaining);
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  if (remaining === 0) {
    const resetTime = rateLimit.data.resources.core.reset * 1000;
    const sleepTime = resetTime - Date.now() + 1000; // Add 1 second to account for any latency
    console.log('Rate limit reached. Sleeping until reset...');
    await sleep(sleepTime);
  }

}

export type Issue = {
  number: number;
  title: string;
  body: string;
  author: { login: string };
  createdAt: string;
  closedAt: string;
  state: string;
  labels: { nodes: { name: string }[] };
  comments: { nodes: { body: string; author: { login: string }; createdAt: string }[] };
}

export async function fetchAllIssues(octokit: Octokit, owner: string, repo: string): Promise<Issue[]> {
  let hasNextPage = true;
  let endCursor = null;
  const issues: any[] = [];

  while (hasNextPage) {
    const query = `
      query($owner: String!, $repo: String!, $after: String) {
        repository(owner: $owner, name: $repo) {
          issues(first: 100, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              number
              title
              body
              author {
                login
              }
              createdAt
              closedAt
              state
              labels(first: 10) {
                nodes {
                  name
                }
              }
              comments(first: 100) {
                nodes {
                  body
                  author {
                    login
                  }
                  createdAt
                }
              }
            }
          }
        }
      }
    `;

    const variables = { owner, repo, after: endCursor };
    const result = await octokit.graphql(query, variables) as GraphQlQueryResponseData;
    const fetchedIssues = result.repository.issues.nodes;
    issues.push(...fetchedIssues);
    hasNextPage = result.repository.issues.pageInfo.hasNextPage;
    endCursor = result.repository.issues.pageInfo.endCursor;
  }

  return issues;
}
