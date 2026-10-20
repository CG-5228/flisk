# Tasks: grow legitimate TDK CLI dependents

## 1. Audit the official landscape

- [ ] 1.1 Inventory public examples, starters, templates, and fixtures under `tdk-landscape`; record URL, activity, ecosystem, manifest, and lockfile.
- [ ] 1.2 For each candidate, verify whether its workflow genuinely installs or uses `@tdk-landscape/tdk-cli-core` and identify the appropriate dependency role.
- [ ] 1.3 Record exclusions and non-Node exceptions with reasons; do not add manifests solely to influence GitHub's count.

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
