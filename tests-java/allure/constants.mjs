/** Shared Allure ethalon constants. */
export const REPORT_LANGUAGE = "ru";

export const PYRAMID_LAYERS = [
  "unit",
  "component",
  "integration",
  "api",
  "e2e",
  "manual",
];

export const STABILITY_THRESHOLD = 90;

export const STABILITY_SKIP_STATUSES = ["skipped", "unknown"];

export const HISTORY_DEFAULTS = {
  historyPath: "./history.jsonl",
  appendHistory: true,
  historyLimit: 20,
  knownIssuesPath: "./known.json",
};

/** Default chart/layout titles shared by awesome + dashboard. */
export const TITLES = {
  currentStatus: "Текущий статус по сервисам",
  testingPyramid: "Пирамида тестирования",
  testResultSeverities: "Результаты по severity",
  statusDynamics: "Динамика статусов",
  statusTransitions: "Переходы статусов",
  testBaseGrowthDynamics: "Динамика роста тестовой базы",
  coverageDiff: "Карта изменений покрытия",
  successRateDistribution: "Распределение успешности",
  problemsByEnvironment: "Распределение проблем по environment",
  stabilityByComponent: "Стабильность по сервисам",
  stabilityByFeature: "Стабильность по feature",
  stabilityByEpic: "Стабильность по epic",
  stabilityByStory: "Стабильность по story",
  durations: "Гистограмма длительностей",
  durationsByLayer: "Длительности по layer",
  durationDynamics: "Динамика длительности",
  statusAgePyramid: "Пирамида возраста статусов",
};
