import assert from "node:assert/strict";
import { test } from "node:test";
import { findTestFiles, parsePackOutput } from "./check-npm-pack-tests.mjs";

test("flags test files in every shape the package used to ship", () => {
  const paths = [
    "cli/dist/commands/__tests__/project-e2e-helpers.js",
    "cli/dist/commands/ui-loading-screen.test.js",
    "runtime/engine/assets/docker/wake-gateway/decide.test.ts",
    "runtime/engine/topologies/tilt/manifest/tests/test_manifest.star",
    "runtime/discovery/test_resource_snapshot.py",
    "runtime/ext/ide-components/shared/test_config_service.py",
  ];
  assert.deepEqual(findTestFiles(paths.map((path) => ({ path }))), paths);
});

test("keeps shipped runtime and CLI files", () => {
  const paths = [
    "cli/dist/utils/command-helpers.js",
    "cli/dist/utils/file-helpers.js",
    "runtime/engine/assets/docker/wake-gateway/decide.ts",
    "runtime/testing-docs/readme.md",
    "runtime/engine/topologies/tilt/manifest/loader.star",
    "runtime/discovery/resource_snapshot.py",
  ];
  assert.deepEqual(findTestFiles(paths.map((path) => ({ path }))), []);
});

test("reads the files list from npm pack --json output", () => {
  const text = JSON.stringify([{ files: [{ path: "a.js" }] }]);
  assert.deepEqual(parsePackOutput(text), [{ path: "a.js" }]);
  assert.throws(() => parsePackOutput("[{}]"), /no files list/);
});
