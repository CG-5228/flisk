// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BACKEND_FRAMEWORKS } from "../../backend-frameworks/registry.js";
import { FRONTEND_FRAMEWORKS } from "../../frontend-frameworks/registry.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const cliBin = join(repoRoot, "cli", "bin", "tdk.js");

/**
 * The inventory is a CLI contract, so the test runs the real binary. A spawned process also keeps
 * commander's option state per run: an in-process parse keeps the previous run's `--type` source.
 */
function tdk(args: string[]) {
  return spawnSync(process.execPath, [cliBin, ...args], {
    encoding: "utf-8",
    env: { ...process.env, TDK_EXTENSION_SOURCE: repoRoot },
  });
}

/** The listing is tab separated, one framework per row. */
function rows(output: string): string[][] {
  return output
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split("\t"));
}

describe("tdk resource --frameworks", () => {
  it("lists the frontend frameworks when no --type is given", () => {
    const result = tdk(["resource", "--frameworks"]);

    expect(result.status, result.stderr).toBe(0);
    const listed = rows(result.stdout);
    expect(listed.map((row) => row[0])).toEqual(Object.keys(FRONTEND_FRAMEWORKS));
    // The historical columns stay: id, label, kind, verification, command.
    for (const row of listed) {
      expect(row).toHaveLength(5);
      expect(row[2]).toBe("vite-spa");
      expect(row[3]).toBe("verified");
      expect(row[4]).toBe(`tdk resource <name> --type frontend --framework ${row[0]}`);
    }
  });

  it("lists the same frontend frameworks for --type frontend", () => {
    const result = tdk(["resource", "--type", "frontend", "--frameworks"]);

    expect(result.status, result.stderr).toBe(0);
    expect(rows(result.stdout)).toEqual(rows(tdk(["resource", "--frameworks"]).stdout));
  });

  it("lists every registered backend framework with its language and command", () => {
    const result = tdk(["resource", "--type", "backend", "--frameworks"]);

    expect(result.status, result.stderr).toBe(0);
    const listed = rows(result.stdout);
    expect(listed.map((row) => row[0])).toEqual(Object.keys(BACKEND_FRAMEWORKS));
    for (const row of listed) {
      const provider = BACKEND_FRAMEWORKS[row[0]];
      expect(row).toHaveLength(5);
      // The display name, the language (and runtime) it is scaffolded with, and its compatibility.
      expect(row[1]).toBe(provider.label);
      expect(row[2]).toBe("bun");
      expect(row[3]).toBe("compatible");
      expect(row[4]).toBe(`tdk resource <name> --type backend --framework ${row[0]}`);
    }
  });

  it("marks a framework that cannot be combined with the requested language", () => {
    const result = tdk(["resource", "--type", "backend", "--language", "python", "--frameworks"]);

    expect(result.status, result.stderr).toBe(0);
    const listed = rows(result.stdout);
    expect(listed.map((row) => row[0])).toEqual(Object.keys(BACKEND_FRAMEWORKS));
    for (const row of listed) {
      // Python owns its runtime, so no framework can be combined with it.
      expect(row[2]).toBe("bun");
      expect(row[3]).toBe("incompatible with --language python");
    }
  });

  it("keeps a language that can be combined with a framework compatible", () => {
    const result = tdk(["resource", "--type", "backend", "--language", "bun", "--frameworks"]);

    expect(result.status, result.stderr).toBe(0);
    for (const row of rows(result.stdout)) {
      expect(row[3]).toBe("compatible");
    }
  });

  it("fails for a resource type that has no frameworks", () => {
    const result = tdk(["resource", "--type", "worker", "--frameworks"]);

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(
      /No frameworks are registered for --type worker/,
    );
  });

  it("fails for an unknown type or language", () => {
    const unknownType = tdk(["resource", "--type", "not-a-type", "--frameworks"]);
    expect(unknownType.status).not.toBe(0);
    expect(`${unknownType.stdout}${unknownType.stderr}`).toMatch(/Unknown resource type/);

    const unknownLanguage = tdk([
      "resource",
      "--type",
      "backend",
      "--language",
      "cobol",
      "--frameworks",
    ]);
    expect(unknownLanguage.status).not.toBe(0);
    expect(`${unknownLanguage.stdout}${unknownLanguage.stderr}`).toMatch(
      /Unknown backend language "cobol"/,
    );
  });

  it("rejects a language on a type that does not own one", () => {
    const result = tdk(["resource", "--type", "frontend", "--language", "python", "--frameworks"]);

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(
      /--language can only be used with --type backend/,
    );
  });

  it("documents the backend listing in the help text", () => {
    const result = tdk(["resource", "--help"]);

    expect(result.status, result.stderr).toBe(0);
    const help = result.stdout.replace(/\s+/g, " ");
    expect(help).toContain(
      "List registered frameworks for the resource type and exit (--type frontend, --type backend)",
    );
  });
});
