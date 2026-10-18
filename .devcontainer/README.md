# Contributor Dev Container

[![Test coverage](https://raw.githubusercontent.com/tdk-landscape/tdk-cli-core/main/docs/assets/coverage.svg)](https://github.com/tdk-landscape/tdk-cli-core/blob/main/docs/assets/coverage.svg)

Lightweight environment for working on the TDK CLI source tree.

- **Image**: Node.js 22 TypeScript image
- **Bun**: installed via the official Dev Container feature
- **Post-create**: `bun install` (workspace install from the repository root)

After the container starts:

```bash
bun run typecheck
bun run lint
bun run test
```

Docker and Tilt are intentionally omitted from the default configuration so startup stays fast. Most `cli/` changes do not need them.

To try a full stack (`tdk up`) you will still need a Docker engine and Tilt; see the issue and the agent-host-runtime OpenSpec for the heavier path.
