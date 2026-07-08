import { buildAwesomeCharts } from "./awesome-charts.mjs";
import { categoryRules } from "./categories.mjs";
import {
  HISTORY_DEFAULTS,
  REPORT_LANGUAGE,
} from "./constants.mjs";
import { buildDashboardLayout } from "./dashboard-layout.mjs";
import { qualityGateRules } from "./quality-gate.mjs";

/**
 * Build Allure 3 config from ethalon modules.
 *
 * @param {object} profile
 * @param {string} profile.slug - repo slug → `{slug} Tests`
 * @param {string[]} [profile.epicCharts] - optional per-epic statusDynamics tiles
 * @param {object} [profile.variables] - Allure variables override
 */
export function createAllureConfig({
  slug,
  epicCharts = [],
  variables,
} = {}) {
  if (!slug || typeof slug !== "string") {
    throw new Error("createAllureConfig: profile.slug is required");
  }

  return {
    name: `${slug} Tests`,
    ...HISTORY_DEFAULTS,
    variables: variables ?? {
      Framework: "JUnit 5 + Selenide",
      Report: "Allure 3",
    },
    qualityGate: {
      rules: qualityGateRules.map((rule) => ({ ...rule })),
    },
    categories: {
      rules: categoryRules.map((rule) => structuredClone(rule)),
    },
    plugins: {
      awesome: {
        options: {
          reportLanguage: REPORT_LANGUAGE,
          groupBy: ["parentSuite", "suite", "subSuite"],
          charts: buildAwesomeCharts(),
        },
      },
      dashboard: {
        options: {
          reportName: `${slug} Tests Dashboard`,
          reportLanguage: REPORT_LANGUAGE,
          layout: buildDashboardLayout({ epicCharts }),
        },
      },
      csv: {
        options: {
          fileName: `${slug}.csv`,
        },
      },
    },
  };
}
