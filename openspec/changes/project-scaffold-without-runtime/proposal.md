## Why

`tdk project` creates the local project configuration and can clone a starter template, but it runs the Docker/Tilt cold preflight before doing either. A developer who is preparing a project - or working in a devcontainer or on a remote machine where the Docker daemon is not running and Tilt is not installed yet - is blocked before setup is complete. The local runtime is only needed to start a stack, so the readiness check belongs on `tdk up`, not on project scaffolding.

## What Changes

- Split the cold preflight into two scopes: `runtime` (Docker, Compose, Tilt, Bun, ports, project wiring) and `scaffold` (Node, Bun, host ports).
- Run `tdk project` in the scaffold scope, so it initializes a project or clones a starter template with Docker stopped and Tilt not installed, and it never contacts the Docker daemon while setting a project up.
- Print a next-step hint after project setup that names the missing runtime pieces (`tdk doctor` for readiness, `tdk up` to start the stack) instead of failing.
- Keep the runtime preflight unchanged for `tdk up`: a missing Docker daemon, Compose plugin or Tilt still blocks the startup with the ranked failures and their fixes.
- Keep `tdk doctor` as the explicit readiness check for the whole machine.

## Capabilities

### New Capabilities

- `project-scaffold-without-runtime`: Project configuration and starter-template setup complete without a running Docker daemon or an installed Tilt, and report the runtime as a next step instead of a blocker.

### Modified Capabilities

- `tdk-up-lifecycle`: Starting a stack still requires the local runtime, and the readiness gate keeps reporting actionable fixes.

## Non-goals

- Installing Docker, Tilt or Bun automatically.
- Changing the readiness semantics of `tdk up`, `tdk doctor` or any other command.
- Changing generated project files, templates, or the engine.
- Relaxing the Bun requirement of project setup.

## Impact

- CLI preflight utility: `cli/src/utils/cold-preflight.ts` (new scopes, runtime prerequisite detection, next-step formatting).
- CLI command: `cli/src/commands/project.ts` (scaffold scope and the next-step hint).
- Tests: `cli/src/utils/cold-preflight-scope.test.ts`, `cli/src/commands/__tests__/project-without-runtime.test.ts`, `cli/src/commands/__tests__/up-runtime-preflight.test.ts`, plus the existing project command tests.
- Documentation: `cli/README.md`, `docs/cheat-sheet.md`, `docs/troubleshooting.md`, `docs/ARCHITECTURE.md`.
