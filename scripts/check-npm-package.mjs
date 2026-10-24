#!/usr/bin/env node
// Checks the contents of the @flisk-sh/flisk npm package.
//
// Usage: npm pack --dry-run --json | node scripts/check-npm-package.mjs --manifest package.json
// stdin is `npm pack --json` output (or `[{ "files": [{ "path": ... }] }]` built from a tarball listing).
//
// Fails when the package:
// - ships test files (1.4.0 shipped ten),
// - ships a path outside the allowlist below,
// - does not declare "type": "module" (registry sites then report the ESM CLI as CommonJS).
import { readFileSync } from "node:fs";

const TEST_PATH =
  /(^|\/)(__tests__|tests)\/|\.test\.[cm]?[jt]sx?$|\.spec\.[cm]?[jt]sx?$|(^|\/)test_[^/]*\.py$|_test\.py$/;

// Every shipped path starts with one of these. examples/tdk-example backs `flisk project example`;
// runtime/ holds the Tiltfile, engine, discovery, specs and ext that `flisk up` loads.
export const ALLOWED_PATHS = [
  "cli/bin/",
  "cli/dist/",
  "cli/dist-bundle/",
  "cli/templates/",
  "cli/shared-platform-engineering/docker-templates/",
  "cli/package.json",
  "runtime/",
  "examples/tdk-example/",
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "package.json",
];

export function findTestFiles(paths) {
  return paths.filter((path) => TEST_PATH.test(path));
}

export function findUnexpectedPaths(paths) {
  return paths.filter((path) => !ALLOWED_PATHS.some((allowed) => path === allowed || path.startsWith(allowed)));
}

export function checkManifest(manifest) {
  const problems = [];
  if (manifest.type !== "module") {
    problems.push(`package.json "type" is ${JSON.stringify(manifest.type)}; expected "module" (the CLI is ESM)`);
  }
  return problems;
}

export function parsePackOutput(text) {
  const [entry] = JSON.parse(text);
  if (!entry || !Array.isArray(entry.files)) {
    throw new Error("npm pack --json output has no files list");
  }
  return entry.files.map((file) => file.path);
}

export function checkPackage(paths, manifest) {
  const problems = [];
  const testFiles = findTestFiles(paths);
  if (testFiles.length > 0) {
    problems.push(`${testFiles.length} test file(s) ship in the package:`, ...testFiles.map((p) => `  ${p}`));
  }
  const unexpected = findUnexpectedPaths(paths);
  if (unexpected.length > 0) {
    problems.push(`${unexpected.length} path(s) outside the allowlist:`, ...unexpected.map((p) => `  ${p}`));
  }
  problems.push(...checkManifest(manifest));
  return problems;
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const manifestIndex = process.argv.indexOf("--manifest");
  if (manifestIndex === -1 || !process.argv[manifestIndex + 1]) {
    console.error("usage: npm pack --dry-run --json | check-npm-package.mjs --manifest <package.json>");
    process.exit(2);
  }
  const manifest = JSON.parse(readFileSync(process.argv[manifestIndex + 1], "utf8"));
  const problems = checkPackage(parsePackOutput(readFileSync(0, "utf8")), manifest);
  if (problems.length > 0) {
    console.error(`check-npm-package: ${manifest.name}@${manifest.version} has problems:`);
    for (const line of problems) console.error(line);
    console.error("Fix the root package.json (\"files\", \"type\") or ALLOWED_PATHS in this script.");
    process.exit(1);
  }
  console.log(`check-npm-package: ${manifest.name}@${manifest.version} passes`);
}
