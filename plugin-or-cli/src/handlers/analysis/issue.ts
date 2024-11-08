import { parseISO } from "date-fns";
import Sentiment from "sentiment";
import { IssueAnalytics } from "../../types/analytics";
import { performReviewerAnalysis } from "./reviewer-stats";
import { performPullRequestAnalysis } from "./pull-request";
import { performReviewAnalysis } from "./review";
import { performCommitAnalysis } from "./commits";
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { getIssueComments, getPullRequestReviews, getPullRequestReviewComments, getPullRequestCommits, getPullRequestFiles, getIssueEvents, getIssue, getPullRequest } from "../../helpers/org-data-fetching";
import { createIssuePrTrackingMaps } from "../perform-analysis";
const sentiment = new Sentiment();

function analyzeSentiment(text: string): number {
  const result = sentiment.analyze(text);
  return result.comparative;
}

async function allRestDataRequired(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number | null | undefined,
  prNumber: number
) {
  let issueComments, issueEvents, issue;
  if (issueNumber) {
    issueComments = await getIssueComments(octokit, owner, repo, issueNumber) || [];
    issueEvents = await getIssueEvents(octokit, owner, repo, issueNumber) || [];
    issue = await getIssue(octokit, owner, repo, issueNumber) || null;
  }

  const prReviews = await getPullRequestReviews(octokit, owner, repo, prNumber);
  const prReviewComments = await getPullRequestReviewComments(octokit, owner, repo, prNumber);
  const prCommits = await getPullRequestCommits(octokit, owner, repo, prNumber);
  const prFiles = await getPullRequestFiles(octokit, owner, repo, prNumber);
  const pr = await getPullRequest(octokit, owner, repo, prNumber);

  return {
    issueComments,
    prReviews,
    prReviewComments,
    prCommits,
    prFiles,
    issueEvents,
    issue,
    pr,
  }
}

export async function performIssueAnalysis(
  octokit: Octokit,
  listedPrData: RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][0],
  listedIssueData: RestEndpointMethodTypes["issues"]["listForRepo"]["response"]["data"][0] | null | undefined,
  interactionGraph: Map<string, Set<string>>,
  maps: Awaited<ReturnType<typeof createIssuePrTrackingMaps>>
): Promise<IssueAnalytics> {
  const { issue, issueComments, issueEvents, pr, prCommits, prFiles, prReviewComments, prReviews } = await allRestDataRequired(octokit, listedPrData.base.repo.owner.login, listedPrData.base.repo.name, listedIssueData?.number, listedPrData.number);
  const { issueToPrs, prToIssue, issueMap, prMap } = maps;

  const timeFromOpenToClose = issue?.closed_at
    ? parseISO(issue.closed_at).getTime() - parseISO(issue.created_at).getTime()
    : null;
  const timeFromPrOpenToIssueClose = issue?.closed_at && pr?.created_at
    ? parseISO(issue.closed_at).getTime() - parseISO(pr.created_at).getTime()
    : null;
  const totalContributorsThatAttempted = issueEvents?.map((event) => event.event === 'assigned' ? event.actor.login : null).filter((login) => login !== null).length || 0;
  const hasMultipleLinkedPrs = (issueToPrs.get(issue?.number || 0)?.length || 0) > 1;
  const totalCommentsFromContributorThatClosedIssue = issueComments?.filter((comment) => comment.user && comment.user.login === pr?.user.login).length || 0;

  const totalPrsFromAuthorThatClosedIssue = issueToPrs.get(issue?.number || 0)?.filter((prNumber) => prMap.get(prNumber)?.user?.login === pr?.user.login).length || 0;

  // Sentiment Analysis
  const issueSentimentScore = analyzeSentiment(issue?.body || '');
  const prSentimentScore = analyzeSentiment(pr?.body || '');

  // Update Interaction Graph
  updateInteractionGraph(interactionGraph, pr, prReviews, prReviewComments, issueComments);

  const pullRequestAnalytics = performPullRequestAnalysis(pr, prReviews, prReviewComments, issueComments, prCommits);
  const reviewAnalytics = performReviewAnalysis(pr, prReviews, prReviewComments, issueComments);
  const commitAnalytics = performCommitAnalysis(pr, prCommits);
  const reviewerAnalytics = performReviewerAnalysis(pr, prReviews, prReviewComments);

  return {
    timeFromOpenToClose,
    timeFromPrOpenToIssueClose,
    totalContributorsThatAttempted,
    hasLinkedPr: !!pr,
    hasMultipleLinkedPrs,
    totalCommentsFromContributorThatClosedIssue,
    pullRequestAnalytics,
    reviewAnalytics,
    reviewerAnalytics,
    commitAnalytics,
    issue,
    pullRequest: pr,
    issueSentimentScore,
    prSentimentScore,
    totalPrsFromAuthorThatClosedIssue
  }
}

function updateInteractionGraph(
  interactionGraph: Map<string, Set<string>>,
  pr: RestEndpointMethodTypes["pulls"]["get"]["response"]["data"] | null | undefined,
  reviews: RestEndpointMethodTypes["pulls"]["listReviews"]["response"]["data"] | null | undefined,
  prReviewComments: RestEndpointMethodTypes["pulls"]["listReviewComments"]["response"]["data"] | null | undefined,
  comments: RestEndpointMethodTypes["issues"]["listComments"]["response"]["data"] | null | undefined
) {
  if (!pr) {
    return;
  }

  const author = pr.user.login;
  const participants = new Set([
    pr?.user?.login,
    ...(reviews?.map(review => review.user?.login) || []),
    ...(prReviewComments?.map(comment => comment.user?.login) || []),
    ...(comments?.map(comment => comment.user?.login) || []),
  ]);

  const reviewers = reviews?.map((review) => review.user?.login).filter((login): login is string => !!login);
  const commenters = comments?.map((comment) => comment.user?.login).filter((login): login is string => !!login);
  const reviewersCommenters = prReviewComments?.map((comment) => comment.user?.login).filter((login): login is string => !!login);

  participants.add(author);
  reviewers?.forEach((reviewer) => participants.add(reviewer));
  commenters?.forEach((commenter) => participants.add(commenter));
  reviewersCommenters?.forEach((reviewerCommenter) => participants.add(reviewerCommenter));

  participants.forEach((participant) => {
    if (participant && participant !== author) {
      if (!interactionGraph.has(author)) {
        interactionGraph.set(author, new Set());
      }
      interactionGraph.get(author)?.add(participant);
    }
  });
}