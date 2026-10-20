# Tasks: grow legitimate TDK CLI dependents

## 1. Audit the official landscape

The repositories below are audit candidates, not yet-confirmed consumers. The suggested `devDependency` role applies only if the audit confirms that the repository genuinely installs or invokes the published npm package; do not add it solely to affect GitHub's count. Start with these candidates, then record ecosystem, manifest, lockfile, activity, and actual CLI usage for each.

| Repository | URL | Why it belongs | Suggested disposition |
|---|---|---|---|
| `tdk-example` | https://github.com/tdk-landscape/tdk-example | Smallest official multi-service example | `devDependency` if genuine use is confirmed |
| `tdk-saas-starter` | https://github.com/tdk-landscape/tdk-saas-starter | Polished SaaS dashboard + checkout starter | `devDependency` if genuine use is confirmed |
| `tdk-restaurant-example` | https://github.com/tdk-landscape/tdk-restaurant-example | Restaurant ops example (reservations, kitchen, floor) | `devDependency` if genuine use is confirmed |
| `tdk-user-management` | https://github.com/tdk-landscape/tdk-user-management | Enterprise identity / SCIM / OIDC example | `devDependency` if genuine use is confirmed |
| `tdk-ecommerce-example` | https://github.com/tdk-landscape/tdk-ecommerce-example | Vue + Hono storefront example | `devDependency` if genuine use is confirmed |
| `tdk-erp-system` | https://github.com/tdk-landscape/tdk-erp-system | 100-service scale fixture | `devDependency` if genuine use is confirmed |
| `tdk-cli-starter` | https://github.com/tdk-landscape/tdk-cli-starter | Cloud-dev starter / template | `devDependency` if genuine use is confirmed |
| `create-tdk-stack` | https://github.com/tdk-landscape/create-tdk-stack | Landing page / create-app style starter | `devDependency` if genuine use is confirmed |
| `tdk-agent-stack` | https://github.com/tdk-landscape/tdk-agent-stack | AI agent + MCP + Postgres + NATS template | `devDependency` if genuine use is confirmed |
| `tdk-auth-queue-email-example` | https://github.com/tdk-landscape/tdk-auth-queue-email-example | OIDC + NATS + Mailpit example | `devDependency` if genuine use is confirmed |
| `tdk-thor-storefront` | https://github.com/tdk-landscape/tdk-thor-storefront | Thor Commerce storefront landscape | `devDependency` if genuine use is confirmed |
| `tdk-person-crud-example` | https://github.com/tdk-landscape/tdk-person-crud-example | Person CRUD (React/Express/Mongo/Redis/RabbitMQ) | `devDependency` if genuine use is confirmed |
| `vercel-store` | https://github.com/tdk-landscape/vercel-store | Vercel-style storefront landscape | `devDependency` if genuine use is confirmed |
| `tdk-docker-compose-example` | https://github.com/tdk-landscape/tdk-docker-compose-example | CLI-in-Compose example | Audit; may be an exception |

Secondary audit-only candidates, generally expected not to need a package declaration:

- `tdk-skills` — agent skills catalog
- `awesome-tdk-framework` — curated links
- `tdk-website` / `tdk-landscape.github.io` — docs and install site
- `tdk-demo-animation` — walkthrough assets
- `tdk-cli-releases` — binary releases only
- `tdk-service-definitions` — `service.json` registry
- `tdk-import` / `tdk-app` — related tools; audit if they invoke the CLI as a package

- [ ] 1.1 Audit the primary candidate repositories listed above; record URL, activity, ecosystem, manifest, lockfile, actual CLI usage, and disposition. Include additional public examples, starters, templates, and fixtures discovered under `tdk-landscape`.
- [ ] 1.2 For each candidate, verify whether its workflow genuinely installs or uses `@tdk-landscape/tdk-cli-core` and identify the appropriate dependency role.
- [ ] 1.3 Open one repository-specific PR for each confirmed npm-package consumer, adding the appropriate dependency (prefer `devDependencies` when used as a development/scaffolding tool) and updating its existing lockfile.
- [ ] 1.4 Record exclusions and non-Node, binary-only, documentation-only, and CLI-in-Compose exceptions with reasons; do not add manifests solely to influence GitHub's count.

## 2. Verify package metadata

- [ ] 2.1 Inspect the package metadata produced by the publish workflow and confirm its repository URL points to `https://github.com/tdk-landscape/tdk-cli-core`.
- [ ] 2.2 If the publish artifact does not preserve the canonical repository link, correct the package metadata and add a verification step to the release process.

## 3. Update genuine consumers

- [ ] 3.1 In each audited repository that genuinely uses the npm package, add it to the correct dependency section using that repository's version policy.
- [ ] 3.2 Update and commit the existing package manager's lockfile; avoid introducing another package manager.
- [ ] 3.3 For non-Node repositories, document the chosen integration or the reason no npm declaration is appropriate.
- [ ] 3.4 Review each repository change for consistency with its documented setup and actual CLI invocation.

## 4. Document adopter guidance

- [ ] 4.1 Identify the canonical maintained adopter documentation page in `tdk-cli-core`.
- [ ] 4.2 Explain that public dependency-graph recognition requires genuine dependency declarations in supported manifests and that GitHub controls processing/display timing.
- [ ] 4.3 Keep standalone/global CLI installation guidance independent from package dependency declarations.

## 5. Track and measure

- [ ] 5.1 Open or update a tracking issue listing audited repositories, their disposition, and the baseline dependents observation.
- [ ] 5.2 After consumer changes merge, re-check GitHub's dependency graph/dependents view and record the date and observed count.
- [ ] 5.3 Record any processing delay or display limitation; do not create artificial dependencies to reach a target number.
- [ ] 5.4 Confirm adopter documentation and package metadata are published and discoverable.

## Optional: GitHub Packages visibility

This is independent of npm dependency-graph recognition and the “Used by” count. The CLI is published to the public npm registry; an empty GitHub Packages tab does not block npm-based dependents from appearing.

- [ ] O.1 Decide whether to also publish `@tdk-landscape/tdk-cli-core` to GitHub Packages (`npm.pkg.github.com`) in addition to npmjs.com.
- [ ] O.2 If approved, configure the GitHub Packages registry and authenticated release workflow, publish a version, and connect the package to `tdk-landscape/tdk-cli-core` so it appears on the repository's Packages tab.
