# syntax=docker/dockerfile:1.7
#
# Passive Coder CMS, self-hosted edition (one site). See selfhost/INSTALL-SERVER.md.
#
# Two kinds of image (Next.js writes the NEXT_PUBLIC_* settings into the code
# when it builds, so the choice is made here):
#
#   Ready-made, for every site (what selfhost/install.sh uses):
#     docker build --build-arg PC_GENERIC=1 -t passivecoder-cms .
#   It is built with placeholder values; when a container starts,
#   selfhost/docker-entrypoint.mjs puts the site's real values (from .env) in
#   their place. A small server can run it: nothing is built there.
#
#   For one site: give the settings either as a build secret holding your
#   .env.local (simplest), or as build args (CI):
#     docker build --secret id=build_env,src=.env.local -t passivecoder-cms .
#
# Building needs about 8 GB of RAM. Targets:
#   runner (default)  the web app (Next.js standalone server, port 3000)
#   cron              runs the scheduled jobs in selfhost/crontab.example
#
# The hosted platform does not use this file (Vercel builds from source).

ARG NODE_IMAGE=node:22-bookworm-slim

# --- 1. Dependencies -------------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# Small separate install for the database scripts in selfhost/ (they need pg,
# which the web app itself does not load).
FROM ${NODE_IMAGE} AS tools
WORKDIR /tools
COPY package-lock.json /tmp/lock.json
RUN --mount=type=cache,target=/root/.npm \
    PG_VERSION="$(node -p "require('/tmp/lock.json').packages['node_modules/pg'].version")" \
 && npm init -y >/dev/null \
 && npm install --omit=dev --no-audit --no-fund "pg@${PG_VERSION}"

# --- 2. Build ----------------------------------------------------------------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public settings baked into the build. Empty build args are ignored; values
# in the build_env secret win over nothing, build args win over the secret.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_ROOT_DOMAIN
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_LOGO_URL
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
# 1 = the ready-made image that works for every site (see the top of this file).
ARG PC_GENERIC=0
# Heap for the build, in MB. Lower it only if the build machine has less RAM
# (and expect it to fail below about 4096).
ARG BUILD_HEAP_MB=6144

ENV NEXT_PUBLIC_CMS_MODE=standalone \
    NEXT_OUTPUT_STANDALONE=1 \
    NEXT_TELEMETRY_DISABLED=1

# The secret is mounted only for this step and never stored in the image.
RUN --mount=type=secret,id=build_env,required=false \
    --mount=type=cache,target=/app/.next/cache \
    set -e; \
    if [ "$PC_GENERIC" = "1" ]; then \
      export NEXT_PUBLIC_SUPABASE_URL=https://pcplaceholdersupabase.supabase.co \
             NEXT_PUBLIC_SUPABASE_ANON_KEY=pcplaceholder_supabase_public_key \
             NEXT_PUBLIC_ROOT_DOMAIN=pcplaceholderrootdomain.invalid \
             NEXT_PUBLIC_APP_URL=https://pcplaceholderappurl.invalid; \
      echo generic > /app/.pc-image-kind; \
    else echo site > /app/.pc-image-kind; fi; \
    for v in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_ROOT_DOMAIN NEXT_PUBLIC_APP_URL \
             NEXT_PUBLIC_GOOGLE_MAPS_API_KEY NEXT_PUBLIC_VAPID_PUBLIC_KEY NEXT_PUBLIC_LOGO_URL NEXT_PUBLIC_WHATSAPP_NUMBER; do \
      eval "val=\${$v:-}"; [ -n "$val" ] || unset "$v"; \
    done; \
    eval "$(node selfhost/build-env.mjs /run/secrets/build_env)"; \
    node -e " \
      const need = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_ROOT_DOMAIN', 'NEXT_PUBLIC_APP_URL']; \
      const miss = need.filter((k) => !process.env[k]); \
      if (miss.length) { console.error('Missing build settings: ' + miss.join(', ') + '. Pass --secret id=build_env,src=.env.local or --build-arg.'); process.exit(1); } \
      if (process.env.NEXT_PUBLIC_CMS_MODE !== 'standalone') { console.error('NEXT_PUBLIC_CMS_MODE must be standalone'); process.exit(1); }"; \
    NEXT_PUBLIC_CMS_MODE=standalone node --max-old-space-size=${BUILD_HEAP_MB} \
      ./node_modules/next/dist/bin/next build --webpack

# --- 3. Web app ----------------------------------------------------------------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PASSIVECODER_LICENCE_FILE=/app/data/licence.json \
    PC_INSTALL_KIND=docker

# /app itself belongs to the app user: the entrypoint of a generic image
# rewrites files there when a container starts.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --home /app nextjs \
 && mkdir -p /app/data && chown nextjs:nodejs /app /app/data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Database scripts: first load, updates, site import.
COPY --from=builder --chown=nextjs:nodejs /app/selfhost ./selfhost
COPY --from=builder --chown=nextjs:nodejs /app/supabase/migrations ./supabase/migrations
COPY --from=builder --chown=nextjs:nodejs /app/LICENSE-MODULES.txt ./LICENSE-MODULES.txt
COPY --from=tools --chown=nextjs:nodejs /tools/node_modules ./selfhost/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.pc-image-kind ./.pc-image-kind

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/login',{redirect:'manual'}).then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
# Puts the site settings into a ready-made image, then runs server.js.
CMD ["node", "selfhost/docker-entrypoint.mjs"]

# --- 4. Scheduled jobs ----------------------------------------------------------
# Calls the app's /api/cron/* addresses on the schedule in crontab.example.
# Needs SITE_URL (e.g. http://app:3000 inside docker compose) and CRON_SECRET.
FROM debian:bookworm-slim AS cron
ARG SUPERCRONIC_VERSION=v0.2.51
ARG TARGETARCH
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && case "${TARGETARCH:-amd64}" in \
      amd64) SHA1=1692066e350a88ff4d7d6474fe3c7a6c41ec5e89 ;; \
      arm64) SHA1=9d4c2000493215a1898502b2fc2dada3e8ea8c7a ;; \
      *) echo "unsupported architecture ${TARGETARCH}" >&2; exit 1 ;; \
    esac \
 && curl -fsSLo /usr/local/bin/supercronic "https://github.com/aptible/supercronic/releases/download/${SUPERCRONIC_VERSION}/supercronic-linux-${TARGETARCH:-amd64}" \
 && echo "${SHA1}  /usr/local/bin/supercronic" | sha1sum -c - \
 && chmod +x /usr/local/bin/supercronic \
 && useradd --system --uid 1001 cron
COPY selfhost/crontab.example /etc/passivecoder/crontab.example
USER cron
# The SITE_URL and CRON_SECRET lines in the file are examples: the values come
# from the container's environment instead.
CMD ["/bin/sh", "-c", ": \"${SITE_URL:?set SITE_URL}\" \"${CRON_SECRET:?set CRON_SECRET}\"; sed -e '/^SITE_URL=/d' -e '/^CRON_SECRET=/d' /etc/passivecoder/crontab.example > /tmp/crontab && exec supercronic -passthrough-logs /tmp/crontab"]
