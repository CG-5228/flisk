# Recipes

[![Test coverage](https://raw.githubusercontent.com/tdk-landscape/tdk-cli-core/main/docs/assets/coverage.svg)](https://github.com/tdk-landscape/tdk-cli-core/blob/main/docs/assets/coverage.svg)

One file per outside tool, named after the tool, each checked by running the tool for real. The folder listing is the index, so
adding a recipe adds a file and never edits a shared table.

Add a recipe when a tool needs more than a Dockerfile: say what was run, with which versions, what happened, and the
limits you hit. Frameworks that only need a Dockerfile belong in [`examples/byo/`](../../examples/byo/README.md).
