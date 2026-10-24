// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hasExtensionLayout, resolveExtensionDir, resolveTiltfile } from "../runtime-layout.js";

describe("runtime-layout", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "flisk-layout-"));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("uses the flat layout when there is no runtime folder", () => {
    mkdirSync(join(root, "engine"));
    writeFileSync(join(root, "Tiltfile"), "");
    expect(resolveExtensionDir(root, "engine")).toBe(join(root, "engine"));
    expect(hasExtensionLayout(root)).toBe(true);
  });

  it("prefers the nested runtime layout when present", () => {
    mkdirSync(join(root, "runtime", "engine"), { recursive: true });
    mkdirSync(join(root, "engine"));
    writeFileSync(join(root, "Tiltfile"), "");
    expect(resolveExtensionDir(root, "engine")).toBe(join(root, "runtime", "engine"));
    expect(hasExtensionLayout(root)).toBe(true);
  });

  it("reports no layout without a Tiltfile or engine", () => {
    expect(hasExtensionLayout(root)).toBe(false);
    mkdirSync(join(root, "engine"));
    expect(hasExtensionLayout(root)).toBe(false);
  });

  it("resolves the nested runtime Tiltfile when present", () => {
    mkdirSync(join(root, "runtime"));
    writeFileSync(join(root, "runtime", "Tiltfile"), "");
    writeFileSync(join(root, "Tiltfile"), "");
    expect(resolveTiltfile(root)).toBe(join(root, "runtime", "Tiltfile"));
  });

  it("falls back to the flat Tiltfile for packaged and vendored layouts", () => {
    writeFileSync(join(root, "Tiltfile"), "");
    expect(resolveTiltfile(root)).toBe(join(root, "Tiltfile"));
  });

  it("returns the flat path when no Tiltfile exists, so callers report it missing", () => {
    expect(resolveTiltfile(root)).toBe(join(root, "Tiltfile"));
  });

  it("detects the extension layout from a runtime Tiltfile with flat engine", () => {
    mkdirSync(join(root, "runtime"));
    writeFileSync(join(root, "runtime", "Tiltfile"), "");
    mkdirSync(join(root, "engine"));
    expect(hasExtensionLayout(root)).toBe(true);
  });
});
