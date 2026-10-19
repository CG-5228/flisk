# Branch ruleset snapshots

These JSON files are the checked-in record of the repository's active GitHub
rulesets. Keep them in sync with **Settings → Rules → Rulesets** when repository
protection changes. They intentionally describe settings rather than contain
GitHub's API export format: GitHub does not apply them automatically, and the
repository ruleset API requires an Administration write token.

When adding a required check, merge the workflow that produces it first, then
add that check to the live GitHub rulesets. This avoids requiring a status
context before GitHub can run it from the default branch. The main-branch check
inventory is also recorded in `../required-checks.json` and validated by CI.

`main.json` keeps the main-branch merge queue and requires PR review and the
listed checks. `releases.json` applies the same review and safety requirements
to `release/*` and `releases/**/*` without a merge queue.

Both rulesets require one human approval. Automated PR checks can reject
incomplete PR summaries, but GitHub bots and AI reviews do not count as human
approvals for OpenSSF Scorecard's Code-Review check.
