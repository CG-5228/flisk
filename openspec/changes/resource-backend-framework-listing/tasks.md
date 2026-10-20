## 1. Backend framework inventory

- [x] 1.1 Add `listBackendFrameworks` to `cli/src/backend-frameworks/registry.ts`, deriving the compatible languages from `BACKEND_LANGUAGES` through `resolveBackendFramework`.
- [x] 1.2 Make `tdk resource --frameworks` type aware in `cli/src/commands/resource.ts`: no `--type` keeps the frontend listing, `--type frontend` prints the frontend listing, `--type backend` prints the backend listing.
- [x] 1.3 Mark every backend framework that cannot be combined with the requested `--language`.
- [x] 1.4 Fail with an actionable message for a resource type that has no frameworks, and reuse the existing type and language validation errors.
- [x] 1.5 Update the `tdk resource` help text for `--frameworks` and `--framework`.

## 2. Tests

- [x] 2.1 Add `cli/src/commands/__tests__/resource-framework-inventory.test.ts` covering the frontend listing, the backend listing, the language compatibility marker, the failing type and language, and the help text.
- [x] 2.2 Add the inventory unit tests to `cli/src/commands/__tests__/resource-backend-frameworks.test.ts`.
- [x] 2.3 Confirm the new tests fail without the implementation (red for the right reason).

## 3. Documentation

- [x] 3.1 Update `cli/README.md` with the backend framework listing.
- [x] 3.2 Update `docs/cheat-sheet.md` with the new command and the flag description.
- [x] 3.3 Update `docs/frontend-framework-providers.md` and `docs/backend-language-providers.md` with the listing commands.

## 4. Verification

- [x] 4.1 `cd cli && ./node_modules/.bin/biome check .`
- [x] 4.2 `cd cli && ./node_modules/.bin/tsc --noEmit`
- [x] 4.3 `cd cli && npm run build` and stage the changed `cli/dist` files.
- [x] 4.4 `cd cli && ./node_modules/.bin/vitest run` for the new and the touched test files, then the full suite.
