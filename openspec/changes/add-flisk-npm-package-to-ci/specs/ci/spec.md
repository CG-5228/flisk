# CI Specification

## ADDED Requirements

### Requirement: CI verifies the published npm package

The CI pipeline SHALL install `@flisk-sh/flisk` from the public npm registry at an exact pinned version and verify that the installed CLI reports that version.

#### Scenario: Pinned package installs and reports its version

- **WHEN** the `npm-package-smoke` job runs on a non-docs-only change
- **THEN** it installs `@flisk-sh/flisk` at the pinned version from the public npm registry
- **AND** `flisk --version` output contains the pinned version
- **AND** the job succeeds

#### Scenario: Installed version does not match the pin

- **WHEN** `flisk --version` does not contain the pinned version
- **THEN** the job exits with a non-zero status
- **AND** the error names both the reported version and the pinned version

### Requirement: The pinned version is exact and deterministic

The CI pipeline SHALL use an exact version for the registry install and SHALL NOT use a version range or `latest`.

#### Scenario: Version is explicit

- **WHEN** the job resolves the package to install
- **THEN** the version is the exact pin in `.github/npm-package-smoke/package.json`, installed through its lockfile

### Requirement: Published-package failures gate the workflow

The `summary` job SHALL include `npm-package-smoke` in its gate, so a failed or cancelled run of that job fails the required check.

#### Scenario: Smoke job fails

- **WHEN** `npm-package-smoke` ends with a result other than success or skipped
- **THEN** the `summary` job fails

### Requirement: Existing CI checks remain intact

Adding `npm-package-smoke` SHALL NOT remove or weaken existing CI jobs, including `package-smoke`.

#### Scenario: Existing jobs still run

- **WHEN** the CI workflow runs after this change
- **THEN** `package-smoke` and the existing lint, typecheck, test, and package jobs continue to run
