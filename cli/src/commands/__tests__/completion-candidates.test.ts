// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
import { describe, expect, it } from "vitest";
import { BACKEND_FRAMEWORKS } from "../../backend-frameworks/registry.js";
import { BACKEND_LANGUAGES } from "../../backend-languages/registry.js";
import { FRONTEND_FRAMEWORKS } from "../../frontend-frameworks/registry.js";
import { createProgram } from "../../program.js";
import { RESOURCE_TYPE_VALUES } from "../../types/index.js";
import { renderCompletionScript } from "../completion.js";
import { buildCompletionCandidates } from "../completion-candidates.js";

const SHELLS = ["bash", "zsh", "fish", "powershell"] as const;
type Shell = (typeof SHELLS)[number];

const program = createProgram();
const candidates = buildCompletionCandidates(program);

/** What a shell script offers: the command names and the flags per command. */
interface ShellShape {
  names: string[];
  options: Record<string, string[]>;
}

function sorted(values: string[]): string[] {
  return [...values].sort();
}

/** The flags of every command, in a stable order. */
function normalize(options: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(options)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([command, flags]) => [command, sorted(flags)]),
  );
}

function flagsOf(specs: string): string[] {
  return [...specs.matchAll(/'--([a-z0-9-]+)\[/g)].map(([, flag]) => `--${flag}`);
}

function bashShape(source: string): ShellShape {
  const names = (source.match(/commands="([^"]*)"/)?.[1] ?? "").split(/\s+/).filter(Boolean);
  const options: Record<string, string[]> = {};
  for (const match of source.matchAll(/^\s*"?([\w -]+)"?\) options="([^"]*)" ;;$/gm)) {
    options[match[1]] = match[2].split(/\s+/).filter(Boolean);
  }
  return { names, options };
}

function zshShape(source: string): ShellShape {
  const commandBlock = source.match(
    /_tdk_commands\(\) \{\n {4}local commands=\(\n([\s\S]*?)\n {4}\)/,
  );
  const names = [...(commandBlock?.[1] ?? "").matchAll(/^\s*'([^:']+):/gm)].map(([, name]) => name);
  const options: Record<string, string[]> = {};
  for (const match of source.matchAll(/^ {8}(\S+)\)\n {12}_arguments \\\n([\s\S]*?)\n {12};;$/gm)) {
    const flags = flagsOf(match[2]);
    if (flags.length > 0) options[match[1]] = flags;
  }
  for (const match of source.matchAll(
    /^ {8}(\S+)_args\)\n {12}case "\$line\[1\]" in\n([\s\S]*?)\n {12}esac\n {12};;$/gm,
  )) {
    for (const sub of match[2].matchAll(
      /^ {16}(\S+)\)\n {20}_arguments \\\n([\s\S]*?)\n {20};;$/gm,
    )) {
      const flags = flagsOf(sub[2]);
      if (flags.length > 0) options[`${match[1]} ${sub[1]}`] = flags;
    }
  }
  return { names, options };
}

function fishShape(source: string): ShellShape {
  const names = [
    ...source.matchAll(/complete -c tdk -f -n '__fish_use_subcommand' -a '([^']+)'/g),
  ].map(([, name]) => name);
  const options: Record<string, string[]> = {};
  for (const match of source.matchAll(/complete -c tdk -f -n '([^']+)' -l ([a-z0-9-]+)/g)) {
    const path = [...match[1].matchAll(/__fish_seen_subcommand_from ([a-z0-9-]+)/g)].map(
      ([, name]) => name,
    );
    const key = path.join(" ");
    options[key] = [...(options[key] ?? []), `--${match[2]}`];
  }
  return { names, options };
}

function powershellShape(source: string): ShellShape {
  const commandBlock = source.match(/\$commands = \[ordered\]@\{\n([\s\S]*?)\n {2}\}/);
  const names = [...(commandBlock?.[1] ?? "").matchAll(/^\s*'([^']+)' = '[^']*'/gm)].map(
    ([, name]) => name,
  );
  const optionBlock = source.match(/\$commandOptions = \[ordered\]@\{\n([\s\S]*?)\n {2}\}/);
  const options: Record<string, string[]> = {};
  for (const match of (optionBlock?.[1] ?? "").matchAll(/^\s*'([^']+)' = @\(([^)]*)\)/gm)) {
    const flags = [...match[2].matchAll(/'(--[^']+)'/g)].map(([, flag]) => flag);
    if (flags.length > 0) options[match[1]] = flags;
  }
  return { names, options };
}

const SHAPE_BUILDERS: Record<Shell, (source: string) => ShellShape> = {
  bash: bashShape,
  zsh: zshShape,
  fish: fishShape,
  powershell: powershellShape,
};

function shapeOf(shell: Shell): ShellShape {
  return SHAPE_BUILDERS[shell](renderCompletionScript(shell, candidates));
}

/** The flags a shell offers for every command. */
function globalFlagsOf(shell: Shell): string[] {
  const source = renderCompletionScript(shell, candidates);
  switch (shell) {
    case "bash": {
      const match = source.match(/options="(--[^"]*)"/);
      return (match?.[1] ?? "").split(/\s+/).filter(Boolean);
    }
    case "zsh": {
      const block = source.match(/_arguments -C \\\n([\s\S]*?)\n {8}'1: :_tdk_commands'/);
      return flagsOf(block?.[1] ?? "");
    }
    case "fish": {
      return [...source.matchAll(/complete -c tdk -f -l ([a-z0-9-]+)/g)].map(
        ([, flag]) => `--${flag}`,
      );
    }
    case "powershell": {
      const match = source.match(/\$globalOptions = @\(([^)]*)\)/);
      return [...(match?.[1] ?? "").matchAll(/'(--[^']+)'/g)].map(([, flag]) => flag);
    }
  }
}

/** The values a shell offers for a flag, read back from the rendered script. */
function valuesOf(shell: Shell, flag: string): string[] {
  const source = renderCompletionScript(shell, candidates);
  const name = flag.replace(/^--/, "");
  switch (shell) {
    case "bash": {
      const match = source.match(
        new RegExp(`${flag}\\)\\n {12}COMPREPLY=\\( \\$\\(compgen -W "([^"]+)"`),
      );
      return (match?.[1] ?? "").split(/\s+/).filter(Boolean);
    }
    case "zsh": {
      const match = source.match(new RegExp(`'${flag}\\[[^\\]]*\\]:[a-z]+:\\(([^)]*)\\)'`));
      return (match?.[1] ?? "").split(/\s+/).filter(Boolean);
    }
    case "fish": {
      const match = source.match(new RegExp(`-l ${name}[^\\n]*?-a '([^']*)'`));
      return (match?.[1] ?? "").split(/\s+/).filter(Boolean);
    }
    case "powershell": {
      const match = source.match(new RegExp(`'${flag}' = @\\(([^)]*)\\)`));
      return [...(match?.[1] ?? "").matchAll(/'([^']+)'/g)].map(([, value]) => value);
    }
  }
}

describe("shell completion candidates", () => {
  it("offers every registered command in all four shells", () => {
    for (const shell of SHELLS) {
      const { names } = shapeOf(shell);
      for (const command of program.commands) {
        expect(names, `${shell} is missing the command ${command.name()}`).toContain(
          command.name(),
        );
        for (const alias of command.aliases()) {
          expect(names, `${shell} is missing the alias ${alias}`).toContain(alias);
        }
      }
    }
  });

  it("offers every flag of every command in all four shells", () => {
    for (const shell of SHELLS) {
      const { options } = shapeOf(shell);
      for (const command of program.commands) {
        const expected = sorted(
          command.options.map((option) => option.long).filter((flag): flag is string => !!flag),
        );
        expect(sorted(options[command.name()] ?? []), `${shell} ${command.name()}`).toEqual(
          expected,
        );
      }
    }
  });

  it("offers the flags of the sub-commands in all four shells", () => {
    for (const shell of SHELLS) {
      const { options } = shapeOf(shell);
      for (const command of program.commands) {
        for (const subcommand of command.commands) {
          const expected = sorted(
            subcommand.options
              .map((option) => option.long)
              .filter((flag): flag is string => !!flag),
          );
          expect(
            sorted(options[`${command.name()} ${subcommand.name()}`] ?? []),
            `${shell} ${command.name()} ${subcommand.name()}`,
          ).toEqual(expected);
        }
      }
    }
  });

  it("offers the same commands and flags in all four shells", () => {
    const shapes = SHELLS.map((shell) => shapeOf(shell));
    const [reference, ...others] = shapes;

    for (const shape of others) {
      expect(sorted(shape.names)).toEqual(sorted(reference.names));
      expect(normalize(shape.options)).toEqual(normalize(reference.options));
    }
  });

  it("takes the resource types from the resource type registry", () => {
    for (const shell of SHELLS) {
      expect(valuesOf(shell, "--type"), shell).toEqual([...RESOURCE_TYPE_VALUES]);
    }
  });

  it("takes the frameworks from the frontend and backend framework registries", () => {
    const expected = [...Object.keys(FRONTEND_FRAMEWORKS), ...Object.keys(BACKEND_FRAMEWORKS)];

    for (const shell of SHELLS) {
      expect(valuesOf(shell, "--framework"), shell).toEqual(expected);
    }
  });

  it("takes the languages from the backend language registry", () => {
    for (const shell of SHELLS) {
      expect(valuesOf(shell, "--language"), shell).toEqual(Object.keys(BACKEND_LANGUAGES));
    }
  });

  it("completes the stacks and the resources of the current project", () => {
    for (const shell of SHELLS) {
      const source = renderCompletionScript(shell, candidates);
      expect(source, shell).toContain("tdk stacks --json");
      expect(source, shell).toContain("tdk resources --json");
    }
  });

  it("offers the global flags in all four shells", () => {
    const globalFlags = sorted(
      program.options
        .map((option) => option.long)
        .filter((flag): flag is string => !!flag)
        .concat("--help"),
    );

    for (const shell of SHELLS) {
      expect(sorted(globalFlagsOf(shell)), shell).toEqual(globalFlags);
    }
  });
});
