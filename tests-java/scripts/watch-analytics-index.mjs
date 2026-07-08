#!/usr/bin/env node
/**
 * Rebuild analytics-index.json while ./gradlew test is running (-DanalyticsLive=true).
 * Spawns build-analytics-index.mjs with --partial on an interval until SIGINT/SIGTERM.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const builderScript = path.join(__dirname, "build-analytics-index.mjs");

function parseArgs(argv) {
  const options = {
    resultsDir: "",
    historyFile: "",
    agentOutputDir: "",
    configFile: "",
    outputFile: "",
    intervalMs: 1000,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--results") options.resultsDir = argv[++index] ?? "";
    else if (token === "--history") options.historyFile = argv[++index] ?? "";
    else if (token === "--agent-output") options.agentOutputDir = argv[++index] ?? "";
    else if (token === "--config") options.configFile = argv[++index] ?? "";
    else if (token === "--output") options.outputFile = argv[++index] ?? "";
    else if (token === "--interval") options.intervalMs = Number(argv[++index] ?? 1000);
  }
  return options;
}

function hasResultFiles(resultsDir) {
  if (!resultsDir || !fs.existsSync(resultsDir)) return false;
  return fs.readdirSync(resultsDir).some((name) => name.endsWith("-result.json"));
}

function runBuild(options) {
  if (!hasResultFiles(options.resultsDir)) return Promise.resolve();

  const args = [
    builderScript,
    "--results",
    options.resultsDir,
    "--output",
    options.outputFile,
    "--partial",
  ];
  if (options.historyFile) args.push("--history", options.historyFile);
  if (options.agentOutputDir) args.push("--agent-output", options.agentOutputDir);
  if (options.configFile) args.push("--config", options.configFile);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { stdio: "inherit" });
    child.on("error", (error) => {
      console.error(`watch-analytics-index: ${error.message}`);
      resolve();
    });
    child.on("exit", () => resolve());
  });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.resultsDir || !options.outputFile) {
    console.error(
      "Usage: watch-analytics-index.mjs --results <dir> --output <file> [--history <file>] [--agent-output <dir>] [--config <allurerc.mjs>] [--interval <ms>]"
    );
    process.exit(1);
  }

  const intervalMs = Number.isFinite(options.intervalMs) && options.intervalMs > 0 ? options.intervalMs : 1000;
  let running = false;
  let stopped = false;

  const tick = async () => {
    if (stopped || running) return;
    running = true;
    await runBuild(options);
    running = false;
  };

  console.log(`watch-analytics-index: polling every ${intervalMs}ms → ${options.outputFile}`);
  tick();
  const timer = setInterval(() => {
    tick();
  }, intervalMs);

  const shutdown = async () => {
    stopped = true;
    clearInterval(timer);
    while (running) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
