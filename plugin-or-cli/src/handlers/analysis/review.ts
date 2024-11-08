import { RestEndpointMethodTypes } from '@octokit/rest';
import {
  parseISO,
  differenceInDays,
  formatISO,
} from 'date-fns';
import { ReviewAnalytics } from '../../types/analytics';

export function performReviewAnalysis(
  pr: RestEndpointMethodTypes['pulls']['get']['response']['data'] | null | undefined,
  reviews: RestEndpointMethodTypes['pulls']['listReviews']['response']['data'] | null | undefined,
  reviewComments: RestEndpointMethodTypes['pulls']['listReviewComments']['response']['data'] | null | undefined,
  comments: RestEndpointMethodTypes['issues']['listComments']['response']['data'] | null | undefined,
): ReviewAnalytics {
  reviews = reviews || [];
  reviewComments = reviewComments || [];
  comments = comments || [];

  const totalReviews = reviews.length;
  const totalReviewComments = reviewComments.length;
  const totalReviewRequests = pr?.requested_reviewers?.length || 0;

  const reviewsPerReviewer: { [login: string]: number } = {};
  const totalTimeSpentReviewingPerReviewer: { [login: string]: number } = {};
  const reviewTimestamps: number[] = [];
  const requestToCompletionTimes: { [login: string]: number } = {};
  const completionToAddressedTimes: { [login: string]: number } = {};

  let totalReviewCommentsAddressed = 0;
  let totalReviewCommentsIgnored = 0;

  const totalReviewsPerDay: { [date: string]: number } = {};
  const totalReviewsPerWeek: { [week: string]: number } = {};
  const totalReviewsPerMonth: { [month: string]: number } = {};

  const totalReviewCommentsPerDay: { [date: string]: number } = {};
  const totalReviewCommentsPerWeek: { [week: string]: number } = {};
  const totalReviewCommentsPerMonth: { [month: string]: number } = {};

  const prStartTime = pr?.created_at ? parseISO(pr.created_at) : null;
  const prEndTime = pr?.closed_at ? parseISO(pr.closed_at) : new Date();
  const prDurationDays = prStartTime ? differenceInDays(prEndTime, prStartTime) + 1 : 1;

  for (const review of reviews) {
    const reviewerLogin = review.user?.login || 'unknown';
    reviewsPerReviewer[reviewerLogin] = (reviewsPerReviewer[reviewerLogin] || 0) + 1;

    const submittedAt = review.submitted_at ? parseISO(review.submitted_at).getTime() : null;
    if (submittedAt) {
      reviewTimestamps.push(submittedAt);

      const date = formatISO(new Date(submittedAt), { representation: 'date' });
      totalReviewsPerDay[date] = (totalReviewsPerDay[date] || 0) + 1;

      const week = `${new Date(submittedAt).getFullYear()}-W${getWeekNumber(new Date(submittedAt))}`;
      totalReviewsPerWeek[week] = (totalReviewsPerWeek[week] || 0) + 1;

      const month = formatISO(new Date(submittedAt), { representation: 'date' }).slice(0, 7);
      totalReviewsPerMonth[month] = (totalReviewsPerMonth[month] || 0) + 1;
    }
  }

  for (const comment of reviewComments) {
    const date = comment.created_at ? formatISO(parseISO(comment.created_at), { representation: 'date' }) : null;
    if (date) {
      totalReviewCommentsPerDay[date] = (totalReviewCommentsPerDay[date] || 0) + 1;

      const week = `${new Date(comment.created_at).getFullYear()}-W${getWeekNumber(new Date(comment.created_at))}`;
      totalReviewCommentsPerWeek[week] = (totalReviewCommentsPerWeek[week] || 0) + 1;

      const month = date.slice(0, 7);
      totalReviewCommentsPerMonth[month] = (totalReviewCommentsPerMonth[month] || 0) + 1;
    }

    if (comment.in_reply_to_id) {
      totalReviewCommentsAddressed += 1;
    } else {
      totalReviewCommentsIgnored += 1;
    }
  }

  reviewTimestamps.sort((a, b) => a - b);

  let totalTimeSpentReviewing = 0;
  const reviewerFirstLastReviewTimes: { [login: string]: { first: number; last: number } } = {};

  for (const review of reviews) {
    const reviewerLogin = review.user?.login || 'unknown';
    const submittedAt = review.submitted_at ? parseISO(review.submitted_at).getTime() : null;
    if (submittedAt) {
      if (!reviewerFirstLastReviewTimes[reviewerLogin]) {
        reviewerFirstLastReviewTimes[reviewerLogin] = { first: submittedAt, last: submittedAt };
      } else {
        if (submittedAt < reviewerFirstLastReviewTimes[reviewerLogin].first) {
          reviewerFirstLastReviewTimes[reviewerLogin].first = submittedAt;
        }
        if (submittedAt > reviewerFirstLastReviewTimes[reviewerLogin].last) {
          reviewerFirstLastReviewTimes[reviewerLogin].last = submittedAt;
        }
      }
    }
  }

  for (const login in reviewerFirstLastReviewTimes) {
    const timeSpent = reviewerFirstLastReviewTimes[login].last - reviewerFirstLastReviewTimes[login].first;
    totalTimeSpentReviewing += timeSpent;
    totalTimeSpentReviewingPerReviewer[login] = timeSpent;
  }

  const averageTimeSpentReviewing =
    totalReviews > 0 ? totalTimeSpentReviewing / totalReviews : 0;

  let averageTimeBetweenReviews = 0;
  if (reviewTimestamps.length > 1) {
    let totalIntervals = 0;
    for (let i = 1; i < reviewTimestamps.length; i++) {
      totalIntervals += reviewTimestamps[i] - reviewTimestamps[i - 1];
    }
    averageTimeBetweenReviews = totalIntervals / (reviewTimestamps.length - 1);
  }

  const averageReviewsPerDay = totalReviews / prDurationDays;
  const averageReviewsPerWeek = averageReviewsPerDay * 7;
  const averageReviewsPerMonth = averageReviewsPerDay * (365 / 12);

  const reviewAnalytics: ReviewAnalytics = {
    totalReviews,
    totalTimeSpentReviewing,
    totalReviewComments,
    totalReviewCommentsAddressed,
    totalReviewCommentsIgnored,
    totalReviewRequests,
    averageTimeSpentReviewing,
    averageTimeBetweenReviews,
    averageReviewsPerDay,
    averageReviewsPerWeek,
    averageReviewsPerMonth,
    totalReviewsPerDay,
    totalReviewsPerWeek,
    totalReviewsPerMonth,
    totalReviewCommentsPerDay,
    totalReviewCommentsPerWeek,
    totalReviewCommentsPerMonth,
    requestToCompletionTimes: {}, // Requires additional data
    completionToAddressedTimes: {}, // Requires additional data
    reviewsPerReviewer,
  };

  return reviewAnalytics;
}

function getWeekNumber(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((date.getDay() + 1 + days) / 7);
}