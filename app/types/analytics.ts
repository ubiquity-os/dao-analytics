export type AnalysisResults = Record<string, Record<string, Record<string, IssueAnalytics | null>>>;

/**
 * Analytics for a given issue
 */
export type IssueAnalytics = {
    /**
     *      when the task was first created to when it was closed
     */
    timeFromOpenToClose: number | null;
    /**
     *      when the PR that completed the task was opened to when the task was completed
     */
    timeFromPrOpenToIssueClose: number | null;
    /**
     *      number of contributors who attempted the task in total before completion
     */
    totalContributorsThatAttempted: number;
    /**
     *      whether the task has linked PRs (for tracking purposes later)
     */
    hasMultipleLinkedPrs: boolean;
    hasLinkedPr: boolean;
    /**
     *      number of PRs the task completer has opened towards the task
     */
    totalPrsFromAuthorThatClosedIssue: number;
    /**
     *      number of comments the task completer has made towards the task
     */
    totalCommentsFromContributorThatClosedIssue: number;
    pullRequestAnalytics: PullRequestAnalytics | null;
    reviewAnalytics: ReviewAnalytics | null;
    reviewerStats: ReviewerStats[] | null;
    commitAnalytics: CommitAnalytics | null;
};

/**
 * Covers analytics for the Pull Request lifecycle
 */
export type PullRequestAnalytics = {
    /**
     *      when the PR was first created to when it was closed
     */
    timeFromOpenToClose: number;
    /**
     *      when the PR was first created to when it was merged
     */
    timeFromOpenToMerge: number;
    /**
     *      total number of comments on the PR
     */
    totalComments: number;
    /**
     *      total number of reviews on the PR
     */
    totalReviews: number;
    /**
     *      total number of reviewers on the PR
     */
    totalReviewers: number;
    /**
     *      total number of review requests made on the PR
     */
    totalReviewRequests: number;
    /**
     *      total number of code review comments made during reviews
     */
    totalReviewComments: number;
    /**
     *      total number of code review comments addressed during reviews
     */
    totalReviewCommentsAddressed: number;
    /**
     *      total number of code review comments ignored during reviews
     */
    totalReviewCommentsIgnored: number;
    /**
     *      total number of contributors on the PR
     */
    totalContributors: number;
    /**
     *      total number of commits on the PR
     */
    totalCommits: number;
    /**
     *      average time from when a review was requested to when it was completed (tracking the reviewer)
     */
    averageTimeFromReviewRequestToReviewCompletion: number;
    /**
     *      average time from when a review was completed to when the review was addressed (tracking the contributor)
     */
    averageTimeFromReviewCompletionToReviewAddressed: number;
};

/**
 * Covers analytics for commits within the Pull Request lifecycle
 */
export type CommitAnalytics = {
    /**
     * Total number of commits made across all PRs associated to the
     * author of the PR that closed the issue (may have re-done the work etc)
     */
    totalCommits: number;
    /**
     * Total number of lines added across all commits
     */
    linesAdded: number;
    /**
     * Total number of lines removed across all commits
     */
    linesRemoved: number;
    /**
     * Number of commits made by each contributor if multiple contributors
     */
    commitsPerContributor: {
        [login: string]: number;
    };
    /**
     * Time between the first commit of the PR and the last commit of the PR (tracking contributor efficiency)
     */
    timeFromFirstCommitToLastCommit: number;
    /**
     * Time between the last commit of the PR and the PR being closed (tracking reviewer efficiency)
     */
    timeFromLastCommitToClose: number;
    /**
     * Average time between commits (tracking contributor efficiency)
     */
    averageTimeBetweenCommits: number;
    averageCommitsPerDay: number;
    averageCommitsPerWeek: number;
    averageCommitsPerMonth: number;
    totalCommitsPerDay: {
        [date: string]: number;
    };
    totalCommitsPerWeek: {
        [date: string]: number;
    };
    totalCommitsPerMonth: {
        [date: string]: number;
    };
};

/**
 * Covers analytics for PR reviews across the Pull Request lifecycle
 */
export type ReviewAnalytics = {
    /**
     * Total number of reviews made on the PR (tracks reviewer effort, contributor efficiency)
     */
    totalReviews: number;
    /**
     * Total time spent reviewing the PR (tracks reviewer effort/efficiency)
     */
    totalTimeSpentReviewing: number;
    /**
     * Total number of code review comments made during reviews
     */
    totalReviewComments: number;
    /**
     * Total number of code review comments addressed during reviews
     */
    totalReviewCommentsAddressed: number;
    /**
     * Total number of code review comments ignored during reviews
     */
    totalReviewCommentsIgnored: number;
    /**
     * Total number of review requests made on the PR
     */
    totalReviewRequests: number;
    /**
     * Average time spent reviewing the PR across all reviewers
     */
    averageTimeSpentReviewing: number;
    /**
     * Average time between reviews
     */
    averageTimeBetweenReviews: number;
    /**
     * Average number of reviews per day
     */
    averageReviewsPerDay: number;
    /**
     * Average number of reviews per week
     */
    averageReviewsPerWeek: number;
    /**
     * Average number of reviews per month
     */
    averageReviewsPerMonth: number;
    totalReviewsPerDay: {
        [date: string]: number;
    };
    totalReviewsPerWeek: {
        [date: string]: number;
    };
    totalReviewsPerMonth: {
        [date: string]: number;
    };
    totalReviewCommentsPerDay: {
        [date: string]: number;
    };
    totalReviewCommentsPerWeek: {
        [date: string]: number;
    };
    totalReviewCommentsPerMonth: {
        [date: string]: number;
    };
    requestToCompletionTimes: {
        [login: string]: number;
    };
    completionToAddressedTimes: {
        [login: string]: number;
    };
    reviewsPerReviewer: {
        [login: string]: number;
    };
};

/**
 * Covers analytics on a per-reviewer basis. Built as an aggregate across all
 * indexed PRs when this data is collected as part of ReviewAnalytics.
 */
export type ReviewerStats = {
    login: string;
    totalReviews: number;
    totalReviewComments: number;
    totalReviewCommentsAddressed: number;
    totalReviewCommentsIgnored: number;
    averageTimeSpentReviewing: number;
    totalTimeSpentReviewing: number;
    averageTimeBetweenReviews: number;
    averageReviewsPerDay: number;
    averageReviewsPerWeek: number;
    averageReviewsPerMonth: number;
    totalReviewsPerDay: {
        [date: string]: number;
    };
    totalReviewsPerWeek: {
        [date: string]: number;
    };
    totalReviewsPerMonth: {
        [date: string]: number;
    };
    totalReviewCommentsPerDay: {
        [date: string]: number;
    };
    totalReviewCommentsPerWeek: {
        [date: string]: number;
    };
    totalReviewCommentsPerMonth: {
        [date: string]: number;
    };
    requestToCompletionTimes: {
        [login: string]: number;
    };
    completionToAddressedTimes: {
        [login: string]: number;
    };
};
