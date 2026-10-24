# Lobster has no network builtins, so a Lobster program cannot be the HTTP server. This image runs one at build time
# to write the response files, then serves them with BusyBox httpd.
# The release binary links libOpenGL and libGLX even for a headless script, so the generate stage installs them.
FROM debian:bookworm-slim@sha256:7ff6ba31527b9e336162fa061746c366c4b2032f4d2cff2078bea43f78efe3f8 AS generate
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl unzip libopengl0 libglx0 libstdc++6 \
 && rm -rf /var/lib/apt/lists/*
ARG LOBSTER_VERSION=v2026.8
ARG LOBSTER_SHA256=2f03fb96fdaf6935469c99e43ffb182cab0d797faec7b26eccc9a732df32ad31
RUN curl -fsSL -o /tmp/lobster.zip "https://github.com/aardappel/lobster/releases/download/${LOBSTER_VERSION}/lobster_linux_release.zip" \
 && echo "${LOBSTER_SHA256}  /tmp/lobster.zip" | sha256sum -c - \
 && unzip -q /tmp/lobster.zip -d /opt/lobster \
 && rm /tmp/lobster.zip
WORKDIR /site
COPY orders.lobster ./
# CI builds with `docker build -q >/dev/null`, so nothing printed here is ever seen. A Lobster error therefore does not fail the build:
# its output goes to /site/build.log, the final image prints that log at startup, and a missing www/health makes /health 404, which fails
# the check and shows the log. The script writes absolute paths because the docs do not say what a relative write_file path resolves against.
RUN mkdir -p /site/www \
 && { /opt/lobster/bin/lobster orders.lobster 2>&1; echo "lobster exit code: $?"; \
      echo "www: $(ls /site/www | tr '\n' ' ')"; echo "bin: $(ls /opt/lobster/bin | tr '\n' ' ')"; \
      echo "modules: $(ls /opt/lobster/modules 2>&1 | head -c 120 | tr '\n' ' ')"; \
      echo "ldd missing: $(ldd /opt/lobster/bin/lobster 2>&1 | grep -c 'not found')"; } > /site/build.log 2>&1 || true

FROM alpine:3.20@sha256:d9e853e87e55526f6b2917df91a2115c36dd7c696a35be12163d44e6e2a4b6bc
COPY --from=generate /site/www /www
COPY --from=generate /site/build.log /build.log
RUN addgroup -g 1000 -S app && adduser -u 1000 -S -G app app
USER app
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 CMD nc -z 127.0.0.1 ${PORT:-3000} || exit 1
# If httpd cannot start, print the build log again and stay up for 120 seconds, so the check can still read `docker logs`.
CMD ["sh", "-c", "tail -n 14 /build.log >&2; httpd -f -p 0.0.0.0:${PORT:-3000} -h /www || { echo 'httpd failed to start' >&2; tail -n 12 /build.log >&2; sleep 120; }"]
