# fastify

[![Test coverage](https://raw.githubusercontent.com/tdk-landscape/tdk-cli-core/main/docs/assets/coverage.svg)](https://github.com/tdk-landscape/tdk-cli-core/blob/main/docs/assets/coverage.svg)

**Stack:** Node, Fastify 5

## Check it

Needs Docker. Builds the image, runs it with `PORT=4000` and expects HTTP 200 on `/health`:

```bash
tests/e2e/resource-types/bring-your-own/verify-byo-example.sh fastify
```

## Register it in a TDK project

```bash
tdk resource fastify-api --type bring-your-own --stack shop --dockerfile ./Dockerfile --yes
```

Use a resource name that is unique across TDK projects sharing one Docker daemon. See
[../README.md](../README.md) and [docs/byo.md](../../../docs/byo.md) for the container contract.
