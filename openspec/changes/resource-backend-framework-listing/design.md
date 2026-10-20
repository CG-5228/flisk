## Design Decisions

### 1. The listing is derived, never hand-maintained

`listBackendFrameworks` reads `BACKEND_FRAMEWORKS` and `BACKEND_LANGUAGES` and decides which languages a
framework can be combined with by calling `resolveBackendFramework` — the exact function the resource
command uses to validate `--framework` and `--language`. A language that owns its runtime (Python, Go,
Rust, Node) makes that call throw, so it never appears as a compatible language. A new framework or
language is therefore discoverable without touching the listing code.

### 2. `--type` selects the listing, and no `--type` keeps the old one

`--type` has a default value (`backend`), so the listing cannot read the option value alone to know
whether the user asked for a type. Commander records where an option value came from
(`getOptionValueSource`), so an explicit `--type` on the command line is detected without changing the
default or the scaffold behavior:

- no `--type` → the historical frontend listing, unchanged;
- `--type frontend` → the same frontend listing;
- `--type backend` → the backend listing.

### 3. One tab separated row per framework

The frontend listing prints `id`, `label`, `kind`, `verification`, `command`, one framework per row, tab
separated. The backend listing keeps the same shape: `id`, `label`, `language`, `compatibility`, `command`.
The language id is also the runtime the service runs on (`bun` for every registered framework), and the
label already names it (`Bun + Express`), so the row shows the id, the display name, the language and the
runtime without a redundant column.

The compatibility cell is `compatible`, or `incompatible with --language <id>` when the user asked for a
language that owns its runtime. The row still shows the command that works (the framework on the default
Bun language), because the invalid part of the user's command is the language, not the framework.

### 4. Types without frameworks fail loudly

`--type worker --frameworks` (and the other types without frameworks) is a user mistake, not an empty
result. The command fails with the list of types that do have frameworks, so a script can rely on the exit
code.

### 5. The listing is tested through the real binary

The inventory is a CLI contract, so the test spawns `cli/bin/tdk.js` and reads the tab separated output.
A spawned process also avoids the commander state that an in-process `parseAsync` keeps between runs,
where a `--type` from an earlier case would still be set for a later one.
