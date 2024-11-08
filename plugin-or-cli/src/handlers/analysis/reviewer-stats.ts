import { RestEndpointMethodTypes } from '@octokit/rest';
import {
  parseISO,
  formatISO,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
} from 'date-fns';
import { ReviewerStats } from '../../types/analytics';

export function performReviewerAnalysis(
  pr: RestEndpointMethodTypes['pulls']['get']['response']['data'] | null | undefined,
  reviews: RestEndpointMethodTypes['pulls']['listReviews']['response']['data'] | null | undefined,
  reviewComments: RestEndpointMethodTypes['pulls']['listReviewComments']['response']['data'] | null | undefined
): ReviewerStats[] {
  const reviewerStatsMap: { [login: string]: ReviewerStats } = {};
  reviews = reviews || [];
  reviewComments = reviewComments || [];

  const prCreatedAt = pr?.created_at ? parseISO(pr.created_at).getTime() : null;
  const prClosedAt = pr?.closed_at ? parseISO(pr.closed_at).getTime() : Date.now();
  const prDurationDays = prCreatedAt
    ? differenceInDays(new Date(prClosedAt), new Date(prCreatedAt)) + 1
    : 1;

  for (const review of reviews) {
    const login = review.user?.login || 'unknown';
    const submittedAt = review.submitted_at ? parseISO(review.submitted_at).getTime() : null;

    if (!reviewerStatsMap[login]) {
      reviewerStatsMap[login] = {
        login,
        totalReviews: 0,
        totalReviewComments: 0,
        totalReviewCommentsAddressed: 0,
        totalReviewCommentsIgnored: 0,
        averageTimeSpentReviewing: 0,
        totalTimeSpentReviewing: 0,
        averageTimeBetweenReviews: 0,
        averageReviewsPerDay: 0,
        averageReviewsPerWeek: 0,
        averageReviewsPerMonth: 0,
        totalReviewsPerDay: {},
        totalReviewsPerWeek: {},
        totalReviewsPerMonth: {},
        totalReviewCommentsPerDay: {},
        totalReviewCommentsPerWeek: {},
        totalReviewCommentsPerMonth: {},
        requestToCompletionTimes: {},
        completionToAddressedTimes: {},
      };
    }

    const stats = reviewerStatsMap[login];
    stats.totalReviews += 1;

    if (submittedAt) {
      const date = formatISO(new Date(submittedAt), { representation: 'date' });
      stats.totalReviewsPerDay[date] = (stats.totalReviewsPerDay[date] || 0) + 1;

      const week = `${new Date(submittedAt).getFullYear()}-W${getWeekNumber(new Date(submittedAt))}`;
      stats.totalReviewsPerWeek[week] = (stats.totalReviewsPerWeek[week] || 0) + 1;

      const month = date.slice(0, 7);
      stats.totalReviewsPerMonth[month] = (stats.totalReviewsPerMonth[month] || 0) + 1;
    }
  }

  for (const comment of reviewComments) {
    const login = comment.user?.login || 'unknown';
    const createdAt = comment.created_at ? parseISO(comment.created_at).getTime() : null;

    if (!reviewerStatsMap[login]) {
      reviewerStatsMap[login] = {
        login,
        totalReviews: 0,
        totalReviewComments: 0,
        totalReviewCommentsAddressed: 0,
        totalReviewCommentsIgnored: 0,
        averageTimeSpentReviewing: 0,
        totalTimeSpentReviewing: 0,
        averageTimeBetweenReviews: 0,
        averageReviewsPerDay: 0,
        averageReviewsPerWeek: 0,
        averageReviewsPerMonth: 0,
        totalReviewsPerDay: {},
        totalReviewsPerWeek: {},
        totalReviewsPerMonth: {},
        totalReviewCommentsPerDay: {},
        totalReviewCommentsPerWeek: {},
        totalReviewCommentsPerMonth: {},
        requestToCompletionTimes: {},
        completionToAddressedTimes: {},
      };
    }

    const stats = reviewerStatsMap[login];
    stats.totalReviewComments += 1;

    if (comment.in_reply_to_id) {
      stats.totalReviewCommentsAddressed += 1;
    } else {
      stats.totalReviewCommentsIgnored += 1;
    }

    if (createdAt) {
      const date = formatISO(new Date(createdAt), { representation: 'date' });
      stats.totalReviewCommentsPerDay[date] =
        (stats.totalReviewCommentsPerDay[date] || 0) + 1;

      const week = `${new Date(createdAt).getFullYear()}-W${getWeekNumber(new Date(createdAt))}`;
      stats.totalReviewCommentsPerWeek[week] =
        (stats.totalReviewCommentsPerWeek[week] || 0) + 1;

      const month = date.slice(0, 7);
      stats.totalReviewCommentsPerMonth[month] =
        (stats.totalReviewCommentsPerMonth[month] || 0) + 1;
    }
  }

  for (const login in reviewerStatsMap) {
    const stats = reviewerStatsMap[login];

    stats.averageReviewsPerDay = stats.totalReviews / prDurationDays;
    stats.averageReviewsPerWeek = stats.averageReviewsPerDay * 7;
    stats.averageReviewsPerMonth = stats.averageReviewsPerDay * (365 / 12);

    const reviewTimestamps = reviews
      .filter((r) => r.user?.login === login)
      .map((r) => (r.submitted_at ? parseISO(r.submitted_at).getTime() : null))
      .filter((t): t is number => t !== null)
      .sort((a, b) => a - b);

    let totalIntervals = 0;
    for (let i = 1; i < reviewTimestamps.length; i++) {
      totalIntervals += reviewTimestamps[i] - reviewTimestamps[i - 1];
    }
    stats.averageTimeBetweenReviews =
      reviewTimestamps.length > 1 ? totalIntervals / (reviewTimestamps.length - 1) : 0;

    if (prCreatedAt) {
      const firstReviewTime = reviewTimestamps[0] || prCreatedAt;
      const lastReviewTime =
        reviewTimestamps[reviewTimestamps.length - 1] || prCreatedAt;
      stats.totalTimeSpentReviewing = lastReviewTime - firstReviewTime;
      stats.averageTimeSpentReviewing =
        stats.totalReviews > 0 ? stats.totalTimeSpentReviewing / stats.totalReviews : 0;
    }

    const reviewsForLogin = reviews.filter((r) => r.user?.login === login);
    for (const review of reviewsForLogin) {
      if (review.submitted_at && prCreatedAt) {
        const reviewTime = parseISO(review.submitted_at).getTime();
        const requestTime = reviewTime - prCreatedAt;
        stats.requestToCompletionTimes[review.id.toString()] = requestTime;
      }
    }

    const commentsForLogin = reviewComments.filter((c) => c.user?.login === login);
    for (const comment of commentsForLogin) {
      if (comment.created_at && prCreatedAt) {
        const commentTime = parseISO(comment.created_at).getTime();
        const completionTime = commentTime - prCreatedAt;
        stats.completionToAddressedTimes[comment.id.toString()] = completionTime;
      }
    }

    reviewerStatsMap[login] = stats;
  }

  return Object.values(reviewerStatsMap);
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}