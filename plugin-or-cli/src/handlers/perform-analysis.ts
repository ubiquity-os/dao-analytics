import { writeFile } from "fs/promises";
import { logger } from "../helpers/logger";
import { AnalysisResults } from "../types/analytics";
import { performIssueAnalysis } from "./analysis/issue";
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { collectAllOrgIssues, collectAllOrgRepos, collectAllRepoPrs } from "../helpers/org-data-fetching";
import { collectClosingIssuesReferences, collectIssuesToBeClosedByThisPr } from "../helpers/gql-functions";

export async function performAnalysis(octokit: Octokit) {
  const orgs = ["ubiquity-os-marketplace", "ubiquity-os"];
  const prsWithoutTrackedIssues: unknown[] = [];
  const prsWithMultipleLinkedIssues: unknown[] = [];
  const analysisResults: AnalysisResults = {};
  const interactionGraph = new Map<string, Set<string>>();

  const orgRepos = (await Promise.all(
    orgs.map((org) => collectAllOrgRepos(octokit, org))
  )).flat();

  await Promise.all(
    orgRepos.map(async (repo) => {
      const [prs, issues] = await Promise.all([
        collectAllRepoPrs(octokit, repo.owner.login, repo.name),
        collectAllOrgIssues(octokit, repo.owner.login, repo.name),
      ]);

      const maps = await createIssuePrTrackingMaps(
        octokit,
        repo.owner.login,
        repo.name,
        prsWithMultipleLinkedIssues,
        prsWithoutTrackedIssues,
        prs,
        issues
      );

      const prsToAnalyze = prs.filter((pr) => maps.prToIssue.has(pr.number));

      await Promise.all(
        prsToAnalyze.map(async (pr) => {
          const issueNumber = maps.prToIssue.get(pr.number);
          const issue = issueNumber ? maps.issueMap.get(issueNumber) : null;
          const analyticsReport = await performIssueAnalysis(octokit, pr, issue, interactionGraph, maps);

          analysisResults[repo.owner.login] ??= {};
          analysisResults[repo.owner.login][repo.name] ??= {};
          analysisResults[repo.owner.login][repo.name][pr.number] = analyticsReport;

          logger.info(`Analysis complete for PR ${repo.owner.login}/${repo.name}/${pr.number}`);

          await writeFile(
            `./analytics/${repo.owner.login}/${repo.name}/${pr.number}.json`,
            JSON.stringify(analyticsReport, null, 2)
          );
        })
      );
    })
  );

  await storeAnalytics(
    analysisResults,
    prsWithoutTrackedIssues,
    prsWithMultipleLinkedIssues,
    interactionGraph
  );
}

export async function createIssuePrTrackingMaps(
  octokit: Octokit,
  org: string,
  repo: string,
  prsWithMultipleLinkedIssues: unknown[],
  prsWithoutTrackedIssues: unknown[],
  prs: RestEndpointMethodTypes["pulls"]["list"]["response"]["data"],
  issues: RestEndpointMethodTypes["issues"]["list"]["response"]["data"]
) {
  const issueToPrs = new Map<number, number[]>();
  const prToIssue = new Map<number, number>();
  const issueMap = new Map<number, RestEndpointMethodTypes["issues"]["list"]["response"]["data"][0]>();
  const prMap = new Map<number, RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][0]>();

  issues.forEach((issue) => issueMap.set(issue.number, issue));
  prs.forEach((pr) => prMap.set(pr.number, pr));

  await Promise.all(
    issues.map(async (issue) => {
      const linkedPrs = await collectIssuesToBeClosedByThisPr(octokit, {
        owner: org,
        repo: repo,
        issue_number: issue.number,
      });

      if (linkedPrs.length >= 1) {
        prsWithMultipleLinkedIssues.push({
          owner: org,
          repo: repo,
          issue: issue.number,
          linkedPrs,
        });

        linkedPrs.forEach((pr) => {
          const issuePrs = issueToPrs.get(issue.number) ?? [];
          issueToPrs.set(issue.number, [...issuePrs, pr.number]);
          prToIssue.set(pr.number, issue.number);
        });
      } else {
        prsWithoutTrackedIssues.push({ owner: org, repo: repo, issue: issue.number });
      }

      logger.info(`Issue found in ${org}/${repo}`, { issue: issue.number });
    })
  );

  await Promise.all(
    prs.map(async (pr) => {
      let issueNumber = prToIssue.get(pr.number);

      if (!issueNumber) {
        logger.info("No linked issue found using issue:pr map, trying reverse lookup...", {
          owner: org,
          repo: repo,
          pr: pr.number,
        });

        const closingReferences = await collectClosingIssuesReferences(octokit, {
          owner: org,
          repo: repo,
          issue_number: pr.number,
        });

        if (closingReferences.length >= 1) {
          logger.info("Found linked issue using reverse lookup", {
            owner: org,
            repo: repo,
            pr: pr.number,
            issue: closingReferences[0].number,
          });

          issueNumber = closingReferences[0].number;
          prToIssue.set(pr.number, issueNumber);
        } else {
          logger.info("No linked issue found using reverse lookup", {
            owner: org,
            repo: repo,
            pr: pr.number,
          });
        }
      }
    })
  );

  return { issueToPrs, prToIssue, issueMap, prMap };
}

async function storeAnalytics(
  analytics: AnalysisResults,
  prsWithoutTrackedIssues: unknown[],
  prsWithMultipleLinkedIssues: unknown[],
  interactionGraph: Map<string, Set<string>>
) {
  await writeFile("complete-analytics.json", JSON.stringify(analytics, null, 2));
  await writeFile("prsWithoutTrackedIssues.json", JSON.stringify(prsWithoutTrackedIssues, null, 2));
  await writeFile("prsWithMultipleLinkedIssues.json", JSON.stringify(prsWithMultipleLinkedIssues, null, 2));

  // Export Interaction Graph
  const interactionGraphData = Array.from(interactionGraph.entries()).map(([author, participants]) => ({
    author,
    participants: Array.from(participants),
  }));
  await writeFile("interaction-graph.json", JSON.stringify(interactionGraphData, null, 2));
}
