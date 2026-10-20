// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
import { describe, expect, it, vi } from "vitest";
import { runCompletionCommand } from "../../test-support/index.js";
import { getRegisteredCommands } from "../registry.js";

const SHELLS = ["bash", "zsh", "fish", "powershell"] as const;

async function renderCompletion(shell: string): Promise<string> {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  try {
    await runCompletionCommand(["--shell", shell]);
    return log.mock.calls.map(([value]) => String(value)).join("\n");
  } finally {
    log.mockRestore();
  }
}

describe("top-level shell completions", () => {
  it.each(SHELLS)("offers every registered command in the %s script", async (shell) => {
    const script = await renderCompletion(shell);

    for (const command of getRegisteredCommands()) {
      expect(script, `${shell} is missing the command ${command.name()}`).toContain(command.name());
      for (const alias of command.aliases()) {
        expect(script, `${shell} is missing the alias ${alias}`).toContain(alias);
      }
    }
  });

  it("uses the command descriptions for config and networks", async () => {
    // Bash lists the command names only; the other shells show a description next to them.
    for (const shell of ["zsh", "fish", "powershell"]) {
      const script = await renderCompletion(shell);
      expect(script, shell).toContain("Manage project configuration and regenerate master files");
      expect(script, shell).toContain("Show Traefik-routed URLs for all services");
    }
  });
});
