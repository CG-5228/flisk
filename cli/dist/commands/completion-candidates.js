import { BACKEND_FRAMEWORKS } from "../backend-frameworks/registry.js";
import { BACKEND_LANGUAGES } from "../backend-languages/registry.js";
import { FRONTEND_FRAMEWORKS } from "../frontend-frameworks/registry.js";
import { RESOURCE_TYPE_VALUES } from "../types/index.js";
/**
 * The positional argument of a command, keyed by the command path (`"agent sessions"`). Only the
 * commands whose argument names something in the current project are listed.
 */
const POSITIONALS = {
    help: "commands",
    up: "stacks-and-resources",
    stack: "stacks",
    restart: "resources",
    logs: "resources",
    "agent sessions": "resources",
};
/** Commander's built-in help command. It is not one of the registered commands, so it is added here. */
const HELP_COMMAND = {
    name: "help",
    aliases: [],
    description: "Show help",
    options: [],
    subcommands: [],
    positional: "commands",
};
/** Commander's built-in help flag. Every command accepts it. */
const HELP_OPTION = {
    flag: "--help",
    description: "Show help",
    takesValue: false,
};
function toOptions(options) {
    return options
        .filter((option) => typeof option.long === "string")
        .map((option) => ({
        flag: option.long,
        description: option.description,
        takesValue: option.required || option.optional,
    }));
}
function toCompletionCommand(command, path) {
    return {
        name: command.name(),
        aliases: command.aliases(),
        description: command.description(),
        options: toOptions(command.options),
        subcommands: command.commands.map((subcommand) => toCompletionCommand(subcommand, `${path} ${subcommand.name()}`)),
        ...(POSITIONALS[path] ? { positional: POSITIONALS[path] } : {}),
    };
}
/**
 * Reads the completion candidates from the CLI: the registered commands with their flags, the
 * global flags of the root program, and the value lists of the framework, language and
 * resource-type registries.
 */
export function buildCompletionCandidates(program) {
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
