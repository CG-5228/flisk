## 1. Candidate source

- [x] 1.1 Add `cli/src/commands/registry.ts` with the list of the commands the CLI registers.
- [x] 1.2 Move the root program into `cli/src/program.ts` so the registered commands live in one place.
- [x] 1.3 Add `cli/src/commands/completion-candidates.ts` that reads the commands, their flags and the registry value lists.
- [x] 1.4 Export the resource types the CLI accepts (`RESOURCE_TYPE_VALUES`) from `cli/src/types/index.ts` and use them in `tdk resource --type`.

## 2. Completion scripts

- [x] 2.1 Render the Bash script from the candidates, including the flags of every command and sub-command.
- [x] 2.2 Render the Zsh script from the candidates, including the flags of every command and sub-command.
- [x] 2.3 Render the Fish script from the candidates, including the flags of every command and sub-command.
- [x] 2.4 Render the PowerShell script from the candidates, including the flags of every command and sub-command.
- [x] 2.5 Complete the stacks and the resources of the current project from `tdk stacks --json` and `tdk resources --json`.

## 3. Tests

- [x] 3.1 Add `cli/src/commands/__tests__/completion-candidates.test.ts`: every shell offers every command, flag and value of the CLI.
- [x] 3.2 Check that the four shells offer the same commands and flags.
- [x] 3.3 Update the tests that read the registered commands from the source of `cli.ts` to read them from the registry.
- [x] 3.4 Verify that a new command makes the candidate test fail.

## 4. Documentation

- [x] 4.1 Document what the completions suggest and how to refresh them after an upgrade in `docs/cheat-sheet.md`.
- [x] 4.2 Build the CLI and stage the changed `cli/dist` files.
