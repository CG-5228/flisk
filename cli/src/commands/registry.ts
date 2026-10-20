// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
/**
 * The commands the CLI registers.
 *
 * `cli/src/program.ts` adds every command in this list to the root program, and the shell
 * completion generator reads the same list, so a new command cannot ship without a completion
 * candidate.
 *
 * The list is built inside a function on purpose: `commands/completion.ts` imports this module to
 * read the registered commands, and this module imports the completion command from there. The
 * cycle is safe because neither module touches the other's bindings while it is being evaluated.
 */
import type { Command } from "commander";
import { agentCommand } from "./agent.js";
import { completionCommand } from "./completion.js";
import { configCommand } from "./config.js";
import { doctorCommand } from "./doctor.js";
import { downCommand } from "./down.js";
import { ejectCommand } from "./eject.js";
import { importCommand } from "./import.js";
import { logsCommand } from "./logs.js";
import { maintainersCommand } from "./maintainers.js";
import { mcpCommand } from "./mcp.js";
import { networksCommand } from "./networks.js";
import { projectCommand } from "./project.js";
import { projectsCommand } from "./projects.js";
import { resourceCommand } from "./resource.js";
import { resourcesCommand } from "./resources.js";
import { restartCommand } from "./restart.js";
import { runtimeCommand } from "./runtime.js";
import { stackCommand } from "./stack.js";
import { stacksCommand } from "./stacks.js";
import { statusCommand } from "./status.js";
import { uiCommand } from "./ui.js";
import { upCommand } from "./up.js";
import { upgradeCommand } from "./upgrade.js";
import { versionCommand } from "./version.js";

/** Every command the CLI registers, in the order `tdk --help` lists them. */
export function getRegisteredCommands(): readonly Command[] {
  return [
    stacksCommand,
    resourcesCommand,
    projectsCommand,
    upCommand,
    downCommand,
    mcpCommand,
    logsCommand,
    ejectCommand,
    importCommand,
    statusCommand,
    stackCommand,
    resourceCommand,
    runtimeCommand,
    projectCommand,
    configCommand,
    uiCommand,
    versionCommand,
    maintainersCommand,
    doctorCommand,
    completionCommand,
    upgradeCommand,
    networksCommand,
    agentCommand,
    restartCommand,
  ];
}
