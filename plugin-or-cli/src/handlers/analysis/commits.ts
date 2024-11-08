import { RestEndpointMethodTypes } from '@octokit/rest';
import {
  parseISO,
  differenceInDays,
  formatISO,
} from 'date-fns';
import { CommitAnalytics } from '../../types/analytics';

export function performCommitAnalysis(
  pr: RestEndpointMethodTypes['pulls']['get']['response']['data'] | null | undefined,
  prCommits: RestEndpointMethodTypes['pulls']['listCommits']['response']['data'] | null | undefined
): CommitAnalytics {
  prCommits = prCommits || [];

  if (prCommits.length === 0) {
    return {
      totalCommits: 0,
      linesAdded: 0,
      linesRemoved: 0,
      commitsPerContributor: {},
      timeFromFirstCommitToLastCommit: 0,
      timeFromLastCommitToClose: 0,
      averageTimeBetweenCommits: 0,
      averageCommitsPerDay: 0,
      averageCommitsPerWeek: 0,
      averageCommitsPerMonth: 0,
      totalCommitsPerDay: {},
      totalCommitsPerWeek: {},
      totalCommitsPerMonth: {},
    };
  }

  const totalCommits = prCommits.length;
  let linesAdded = 0;
  let linesRemoved = 0;
  const commitsPerContributor: { [login: string]: number } = {};
  const commitTimestamps: number[] = [];

  for (const commitData of prCommits) {
    const commit = commitData.commit;
    const authorLogin = commitData.author?.login || commit.author?.name || 'unknown';

    commitsPerContributor[authorLogin] = (commitsPerContributor[authorLogin] || 0) + 1;

    linesAdded += commitData.stats?.additions || 0;
    linesRemoved += commitData.stats?.deletions || 0;

    if (commit.author?.date) {
      const committedDate = parseISO(commit.author.date).getTime();
      commitTimestamps.push(committedDate);
    }
  }

  commitTimestamps.sort((a, b) => a - b);

  const timeFromFirstCommitToLastCommit =
    commitTimestamps[commitTimestamps.length - 1] - commitTimestamps[0];

  const timeFromLastCommitToClose = pr?.closed_at
    ? parseISO(pr.closed_at).getTime() - commitTimestamps[commitTimestamps.length - 1]
    : 0;

  let averageTimeBetweenCommits = 0;
  if (commitTimestamps.length > 1) {
    let totalIntervals = 0;
    for (let i = 1; i < commitTimestamps.length; i++) {
      totalIntervals += commitTimestamps[i] - commitTimestamps[i - 1];
    }
    averageTimeBetweenCommits = totalIntervals / (commitTimestamps.length - 1);
  }

  const totalCommitsPerDay: { [date: string]: number } = {};
  const totalCommitsPerWeek: { [week: string]: number } = {};
  const totalCommitsPerMonth: { [month: string]: number } = {};

  for (const timestamp of commitTimestamps) {
    const date = formatISO(new Date(timestamp), { representation: 'date' });
    totalCommitsPerDay[date] = (totalCommitsPerDay[date] || 0) + 1;

    const week = `${new Date(timestamp).getFullYear()}-W${getWeekNumber(new Date(timestamp))}`;
    totalCommitsPerWeek[week] = (totalCommitsPerWeek[week] || 0) + 1;

    const month = date.slice(0, 7);
    totalCommitsPerMonth[month] = (totalCommitsPerMonth[month] || 0) + 1;
  }

  const prStartTime = pr?.created_at ? parseISO(pr.created_at) : null;
  const prEndTime = pr?.closed_at ? parseISO(pr.closed_at) : new Date();
  const prDurationDays = prStartTime ? differenceInDays(prEndTime, prStartTime) + 1 : 1;

  const averageCommitsPerDay = totalCommits / prDurationDays;
  const averageCommitsPerWeek = averageCommitsPerDay * 7;
  const averageCommitsPerMonth = averageCommitsPerDay * (365 / 12);

  return {
    totalCommits,
    linesAdded,
    linesRemoved,
    commitsPerContributor,
    timeFromFirstCommitToLastCommit,
    timeFromLastCommitToClose,
    averageTimeBetweenCommits,
    averageCommitsPerDay,
    averageCommitsPerWeek,
    averageCommitsPerMonth,
    totalCommitsPerDay,
    totalCommitsPerWeek,
    totalCommitsPerMonth,
  };
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const daysPastSinceYearStart = Math.floor(
    (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.ceil((daysPastSinceYearStart + firstDayOfYear.getDay() + 1) / 7);
}