import { Issue, User, PullRequest } from "@octokit/graphql-schema";

type ClosingIssuesReferences = {
  node: Pick<Issue, "url" | "title" | "number" | "state" | "body"> & Pick<User, "login" | "id">;
};

type ClosedByPullRequestsReferences = {
  node: Pick<PullRequest, "url" | "title" | "number" | "state" | "body"> & Pick<User, "login" | "id">;
};

export type IssueClosedByPr = {
  repository: {
    issue: {
      closingIssuesReferences: {
        edges: ClosingIssuesReferences[];
      };
    };
  };
};

export type PrLinkedToIssue = {
  repository: {
    issue: {
      closedByPullRequestsReferences: {
        edges: ClosedByPullRequestsReferences[];
      };
    };
  };
};

export const closingIssuesReferencesQuery = /* GraphQL */ `
  query collectLinkedIssues($owner: String!, $repo: String!, $pull_number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pull_number) {
        closingIssuesReferences(first: 100, includeClosed: true) {
          edges {
            node {
              url
              title
              body
              state
              number
              author {
                login
                ... on User {
                  id: databaseId
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const closedByPullRequestsReferences = /* GraphQL */ `
  query collectLinkedPullRequests($owner: String!, $repo: String!, $issue_number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $issue_number) {
        closedByPullRequestsReferences(first: 100, includeClosedPrs: true) {
          edges {
            node {
              url
              title
              body
              state
              number
              author {
                login
                ... on User {
                  id: databaseId
                }
              }
            }
          }
        }
      }
    }
  }
`;
