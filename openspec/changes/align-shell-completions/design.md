## Design Decisions

### 1. The root program is the single source of truth

`cli/src/program.ts` builds the root Commander program and adds the commands of `cli/src/commands/registry.ts`. The completion generator reads the same program: the command names and their flags come from `program.commands` and `program.options`, so a command that is not registered cannot be suggested and a registered command is always suggested.

The completion command reaches the program through `command.parent`, the Commander reference the root program sets when it adds a sub-command. `tdk completion` therefore always runs inside the program it belongs to; a detached call fails with a clear message instead of writing a script with no candidates.

### 2. The command list is built inside a function

`cli/src/commands/registry.ts` imports the completion command, and `cli/src/commands/completion.ts` imports the registry to read the registered commands. The cycle is safe because the list is built inside `getRegisteredCommands()`: neither module touches the other's bindings while it is being evaluated, so the order in which the modules are imported does not matter.

### 3. The value lists come from the registries

`--type` offers `RESOURCE_TYPE_VALUES` (`cli/src/types/index.ts`, the creatable types plus `sdk`), `--framework` offers the frontend and the backend framework ids, and `--language` offers the backend language ids. No script repeats a list that lives in the CLI, and a new provider is suggested as soon as it is registered.

### 4. The project values come from the machine-readable output

The stack and the resource names come from `tdk stacks --json` and `tdk resources --json`, not from the human-readable output, whose layout is not a contract. Bash and Zsh read the `"name"` fields with `grep` and `sed`, Fish with `string match` and `string replace`, and PowerShell with `ConvertFrom-Json`.

### 5. The tests read the candidates back out of the scripts

The candidate test parses the four generated scripts and compares them with the CLI, instead of comparing the candidate data with itself. A completion list that is hand-maintained again fails the test as soon as the CLI changes, which is the property the issue asks for.

### 6. Bash lists the names, the other shells list the descriptions

Bash's `compgen -W` cannot show a description next to a candidate. The three shells that can show one use the description of the command, and Bash still suggests exactly the same names and flags.
