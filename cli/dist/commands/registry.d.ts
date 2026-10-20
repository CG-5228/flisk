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
/** Every command the CLI registers, in the order `tdk --help` lists them. */
export declare function getRegisteredCommands(): readonly Command[];
