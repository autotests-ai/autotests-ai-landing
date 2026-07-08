import {
  PYRAMID_LAYERS,
  STABILITY_SKIP_STATUSES,
  STABILITY_THRESHOLD,
  TITLES,
} from "./constants.mjs";

/**
 * Dashboard plugin layout.
 * Invariant: index 0 = currentStatus, index 1 = testingPyramid.
 */
export function buildDashboardLayout({ epicCharts = [] } = {}) {
  const epicStatusDynamics = epicCharts.map((epic) => ({
    type: "statusDynamics",
    title: `Динамика — ${epic}`,
    limit: 20,
    filter: ({ labels }) =>
      labels.some(({ name, value }) => name === "epic" && value === epic),
  }));

  return [
    {
      type: "currentStatus",
      title: TITLES.currentStatus,
    },
    {
      type: "testingPyramid",
      title: TITLES.testingPyramid,
      layers: [...PYRAMID_LAYERS],
    },
    {
      type: "stabilityDistribution",
      title: TITLES.stabilityByComponent,
      threshold: STABILITY_THRESHOLD,
      skipStatuses: [...STABILITY_SKIP_STATUSES],
      groupBy: "label-name:component",
    },
    {
      type: "successRateDistribution",
      title: TITLES.successRateDistribution,
    },
    {
      type: "statusDynamics",
      title: TITLES.statusDynamics,
      limit: 20,
    },
    {
      type: "statusTransitions",
      title: TITLES.statusTransitions,
      limit: 20,
    },
    {
      type: "testBaseGrowthDynamics",
      title: TITLES.testBaseGrowthDynamics,
      limit: 20,
    },
    {
      type: "durationDynamics",
      title: TITLES.durationDynamics,
      limit: 20,
    },
    {
      type: "coverageDiff",
      title: TITLES.coverageDiff,
    },
    {
      type: "problemsDistribution",
      title: TITLES.problemsByEnvironment,
      by: "environment",
    },
    {
      type: "stabilityDistribution",
      title: TITLES.stabilityByFeature,
      threshold: STABILITY_THRESHOLD,
      skipStatuses: [...STABILITY_SKIP_STATUSES],
      groupBy: "feature",
    },
    {
      type: "stabilityDistribution",
      title: TITLES.stabilityByEpic,
      threshold: STABILITY_THRESHOLD,
      skipStatuses: [...STABILITY_SKIP_STATUSES],
      groupBy: "epic",
    },
    {
      type: "stabilityDistribution",
      title: TITLES.stabilityByStory,
      threshold: STABILITY_THRESHOLD,
      skipStatuses: [...STABILITY_SKIP_STATUSES],
      groupBy: "story",
    },
    {
      type: "testResultSeverities",
      title: TITLES.testResultSeverities,
    },
    {
      type: "durations",
      title: TITLES.durations,
      groupBy: "none",
    },
    {
      type: "durations",
      title: TITLES.durationsByLayer,
      groupBy: "layer",
    },
    {
      type: "statusAgePyramid",
      title: TITLES.statusAgePyramid,
      limit: 20,
    },
    ...epicStatusDynamics,
  ];
}
