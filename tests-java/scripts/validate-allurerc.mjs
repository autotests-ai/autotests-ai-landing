#!/usr/bin/env node
/**
 * Validate Allure ethalon / consumer allurerc.mjs:
 * - import succeeds
 * - testingPyramid at index 1 after currentStatus (awesome + dashboard)
 * - layers === PYRAMID_LAYERS (no visual)
 *
 * Usage:
 *   node scripts/validate-allurerc.mjs [path/to/allurerc.mjs]
 * Default: ./allurerc.mjs (cwd) or ethalon _ethalon/allurerc.mjs when run from generators/ethalon/tests-java.
 */
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FALLBACK_LAYERS = [
  "unit",
  "component",
  "integration",
  "api",
  "e2e",
  "manual",
];

function fail(message) {
  console.error(`validate-allurerc: FAIL — ${message}`);
  process.exit(1);
}

async function loadPyramidLayers(configDir) {
  const candidates = [
    path.join(configDir, "allure", "constants.mjs"),
    path.resolve(__dirname, "../_ethalon/allure/constants.mjs"),
    path.resolve(__dirname, "../allure/constants.mjs"),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    try {
      const mod = await import(pathToFileURL(file).href);
      if (Array.isArray(mod.PYRAMID_LAYERS) && mod.PYRAMID_LAYERS.length) {
        return mod.PYRAMID_LAYERS;
      }
    } catch {
      /* try next */
    }
  }
  return FALLBACK_LAYERS;
}

function assertPyramid(charts, label, layers) {
  if (!Array.isArray(charts) || charts.length < 2) {
    fail(`${label}: expected array with at least 2 tiles`);
  }
  if (charts[0]?.type !== "currentStatus") {
    fail(`${label}[0]: expected type currentStatus, got ${charts[0]?.type}`);
  }
  if (charts[1]?.type !== "testingPyramid") {
    fail(`${label}[1]: expected type testingPyramid, got ${charts[1]?.type}`);
  }
  const actual = charts[1].layers ?? [];
  if (JSON.stringify(actual) !== JSON.stringify(layers)) {
    fail(
      `${label}[1].layers: expected ${JSON.stringify(layers)}, got ${JSON.stringify(actual)}`,
    );
  }
  if (actual.includes("visual")) {
    fail(`${label}[1].layers: must not include visual`);
  }
}

async function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    fail(`file not found: ${configPath}`);
  }
  const mod = await import(pathToFileURL(path.resolve(configPath)).href);
  if (!mod.default || typeof mod.default !== "object") {
    fail(`${configPath}: export default object required`);
  }
  return mod.default;
}

async function main() {
  const arg = process.argv[2];
  const packageRoot = path.resolve(__dirname, "..");
  const configPath = arg
    ? path.resolve(process.cwd(), arg)
    : fs.existsSync(path.join(process.cwd(), "allurerc.mjs"))
      ? path.join(process.cwd(), "allurerc.mjs")
      : path.join(packageRoot, "_ethalon", "allurerc.mjs");

  const config = await loadConfig(configPath);
  const layers = await loadPyramidLayers(path.dirname(configPath));
  const charts = config.plugins?.awesome?.options?.charts;
  const layout = config.plugins?.dashboard?.options?.layout;

  assertPyramid(charts, "plugins.awesome.options.charts", layers);
  assertPyramid(layout, "plugins.dashboard.options.layout", layers);

  if (!config.name || typeof config.name !== "string") {
    fail("name: required string");
  }
  if (!config.qualityGate?.rules?.length) {
    fail("qualityGate.rules: required non-empty");
  }

  const catGroupBy = config.categories?.rules?.flatMap((r) => r.groupBy ?? []) ?? [];
  const allowed = new Set([
    "flaky",
    "owner",
    "severity",
    "transition",
    "status",
    "environment",
    "layer",
  ]);
  for (const selector of catGroupBy) {
    if (typeof selector === "string" && !allowed.has(selector)) {
      fail(
        `categories.groupBy invalid selector "${selector}" (Allure 3.13 builtins: ${[...allowed].join(", ")})`,
      );
    }
  }

  console.log(`validate-allurerc: OK — ${configPath}`);
  console.log(`  name=${config.name}`);
  console.log(`  awesome.charts=${charts.length}, dashboard.layout=${layout.length}`);
  console.log(`  pyramid@1 layers=[${layers.join(", ")}]`);
}

main().catch((err) => {
  fail(err?.stack || String(err));
});
