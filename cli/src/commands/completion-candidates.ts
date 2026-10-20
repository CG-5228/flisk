// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
/**
 * The data the shell completion scripts suggest.
 *
 * Every list is derived from the CLI itself: the commands and their flags come from the registered
 * Commander commands, and the value lists come from the framework, language and resource-type
 * registries. Nothing here repeats a list that already lives in the CLI, so a new command or a new
 * registry entry shows up in the completions without touching this file.
 */
import type { Command, Option } from "commander";
import { BACKEND_FRAMEWORKS } from "../backend-frameworks/registry.js";
import { BACKEND_LANGUAGES } from "../backend-languages/registry.js";
import { FRONTEND_FRAMEWORKS } from "../frontend-frameworks/registry.js";
import { RESOURCE_TYPE_VALUES } from "../types/index.js";

/** What a command's positional argument completes. */
export type CompletionPositional =
  /** The stacks of the current project. */
  | "stacks"
  /** The resources of the current project. */
  | "resources"
  /** The stacks and the resources of the current project. */
  | "stacks-and-resources"
  /** The names of the other commands (`tdk help <command>`). */
  | "commands";

/** A flag a command accepts. */
export interface CompletionOption {
  /** The long flag, for example `--json`. */
  flag: string;
  /** One-line summary shown next to the candidate. */
  description: string;
  /** True when the flag is followed by a value (`--type <type>`). */
  takesValue: boolean;
}

/** A command the shells suggest. */
export interface CompletionCommand {
  /** The name the user types (`tdk doctor`). */
  name: string;
  /** Alternative names the CLI accepts for the same command. */
  aliases: string[];
  /** One-line summary shown next to the candidate. */
  description: string;
  /** The flags the command accepts. */
  options: CompletionOption[];
  /** The command's own sub-commands (`tdk config verify`). */
  subcommands: CompletionCommand[];
  /** What the command's positional argument completes, when it takes a project value. */
  positional?: CompletionPositional;
}

/** Everything the four completion scripts suggest. */
export interface CompletionCandidates {
  /** The commands, in the order the CLI registers them. */
  commands: CompletionCommand[];
  /** The flags every command accepts. */
  globalOptions: CompletionOption[];
  /** The fixed value lists, keyed by flag name (`--type` holds the resource types). */
  values: Record<string, string[]>;
}

/**
 * The positional argument of a command, keyed by the command path (`"agent sessions"`). Only the
 * commands whose argument names something in the current project are listed.
 */
const POSITIONALS: Record<string, CompletionPositional> = {
  help: "commands",
  up: "stacks-and-resources",
  stack: "stacks",
  restart: "resources",
  logs: "resources",
  "agent sessions": "resources",
};

/** Commander's built-in help command. It is not one of the registered commands, so it is added here. */
const HELP_COMMAND: CompletionCommand = {
  name: "help",
  aliases: [],
  description: "Show help",
  options: [],
  subcommands: [],
  positional: "commands",
};

/** Commander's built-in help flag. Every command accepts it. */
const HELP_OPTION: CompletionOption = {
  flag: "--help",
  description: "Show help",
  takesValue: false,
};

function toOptions(options: readonly Option[]): CompletionOption[] {
  return options
    .filter((option) => typeof option.long === "string")
    .map((option) => ({
      flag: option.long as string,
      description: option.description,
      takesValue: option.required || option.optional,
    }));
}

function toCompletionCommand(command: Command, path: string): CompletionCommand {
  return {
    name: command.name(),
    aliases: command.aliases(),
    description: command.description(),
    options: toOptions(command.options),
    subcommands: command.commands.map((subcommand) =>
      toCompletionCommand(subcommand, `${path} ${subcommand.name()}`),
    ),
    ...(POSITIONALS[path] ? { positional: POSITIONALS[path] } : {}),
  };
}

/**
 * Reads the completion candidates from the CLI: the registered commands with their flags, the
 * global flags of the root program, and the value lists of the framework, language and
 * resource-type registries.
 */
export function buildCompletionCandidates(program: Command): CompletionCandidates {
  return {
    commands: [
      HELP_COMMAND,
      ...program.commands.map((command) => toCompletionCommand(command, command.name())),
    ],
    globalOptions: [...toOptions(program.options), HELP_OPTION],
    values: {
      "--type": [...RESOURCE_TYPE_VALUES],
      "--framework": [...Object.keys(FRONTEND_FRAMEWORKS), ...Object.keys(BACKEND_FRAMEWORKS)],
      "--language": Object.keys(BACKEND_LANGUAGES),
    },
  };
}
