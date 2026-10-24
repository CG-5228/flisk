#!/usr/bin/env node
// Fails when the root @flisk-sh/flisk package would ship test files.
// Reads `npm pack --dry-run --json` output from stdin or a file argument.
// Every test-looking path must be excluded in the root package.json "files" list.
import { readFileSync } from "node:fs";

const TEST_PATH =
  /(^|\/)(__tests__|tests)\/|\.test\.[cm]?[jt]sx?$|\.spec\.[cm]?[jt]sx?$|(^|\/)test_[^/]*\.py$|_test\.py$/;

export function findTestFiles(packEntries) {
  return packEntries.map((entry) => entry.path).filter((path) => TEST_PATH.test(path));
}

export function parsePackOutput(text) {
  const [entry] = JSON.parse(text);
  if (!entry || !Array.isArray(entry.files)) {
    throw new Error("npm pack --json output has no files list");
  }
  return entry.files;
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const source = process.argv[2] ? readFileSync(process.argv[2], "utf8") : readFileSync(0, "utf8");
  const testFiles = findTestFiles(parsePackOutput(source));
  if (testFiles.length > 0) {
    console.error(`check-npm-pack-tests: ${testFiles.length} test file(s) would ship in the npm package:`);
    for (const file of testFiles) console.error(`  ${file}`);
    console.error("Exclude them in the root package.json \"files\" list.");
    process.exit(1);
  }
  console.log("check-npm-pack-tests: no test files in the npm package");
}
