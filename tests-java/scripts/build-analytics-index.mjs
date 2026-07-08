#!/usr/bin/env node
/**
 * Normalize allure-results (+ optional history, agent-output) → analytics-index.json.
 * Consumed by frontend/allure-dashboard.html (Highcharts metrics panel).
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const UNCATEGORIZED_FAILURE = "Прочее";
const TAXONOMY_COLORS = ["#dc2626", "#d97706", "#7c3aed", "#0891b2", "#64748b"];
const PYRAMID_LAYERS = ["unit", "component", "integration", "api", "e2e", "manual"];

function parseArgs(argv) {
  const options = {
    resultsDir: "",
    historyFile: "",
    agentOutputDir: "",
    configFile: "",
    outputFile: "",
    historyLimit: 20,
    partial: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--results") options.resultsDir = argv[++index] ?? "";
    else if (token === "--history") options.historyFile = argv[++index] ?? "";
    else if (token === "--agent-output") options.agentOutputDir = argv[++index] ?? "";
    else if (token === "--config") options.configFile = argv[++index] ?? "";
    else if (token === "--output") options.outputFile = argv[++index] ?? "";
    else if (token === "--partial") options.partial = true;
    else if (token === "--history-limit") {
      options.historyLimit = Number(argv[++index] ?? 20);
    }
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/** Load allurerc.mjs (export default) or legacy allurerc.json. */
async function loadConfig(configFile) {
  if (!configFile || !fs.existsSync(configFile)) return null;
  if (configFile.endsWith(".mjs") || configFile.endsWith(".js")) {
    const mod = await import(pathToFileURL(path.resolve(configFile)).href);
    return mod.default ?? null;
  }
  return readJson(configFile);
}

function listResultFiles(resultsDir) {
  if (!resultsDir || !fs.existsSync(resultsDir)) return [];
  return fs
    .readdirSync(resultsDir)
    .filter((name) => name.endsWith("-result.json"))
    .map((name) => path.join(resultsDir, name));
}

function durationMs(result) {
  if (typeof result.duration === "number") return result.duration;
  if (typeof result.start === "number" && typeof result.stop === "number") {
    return Math.max(0, result.stop - result.start);
  }
  return 0;
}

function shortLabel(result, index) {
  const name = result.name || result.testCaseName || result.fullName || `T${index + 1}`;
  return name.length > 28 ? `${name.slice(0, 25)}…` : name;
}

/** Stable key across history.jsonl and current *-result.json (historyId format may differ). */
function stableTestKey(result) {
  const fullName = result.fullName || result.testCaseName || "";
  const name = result.name || "";
  if (fullName && name) return `${fullName}\0${name}`;
  if (result.historyId) return String(result.historyId);
  return result.uuid || name || "unknown";
}

function durationSecFromResult(result) {
  return Math.round((durationMs(result) / 1000) * 100) / 100;
}

function historyPointFromResult(result, runId, timestamp = null) {
  return {
    runId,
    status: (result.status || "unknown").toLowerCase(),
    durationSec: durationSecFromResult(result),
    timestamp,
  };
}

function countFlakyFlips(history) {
  let flips = 0;
  for (let index = 1; index < history.length; index += 1) {
    const prev = history[index - 1].status;
    const curr = history[index].status;
    const prevOutcome = prev === "passed" || prev === "failed" || prev === "broken";
    const currOutcome = curr === "passed" || curr === "failed" || curr === "broken";
    if (!prevOutcome || !currOutcome) continue;
    const prevPass = prev === "passed";
    const currPass = curr === "passed";
    if (prevPass !== currPass) flips += 1;
  }
  return flips;
}

function readHistoryTestTimelines(historyFile, limit) {
  const timelines = new Map();
  if (!historyFile || !fs.existsSync(historyFile)) return timelines;

  const lines = fs
    .readFileSync(historyFile, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const tail = lines.slice(-limit);

  tail.forEach((line) => {
    try {
      const entry = JSON.parse(line);
      const runId = entry.uuid;
      const timestamp = entry.timestamp ?? null;
      Object.values(entry.testResults ?? {}).forEach((result) => {
        const key = stableTestKey(result);
        const point = historyPointFromResult(result, runId, timestamp);
        if (!timelines.has(key)) timelines.set(key, []);
        timelines.get(key).push(point);
      });
    } catch {
      // skip malformed history line
    }
  });

  return timelines;
}

function mergeCurrentRun(timelines, results, runId) {
  results.forEach((result) => {
    const key = stableTestKey(result);
    const point = historyPointFromResult(result, runId, result.start ?? null);
    if (!timelines.has(key)) timelines.set(key, []);
    const history = timelines.get(key);
    const last = history[history.length - 1];
    if (last && last.runId === runId) {
      history[history.length - 1] = point;
      return;
    }
    if (last && last.status === point.status && last.durationSec === point.durationSec) return;
    history.push(point);
  });
}

function attachTestHistory(tests, results, timelines) {
  return tests.map((test, index) => {
    const result = results[index];
    const key = stableTestKey(result);
    const history = [...(timelines.get(key) ?? [])];
    return {
      ...test,
      historyId: result.historyId ?? null,
      history,
      flakyFlips: countFlakyFlips(history),
    };
  });
}

function labelValue(result, name) {
  return result.labels?.find((entry) => entry.name === name)?.value ?? null;
}

function pyramidLayersFromConfig(config) {
  if (!config) return PYRAMID_LAYERS;
  const charts = config.plugins?.awesome?.options?.charts ?? [];
  const chart = charts.find((entry) => entry.type === "testingPyramid");
  return chart?.layers ?? PYRAMID_LAYERS;
}

function buildTestingPyramid(results, layers) {
  const buckets = new Map(layers.map((layer) => [layer, { passed: 0, failed: 0, total: 0 }]));
  const seen = new Set();

  results.forEach((result) => {
    const dedupeKey = stableTestKey(result);
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const layer = labelValue(result, "layer");
    if (!layer || !buckets.has(layer)) return;

    const bucket = buckets.get(layer);
    bucket.total += 1;
    const status = (result.status || "").toLowerCase();
    if (status === "passed") bucket.passed += 1;
    else if (status === "failed" || status === "broken") bucket.failed += 1;
  });

  const grandTotal = layers.reduce((sum, layer) => sum + buckets.get(layer).total, 0) || 1;

  return layers.map((layer) => {
    const bucket = buckets.get(layer);
    const testCount = bucket.total;
    const successRate =
      testCount > 0 ? Math.round((bucket.passed / testCount) * 1000) / 10 : 0;
    const percentage = Math.round((testCount / grandTotal) * 1000) / 10;
    return { layer, testCount, successRate, percentage };
  });
}

function categoryRulesFromConfig(config) {
  return config?.categories?.rules ?? [];
}

function failureMessage(result) {
  const parts = [];
  if (result.statusDetails?.message) parts.push(result.statusDetails.message);
  if (result.message) parts.push(result.message);
  if (result.trace) {
    parts.push(String(result.trace).split("\n")[0]);
  }
  return parts.join("\n");
}

function matchesCategory(result, rule) {
  const status = (result.status || "").toLowerCase();
  const matchers = rule.matchers ?? {};
  const statuses = (matchers.statuses ?? []).map((value) => value.toLowerCase());
  if (statuses.length > 0 && !statuses.includes(status)) return false;
  if (matchers.message) {
    const text = failureMessage(result);
    try {
      const pattern = new RegExp(matchers.message, "i");
      if (!pattern.test(text)) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function resolveFailureCategory(result, rules) {
  const status = (result.status || "").toLowerCase();
  if (status !== "failed" && status !== "broken") return null;
  const rule = rules.find((entry) => matchesCategory(result, entry));
  return rule?.name ?? UNCATEGORIZED_FAILURE;
}

function buildEpicBreakdownSeries(results) {
  const counts = new Map();
  const seen = new Set();

  results.forEach((result) => {
    const dedupeKey = stableTestKey(result);
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const epic = labelValue(result, "epic");
    if (!epic) return;
    counts.set(epic, (counts.get(epic) ?? 0) + 1);
  });

  let colorIndex = 0;
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([name, y]) => ({
      name,
      y,
      color: TAXONOMY_COLORS[colorIndex++ % TAXONOMY_COLORS.length],
    }));
}

function buildFailureTaxonomySeries(results, rules) {
  const counts = new Map();
  results.forEach((result) => {
    const category = resolveFailureCategory(result, rules);
    if (!category) return;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  });

  let colorIndex = 0;
  return Array.from(counts.entries()).map(([name, y]) => ({
    name,
    y,
    color: TAXONOMY_COLORS[colorIndex++ % TAXONOMY_COLORS.length],
  }));
}

function summarizeResults(results, categoryRules = []) {
  const counts = { passed: 0, failed: 0, broken: 0, skipped: 0, unknown: 0 };
  const tests = [];

  results.forEach((result, index) => {
    const status = (result.status || "unknown").toLowerCase();
    if (status in counts) counts[status] += 1;
    else counts.unknown += 1;

    const ms = durationMs(result);
    tests.push({
      uuid: result.uuid,
      name: result.name || result.testCaseName,
      fullName: result.fullName,
      status,
      durationMs: ms,
      durationSec: Math.round((ms / 1000) * 100) / 100,
      label: shortLabel(result, index),
      failureCategory: resolveFailureCategory(result, categoryRules),
      layer: labelValue(result, "layer"),
      epic: labelValue(result, "epic"),
    });
  });

  const total = tests.length;
  const finished = counts.passed + counts.failed + counts.broken;
  const passRate = finished > 0 ? counts.passed / finished : 0;
  const totalDurationMs = tests.reduce((sum, test) => sum + test.durationMs, 0);
  const avgDurationSec =
    total > 0 ? Math.round((totalDurationMs / total / 1000) * 100) / 100 : 0;

  const statusColors = {
    passed: "#16a34a",
    failed: "#dc2626",
    broken: "#d97706",
    skipped: "#64748b",
    unknown: "#94a3b8",
  };

  const passRateSeries = ["passed", "failed", "broken", "skipped", "unknown"]
    .filter((status) => counts[status] > 0)
    .map((status) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      y: counts[status],
      status,
      color: statusColors[status],
    }));

  const durationSeries = {
    categories: tests.map((test) => test.label),
    valuesSec: tests.map((test) => test.durationSec),
  };

  const failureTaxonomySeries = buildFailureTaxonomySeries(results, categoryRules);

  return {
    total,
    ...counts,
    passRate: Math.round(passRate * 1000) / 1000,
    durationMs: totalDurationMs,
    avgDurationSec,
    passRateSeries,
    durationSeries,
    failureTaxonomySeries,
    tests,
  };
}

function readHistoryRuns(historyFile, limit) {
  if (!historyFile || !fs.existsSync(historyFile)) return [];
  const lines = fs
    .readFileSync(historyFile, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const tail = lines.slice(-limit);
  return tail
    .map((line) => {
      try {
        const entry = JSON.parse(line);
        const results = Object.values(entry.testResults ?? {});
        const counts = { passed: 0, failed: 0, broken: 0, skipped: 0 };
        results.forEach((result) => {
          const status = (result.status || "").toLowerCase();
          if (status in counts) counts[status] += 1;
        });
        return {
          uuid: entry.uuid,
          name: entry.name,
          timestamp: entry.timestamp,
          total: results.length,
          ...counts,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function readAgentSummary(agentOutputDir) {
  if (!agentOutputDir || !fs.existsSync(agentOutputDir)) return null;
  const manifestPath = path.join(agentOutputDir, "manifest", "run.json");
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const manifest = readJson(manifestPath);
    return {
      phase: manifest.phase,
      humanReport: manifest.humanReport ?? null,
    };
  } catch {
    return null;
  }
}

function readKnownHistoryIds(knownFile) {
  if (!knownFile || !fs.existsSync(knownFile)) return new Set();
  try {
    const entries = readJson(knownFile);
    if (!Array.isArray(entries)) return new Set();
    return new Set(entries.map((entry) => entry.historyId).filter(Boolean));
  } catch {
    return new Set();
  }
}

function isKnownFailure(result, knownIds) {
  const historyId = result.historyId;
  if (!historyId || knownIds.size === 0) return false;
  if (knownIds.has(historyId)) return true;
  for (const knownId of knownIds) {
    if (historyId.startsWith(`${knownId}.`) || knownId.startsWith(`${historyId}.`)) return true;
  }
  return false;
}

function countActionableFailures(results, knownIds) {
  const seen = new Set();
  let excluded = 0;
  let actionable = 0;

  results.forEach((result) => {
    const status = (result.status || "").toLowerCase();
    if (status !== "failed" && status !== "broken") return;

    const dedupeKey = result.historyId || stableTestKey(result);
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    if (isKnownFailure(result, knownIds)) {
      excluded += 1;
      return;
    }
    actionable += 1;
  });

  return { actionable, excluded };
}

function evaluateQualityGate(results, summary, config, configFile) {
  if (!config) {
    return { passed: true, evaluatedAt: new Date().toISOString(), rules: [] };
  }

  const configDir = configFile ? path.dirname(configFile) : process.cwd();
  const ruleDefs = config.qualityGate?.rules ?? [];
  if (!ruleDefs.length) {
    return { passed: true, evaluatedAt: new Date().toISOString(), rules: [] };
  }

  const knownFile = config.knownIssuesPath
    ? path.resolve(configDir, config.knownIssuesPath)
    : null;
  const knownIds = readKnownHistoryIds(knownFile);
  const { actionable: failedCount, excluded: knownExcluded } = countActionableFailures(
    results,
    knownIds
  );
  const finished = summary.passed + summary.failed + summary.broken;
  const successRatePct = finished > 0 ? (summary.passed / finished) * 100 : 0;
  const durationSec = Math.round(summary.durationMs / 1000);

  const rules = [];

  ruleDefs.forEach((rule) => {
    if (rule.maxFailures !== undefined) {
      const threshold = rule.maxFailures;
      const passed = failedCount <= threshold;
      rules.push({
        id: "maxFailures",
        passed,
        message: passed
          ? `Failed tests ${failedCount} within threshold ${threshold}`
          : `The number of failed tests ${failedCount} exceeds the allowed threshold value ${threshold}`,
        actual: failedCount,
        threshold,
        knownExcluded,
      });
    }
    if (rule.minTestsCount !== undefined) {
      const threshold = rule.minTestsCount;
      const passed = summary.total >= threshold;
      rules.push({
        id: "minTestsCount",
        passed,
        message: passed
          ? `Test count ${summary.total} meets minimum ${threshold}`
          : `The number of tests ${summary.total} is below the minimum required ${threshold}`,
        actual: summary.total,
        threshold,
      });
    }
    if (rule.successRate !== undefined) {
      const threshold = rule.successRate;
      const actual = Math.round(successRatePct * 10) / 10;
      const passed = actual >= threshold;
      rules.push({
        id: "successRate",
        passed,
        message: passed
          ? `Success rate ${actual}% meets minimum ${threshold}%`
          : `Success rate ${actual}% is below the minimum required ${threshold}%`,
        actual,
        threshold,
      });
    }
    if (rule.maxDuration !== undefined) {
      const threshold = rule.maxDuration;
      const passed = durationSec <= threshold;
      rules.push({
        id: "maxDuration",
        passed,
        message: passed
          ? `Run duration ${durationSec}s within limit ${threshold}s`
          : `Run duration ${durationSec}s exceeds the maximum allowed ${threshold}s`,
        actual: durationSec,
        threshold,
      });
    }
  });

  return {
    passed: rules.every((entry) => entry.passed),
    evaluatedAt: new Date().toISOString(),
    knownIssuesPath: knownFile,
    rules,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.resultsDir || !options.outputFile) {
    console.error(
      "Usage: build-analytics-index.mjs --results <dir> --output <file> [--history <file>] [--agent-output <dir>] [--config <allurerc.mjs>]"
    );
    process.exit(1);
  }

  const resultFiles = listResultFiles(options.resultsDir);
  const results = resultFiles.map((filePath) => readJson(filePath));
  const config = await loadConfig(options.configFile);
  const categoryRules = categoryRulesFromConfig(config);
  const summary = summarizeResults(results, categoryRules);
  const historyRuns = readHistoryRuns(options.historyFile, options.historyLimit);
  const testTimelines = readHistoryTestTimelines(options.historyFile, options.historyLimit);
  const currentRunId =
    results.reduce((max, result) => Math.max(max, result.start || 0), 0).toString() || "current";
  mergeCurrentRun(testTimelines, results, currentRunId);
  const tests = attachTestHistory(summary.tests, results, testTimelines);
  const agent = readAgentSummary(options.agentOutputDir);
  const qualityGate = evaluateQualityGate(results, summary, config, options.configFile);
  const testingPyramid = buildTestingPyramid(results, pyramidLayersFromConfig(config));
  const epicBreakdown = buildEpicBreakdownSeries(results);

  const payload = {
    schema: "analytics-index/v1",
    generatedAt: new Date().toISOString(),
    runState: options.partial ? "in_progress" : "complete",
    sources: {
      allureResults: options.resultsDir,
      history: options.historyFile || null,
      agentOutput: options.agentOutputDir || null,
      config: options.configFile || null,
    },
    summary: {
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      broken: summary.broken,
      skipped: summary.skipped,
      unknown: summary.unknown,
      passRate: summary.passRate,
      durationMs: summary.durationMs,
      avgDurationSec: summary.avgDurationSec,
    },
    charts: {
      passRate: summary.passRateSeries,
      duration: summary.durationSeries,
      failureTaxonomy: summary.failureTaxonomySeries,
      testingPyramid,
      epicBreakdown,
    },
    tests,
    historyRuns,
    qualityGate,
    agent,
  };

  fs.mkdirSync(path.dirname(options.outputFile), { recursive: true });
  fs.writeFileSync(options.outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`analytics-index: ${summary.total} tests → ${options.outputFile}`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
