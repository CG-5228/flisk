import assert from "node:assert/strict";
import { test } from "node:test";
import { checkManifest, checkPackage, findTestFiles, findUnexpectedPaths, parsePackOutput } from "./check-npm-package.mjs";

const ESM = { name: "@flisk-sh/flisk", version: "0.0.0", type: "module" };

test("flags test files in every shape the package used to ship", () => {
  const paths = [
    "cli/dist/commands/__tests__/project-e2e-helpers.js",
    "cli/dist/commands/ui-loading-screen.test.js",
    "runtime/engine/assets/docker/wake-gateway/decide.test.ts",
    "runtime/engine/topologies/tilt/manifest/tests/test_manifest.star",
    "runtime/discovery/test_resource_snapshot.py",
    "runtime/ext/ide-components/shared/test_config_service.py",
  ];
  assert.deepEqual(findTestFiles(paths), paths);
});

test("keeps shipped runtime and CLI files", () => {
  const paths = [
    "cli/dist/utils/command-helpers.js",
    "runtime/engine/assets/docker/wake-gateway/decide.ts",
    "runtime/engine/topologies/tilt/manifest/loader.star",
    "runtime/specs/specs/TILT_TECH_STACK.star",
    "examples/tdk-example/Tiltfile",
  ];
  assert.deepEqual(findTestFiles(paths), []);
  assert.deepEqual(findUnexpectedPaths(paths), []);
});

test("flags paths outside the allowlist", () => {
  const paths = ["examples/one-backend/service.json", "shared-platform-engineering/x.sh", "docs/README.md", "README.md"];
  assert.deepEqual(findUnexpectedPaths(paths), paths.slice(0, 3));
});

test("requires an ESM package type", () => {
  assert.deepEqual(checkManifest(ESM), []);
  assert.match(checkManifest({ ...ESM, type: undefined }).join(), /expected "module"/);
  assert.match(checkManifest({ ...ESM, type: "commonjs" }).join(), /expected "module"/);
});

test("reports every problem at once", () => {
  const problems = checkPackage(["cli/dist/a.test.js", "docs/x.md"], { ...ESM, type: undefined });
  assert.equal(problems.filter((line) => !line.startsWith("  ")).length, 3);
});

test("reads the files list from npm pack --json output", () => {
  assert.deepEqual(parsePackOutput(JSON.stringify([{ files: [{ path: "a.js" }] }])), ["a.js"]);
  assert.throws(() => parsePackOutput("[{}]"), /no files list/);
});
