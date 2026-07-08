/** Ethalon failure taxonomy for Allure categories. */
export const categoryRules = [
  {
    name: "Таймауты",
    matchers: {
      statuses: ["failed", "broken"],
      message: "timeout|Timeout|timed out",
    },
    groupBy: ["severity"],
    groupByMessage: true,
  },
  {
    name: "Ошибки проверок",
    matchers: {
      statuses: ["failed", "broken"],
      message: "AssertionError|assertion|expected",
    },
    groupBy: ["severity"],
    groupByMessage: true,
  },
];
