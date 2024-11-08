import { RestEndpointMethodTypes } from '@octokit/rest';
import { parseISO } from 'date-fns';
import { PullRequestAnalytics } from '../../types/analytics';

export function performPullRequestAnalysis(
  pr: RestEndpointMethodTypes['pulls']['get']['response']['data'] | null | undefined,
  reviews: RestEndpointMethodTypes['pulls']['listReviews']['response']['data'] | null | undefined,
  reviewComments: RestEndpointMethodTypes['pulls']['listReviewComments']['response']['data'] | null | undefined,
  comments: RestEndpointMethodTypes['issues']['listComments']['response']['data'] | null | undefined,
  prCommits: RestEndpointMethodTypes['pulls']['listCommits']['response']['data'] | null | undefined
): PullRequestAnalytics {
  const timeFromOpenToClose = pr?.closed_at ? parseISO(pr.closed_at).getTime() - parseISO(pr.created_at).getTime() : null;
  const timeFromOpenToMerge = pr?.merged_at ? parseISO(pr.merged_at).getTime() - parseISO(pr.created_at).getTime() : null;

  comments ??= [];
  reviewComments ??= [];
  reviews ??= [];

  const totalComments = [...comments, ...reviewComments, ...reviews].length;
  const totalReviews = reviews?.length;
  const totalReviewers = new Set(reviews?.map((r: any) => r.user.login)).size;
  const totalReviewRequests = pr?.requested_reviewers?.length;
  const totalReviewComments = reviewComments?.length;

  // Calculate average times
  const reviewCompletionTimes = reviews?.map((review: any) =>
    pr?.created_at ? parseISO(review?.submitted_at).getTime() - parseISO(pr?.created_at).getTime() : 0
  );

  const averageTimeFromReviewRequestToReviewCompletion =
    (reviewCompletionTimes?.reduce((a: number, b: number) => a + b, 0) || 0) / (reviewCompletionTimes?.length || 0);

  const averageTimeFromReviewCompletionToReviewAddressed =
    (reviewComments?.reduce((acc: number, comment: any) => {
      const review = reviews?.find((r: any) => r.id === comment.pull_request_review_id);
      if (!review) {
        return acc;
      }

      if (review.submitted_at && comment.created_at) {
        return parseISO(comment.created_at).getTime() - parseISO(review.submitted_at).getTime();
      }
      return acc;
    }, 0) || 0) / (reviewComments?.length || 0);

  const totalReviewCommentsAddressed = reviewComments?.reduce((acc: number, comment: any) => {
    const review = reviews?.find((r: any) => r.id === comment.pull_request_review_id);
    if (!review) {
      return acc;
    }

    if (comment.in_reply_to_id) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const totalReviewCommentsIgnored = reviewComments?.reduce((acc: number, comment: any) => {
    const review = reviews?.find((r: any) => r.id === comment.pull_request_review_id);
    if (!review) {
      return acc;
    }

    if (!comment.in_reply_to_id) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const totalPersonsInvolved = new Set([
    ...(reviews?.map((r: any) => r.user.login) || []),
    ...(reviewComments?.map((r: any) => r.user.login) || []),
    ...(comments?.map((r: any) => r.user.login) || []),
  ]).size;

  const totalCommits = prCommits?.length;
  return {
    timeFromOpenToClose,
    timeFromOpenToMerge,
    totalCommits: totalCommits || 0,
    totalComments,
    totalReviews,
    totalReviewers,
    totalReviewRequests: totalReviewRequests || 0,
    totalReviewComments,
    totalReviewCommentsAddressed,
    totalReviewCommentsIgnored,
    totalPersonsInvolved: totalPersonsInvolved || 0,
    averageTimeFromReviewRequestToReviewCompletion,
    averageTimeFromReviewCompletionToReviewAddressed,
  };
}