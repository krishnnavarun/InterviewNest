// Long-term memory across interviews: score trends and weak areas that the
// planner re-targets in the next interview.
import Interview from '../models/Interview.js';
import { DIMENSIONS, DIMENSION_IDS } from '../config/interview.constants.js';
import { getUsageToday } from './usage.service.js';

const RECENT_WINDOW = 5;
const WEAK_THRESHOLD = 65;

function dimensionAverages(interviews) {
  const averages = {};
  for (const dimension of DIMENSION_IDS) {
    const values = interviews.map((interview) => interview.dimensionScores?.[dimension]).filter((value) => typeof value === 'number');
    if (values.length) averages[dimension] = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }
  return averages;
}

function weakAreasFrom(interviews) {
  const averages = dimensionAverages(interviews);
  const latestImprovement = interviews.at(-1)?.report?.improvements?.[0]?.point;
  return Object.entries(averages)
    .filter(([, average]) => average < WEAK_THRESHOLD)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([dimension, average], index) => ({
      dimension,
      label: DIMENSIONS[dimension].label,
      average,
      note: index === 0 && latestImprovement ? latestImprovement : undefined,
    }));
}

const completedQuery = (userId) =>
  Interview.find({ userId, status: 'completed' })
    .sort({ completedAt: 1 })
    .select('roleTitle difficultyLabel overallScore dimensionScores completedAt createdAt report.improvements report.headline')
    .lean();

export async function getWeakAreas(userId) {
  const interviews = await completedQuery(userId);
  return weakAreasFrom(interviews.slice(-RECENT_WINDOW));
}

export async function getProgress(userId) {
  const [interviews, usage, inProgress] = await Promise.all([
    completedQuery(userId),
    getUsageToday(userId),
    Interview.findOne({ userId, status: 'in_progress' })
      .sort({ createdAt: -1 })
      .select('roleTitle difficultyLabel createdAt currentTopicIndex plan.topics.title')
      .lean(),
  ]);

  const recent = interviews.slice(-RECENT_WINDOW);
  const scores = interviews.map((interview) => interview.overallScore);

  return {
    stats: {
      completed: interviews.length,
      averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
      bestScore: scores.length ? Math.max(...scores) : null,
      lastScore: scores.at(-1) ?? null,
      // Change between the first and last of the recent window
      trend: recent.length >= 2 ? recent.at(-1).overallScore - recent[0].overallScore : null,
    },
    series: interviews.map((interview) => ({
      id: interview._id,
      date: interview.completedAt ?? interview.createdAt,
      roleTitle: interview.roleTitle,
      difficultyLabel: interview.difficultyLabel,
      overall: interview.overallScore,
      dimensions: interview.dimensionScores,
    })),
    dimensionAverages: dimensionAverages(recent),
    weakAreas: weakAreasFrom(recent),
    usage,
    inProgress: inProgress
      ? {
          id: inProgress._id,
          roleTitle: inProgress.roleTitle,
          difficultyLabel: inProgress.difficultyLabel,
          createdAt: inProgress.createdAt,
          progress: `${inProgress.currentTopicIndex + 1}/${inProgress.plan?.topics?.length ?? 0}`,
        }
      : null,
  };
}
