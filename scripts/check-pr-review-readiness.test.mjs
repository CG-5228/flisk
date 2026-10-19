import assert from "node:assert/strict";
import test from "node:test";
import { reviewReadiness } from "./check-pr-review-readiness.mjs";

const body = (summary, verification) =>
	`## What changed?\n\n${summary}\n\n## How did you check it?\n\n${verification}\n`;

test("accepts a completed PR template check", () => {
	assert.equal(
		reviewReadiness(body("Added a repository ruleset check.", "- [x] `node --test scripts/*.test.mjs`")).passed,
		true,
	);
});

test("accepts a completed custom check with the template checkbox", () => {
	assert.equal(
		reviewReadiness(body("Added a repository ruleset check.", "- [x] Other check: `node --check scripts/check-pr-review-readiness.mjs` passed.")).passed,
		true,
	);
});

test("accepts a documented custom check without checkbox syntax", () => {
	assert.equal(
		reviewReadiness(body("Added a repository ruleset check.", "- Other check: `make test-shell` passed.")).passed,
		true,
	);
});

test("rejects empty summary and verification sections", () => {
	const result = reviewReadiness(body("<!-- add summary -->", "<!-- add checks -->"));
	assert.equal(result.passed, false);
	assert.equal(result.issues.length, 2);
});

test("rejects placeholder-only summaries", () => {
	for (const placeholder of ["[Input]", "TODO", "Describe the changes here."]) {
		assert.equal(reviewReadiness(body(placeholder, "- [x] `bun test`")).passed, false);
	}
});

test("rejects untouched verification template placeholders", () => {
	const result = reviewReadiness(
		body("Added a repository ruleset check.", "- [ ] Other check: <!-- Include the command and result. -->"),
	);
	assert.equal(result.passed, false);
});

test("does not treat the checklist bookkeeping item as verification", () => {
	const result = reviewReadiness(
		body("Added a repository ruleset check.", "- [x] I said which checks I did not run and why."),
	);
	assert.equal(result.passed, false);
});
