#!/bin/sh
# Passive Coder CMS (self-hosted, one site): one-command install on a server.
#
#   curl -fsSL https://raw.githubusercontent.com/PassiveCoderOfficial/PassiveCoderCMS/main/selfhost/install.sh | sudo sh
#
# For Ubuntu 22.04 or newer and Debian 12 or newer, on a fresh server with
# ports 80 and 443 free. It:
#   1. checks the machine (system, memory, disk, ports)
#   2. installs Docker if it is missing
#   3. asks for your domain and your Supabase details, and checks them
#   4. makes the secret keys and writes /opt/passivecoder/.env
#   5. starts the site with automatic HTTPS (Caddy), scheduled jobs, and a
#      daily database backup
#   6. loads the database, waits until the site answers, and prints the
#      address of the web installer with its setup code
#
# Safe to run again: it keeps your settings and secret keys, asks only what
# is missing (press Enter to keep a value) and brings everything up to date.
#
# No questions (unattended): pass every value as an option or environment
# variable, and --yes:
#   --domain example.com          PC_DOMAIN
#   --supabase-url https://...    PC_SUPABASE_URL
#   --anon-key sb_publishable_... PC_ANON_KEY
#   --service-key sb_secret_...   PC_SERVICE_KEY
#   --database-url postgresql://  PC_DATABASE_URL
#   --email you@example.com       PC_EMAIL    (optional: HTTPS certificate notices)
#   --build                       PC_BUILD=1  (build the app on this server instead of
#                                             downloading it; needs about 8 GB of memory)
#   --dir /opt/passivecoder       PC_DIR
#   --yes                         PC_YES=1
#   --hide-code                   PC_HIDE_CODE=1  (do not print the setup code: for AI
#                                             agents, whose output lands in a chat)
#
# Written for POSIX sh (dash): no bash needed.

set -eu
umask 077

PC_DIR=${PC_DIR:-/opt/passivecoder}
PC_IMAGE=${PC_IMAGE:-ghcr.io/passivecoderofficial/passivecodercms:latest}
PC_CRON_IMAGE=${PC_CRON_IMAGE:-ghcr.io/passivecoderofficial/passivecodercms-cron:latest}
PC_REPO=${PC_REPO:-https://github.com/PassiveCoderOfficial/PassiveCoderCMS.git}
PC_BRANCH=${PC_BRANCH:-main}
PC_RAW=${PC_RAW:-https://raw.githubusercontent.com/PassiveCoderOfficial/PassiveCoderCMS/$PC_BRANCH}

DOMAIN=${PC_DOMAIN:-}
SB_URL=${PC_SUPABASE_URL:-}
ANON_KEY=${PC_ANON_KEY:-}
SERVICE_KEY=${PC_SERVICE_KEY:-}
DB_URL=${PC_DATABASE_URL:-}
ACME_EMAIL=${PC_EMAIL:-}
BUILD=${PC_BUILD:-}
YES=${PC_YES:-}
HIDE_CODE=${PC_HIDE_CODE:-}

# ── Output ──────────────────────────────────────────────────────────────
if [ -t 1 ]; then B=$(printf '\033[1m'); G=$(printf '\033[32m'); Y=$(printf '\033[33m'); R=$(printf '\033[31m'); D=$(printf '\033[2m'); N=$(printf '\033[0m'); else B=; G=; Y=; R=; D=; N=; fi
say()  { printf '%s\n' "$*"; }
step() { printf '\n%s== %s%s\n' "$B" "$*" "$N"; }
ok()   { printf '  %sok%s    %s\n' "$G" "$N" "$*"; }
warn() { printf '  %swarn%s  %s\n' "$Y" "$N" "$*"; }
note() { printf '  %s%s%s\n' "$D" "$*" "$N"; }
die()  { printf '\n%sStopped:%s %s\n' "$R" "$N" "$*" >&2; exit 1; }

usage() {
  if [ -f "$0" ] && grep -q 'one-command install on a server' "$0" 2>/dev/null; then sed -n '2,35p' "$0" | sed 's/^# \{0,1\}//'
  else say "See the top of selfhost/install.sh, or selfhost/INSTALL-SERVER.md."; fi
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN=${2:-}; shift 2 ;;
    --supabase-url) SB_URL=${2:-}; shift 2 ;;
    --anon-key|--publishable-key) ANON_KEY=${2:-}; shift 2 ;;
    --service-key|--secret-key) SERVICE_KEY=${2:-}; shift 2 ;;
    --database-url) DB_URL=${2:-}; shift 2 ;;
    --email) ACME_EMAIL=${2:-}; shift 2 ;;
    --dir) PC_DIR=${2:-}; shift 2 ;;
    --build) BUILD=1; shift ;;
    --yes|-y) YES=1; shift ;;
    --hide-code) HIDE_CODE=1; shift ;;
    --help|-h) usage ;;
    *) die "Unknown option: $1 (see --help)" ;;
  esac
done

ENV_FILE="$PC_DIR/.env"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT INT TERM

# Questions are read from the terminal, so `curl ... | sudo sh` can ask.
INTERACTIVE=
if [ -z "$YES" ] && [ -r /dev/tty ] && ( : < /dev/tty ) 2>/dev/null; then INTERACTIVE=1; fi

# ask VAR "Question" "hint" [secret]
ask() {
  _var=$1; _q=$2; _hint=$3; _secret=${4:-}
  eval "_cur=\${$_var}"
  [ -n "$_hint" ] && note "$_hint"
  if [ -n "$_cur" ]; then
    if [ -n "$_secret" ]; then _show="keep the current one"; else _show=$_cur; fi
    printf '  %s [%s]: ' "$_q" "$_show" > /dev/tty
  else
    printf '  %s: ' "$_q" > /dev/tty
  fi
  if [ -n "$_secret" ]; then
    stty -echo < /dev/tty 2>/dev/null || true
    IFS= read -r _ans < /dev/tty || _ans=
    stty echo < /dev/tty 2>/dev/null || true
    printf '\n' > /dev/tty
  else
    IFS= read -r _ans < /dev/tty || _ans=
  fi
  # Remove spaces and quotes pasted around the value.
  _ans=$(printf '%s' "$_ans" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e "s/^[\"']//" -e "s/[\"']\$//")
  [ -n "$_ans" ] && eval "$_var=\$_ans"
  return 0
}

confirm() {
  [ -n "$INTERACTIVE" ] || return 0
  printf '  %s [Y/n]: ' "$1" > /dev/tty
  IFS= read -r _a < /dev/tty || _a=
  case "$_a" in n|N|no|NO|No) return 1 ;; *) return 0 ;; esac
}

# ── Settings file helpers ──────────────────────────────────────────────
# Read KEY from .env (plain or single-quoted value, as this script writes).
env_get() {
  [ -f "$ENV_FILE" ] || return 0
  sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1 | sed -e "s/^'\(.*\)'\$/\1/" -e 's/^"\(.*\)"$/\1/'
}

# Write KEY=VALUE into .env: replace the line if present, add it otherwise.
# Values with unusual characters are single-quoted (Docker Compose reads them
# literally); a value holding a quote or a line break is refused.
env_set() {
  _k=$1; _v=$2
  case "$_v" in *"'"*) die "The value for $_k holds a single quote ('). Change it (for a database password: reset it in Supabase without quotes) and run this again." ;; esac
  if printf '%s' "$_v" | grep -q '^[A-Za-z0-9_@%+=:,./-]*$'; then _line="$_k=$_v"; else _line="$_k='$_v'"; fi
  touch "$ENV_FILE"
  if grep -q "^$_k=" "$ENV_FILE"; then
    # ENVIRON, not awk -v: -v would change backslashes in the value.
    PC_K="$_k" PC_L="$_line" awk 'BEGIN { done = 0 } index($0, ENVIRON["PC_K"] "=") == 1 { if (!done) { print ENVIRON["PC_L"]; done = 1 }; next } { print }' "$ENV_FILE" > "$TMP/env"
    cat "$TMP/env" > "$ENV_FILE"
  else
    printf '%s\n' "$_line" >> "$ENV_FILE"
  fi
}

rand_b64() { openssl rand -base64 32 | tr -d '\n'; }
rand_hex() { openssl rand -hex "$1" | tr -d '\n'; }

# ── 1. The machine ───────────────────────────────────────────────────────
step "1. Checking this server"
[ "$(id -u)" = "0" ] || die "Run this as root: put sudo in front (curl ... | sudo sh)."

if [ -r /etc/os-release ]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  OS_ID=${ID:-}; OS_VER=${VERSION_ID:-0}
else
  OS_ID=unknown; OS_VER=0
fi
OS_MAJOR=${OS_VER%%.*}
case "$OS_ID" in
  ubuntu) [ "$OS_MAJOR" -ge 22 ] 2>/dev/null || die "Ubuntu $OS_VER is too old. Use Ubuntu 22.04 or newer." ;;
  debian) [ "$OS_MAJOR" -ge 12 ] 2>/dev/null || die "Debian $OS_VER is too old. Use Debian 12 or newer." ;;
  *) [ -n "${PC_SKIP_OS_CHECK:-}" ] || die "This script is made for Ubuntu 22.04+ and Debian 12+ (this is ${PRETTY_NAME:-unknown}). Set PC_SKIP_OS_CHECK=1 to try anyway, or follow selfhost/INSTALL-SERVER.md." ;;
esac
ok "System: ${PRETTY_NAME:-$OS_ID $OS_VER}"

# An install made with --build keeps building on later runs.
[ -n "$BUILD" ] || BUILD=$(env_get PC_BUILD)
ARCH=$(uname -m)
case "$ARCH" in
  x86_64|amd64) ;;
  aarch64|arm64)
    if [ -z "$BUILD" ]; then warn "This is an ARM server: the ready-made app is for x86 only, so the app will be built here (needs about 8 GB of memory)."; BUILD=1; fi ;;
  *) die "Unsupported processor: $ARCH. Use an x86_64 (amd64) or ARM64 server." ;;
esac

MEM_MB=$(awk '/^MemTotal:/ { printf "%d", $2 / 1024 }' /proc/meminfo)
SWAP_MB=$(awk '/^SwapTotal:/ { printf "%d", $2 / 1024 }' /proc/meminfo)
ok "Memory: ${MEM_MB} MB (swap ${SWAP_MB} MB)"
if [ -n "$BUILD" ]; then NEED_MB=8000; NEED_DISK=20; else NEED_MB=2000; NEED_DISK=6; fi

# Small servers get a swap file, so a busy moment does not stop the site.
if [ $((MEM_MB + SWAP_MB)) -lt "$NEED_MB" ] && [ ! -f /swapfile-passivecoder ]; then
  SWAP_WANT=$(( (NEED_MB - MEM_MB - SWAP_MB) / 1024 + 1 ))
  note "Adding ${SWAP_WANT} GB of swap (extra memory on disk) at /swapfile-passivecoder."
  if fallocate -l "${SWAP_WANT}G" /swapfile-passivecoder 2>/dev/null || dd if=/dev/zero of=/swapfile-passivecoder bs=1M count=$((SWAP_WANT * 1024)) status=none; then
    chmod 600 /swapfile-passivecoder && mkswap /swapfile-passivecoder >/dev/null && swapon /swapfile-passivecoder \
      && { grep -q '^/swapfile-passivecoder ' /etc/fstab || printf '/swapfile-passivecoder none swap sw 0 0\n' >> /etc/fstab; } \
      && ok "Swap added." || warn "Could not turn the swap file on. Going on without it."
  else
    warn "Not enough disk for a swap file. Going on without it."
    rm -f /swapfile-passivecoder
  fi
fi

mkdir -p "$PC_DIR"
DISK_GB=$(df -Pk "$PC_DIR" | awk 'NR == 2 { printf "%d", $4 / 1048576 }')
[ "$DISK_GB" -ge "$NEED_DISK" ] || die "Only ${DISK_GB} GB of disk is free; ${NEED_DISK} GB is needed. Free some space or use a bigger disk."
ok "Disk: ${DISK_GB} GB free"

# Tools this script needs.
NEED_PKGS=
command -v curl >/dev/null 2>&1 || NEED_PKGS="$NEED_PKGS curl"
command -v openssl >/dev/null 2>&1 || NEED_PKGS="$NEED_PKGS openssl"
if ! command -v cron >/dev/null 2>&1 || [ ! -d /etc/cron.d ]; then NEED_PKGS="$NEED_PKGS cron"; fi
if [ -n "$BUILD" ] && ! command -v git >/dev/null 2>&1; then NEED_PKGS="$NEED_PKGS git"; fi
[ -f /etc/ssl/certs/ca-certificates.crt ] || NEED_PKGS="$NEED_PKGS ca-certificates"
if [ -n "$NEED_PKGS" ]; then
  note "Installing:$NEED_PKGS"
  DEBIAN_FRONTEND=noninteractive apt-get update -qq >/dev/null
  # shellcheck disable=SC2086
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq $NEED_PKGS >/dev/null || die "Could not install:$NEED_PKGS"
fi
systemctl enable --now cron >/dev/null 2>&1 || true

# Ports 80 and 443: free, or already ours (Docker).
for port in 80 443; do
  holder=$(ss -Hltnp "sport = :$port" 2>/dev/null | sed -n 's/.*users:(("\([^"]*\)".*/\1/p' | head -n 1)
  if [ -n "$holder" ] && [ "$holder" != "docker-proxy" ] && [ "$holder" != "caddy" ]; then
    die "Port $port is used by \"$holder\". This install brings its own web server (Caddy) for HTTPS. Stop and disable $holder first (for example: systemctl disable --now $holder), or use a fresh server."
  fi
done
ok "Ports 80 and 443 are free for HTTPS."

# ── 2. Docker ────────────────────────────────────────────────────────────
step "2. Docker"
if ! command -v docker >/dev/null 2>&1; then
  note "Installing Docker (from get.docker.com). This takes a minute or two."
  curl -fsSL https://get.docker.com -o "$TMP/get-docker.sh" || die "Could not download the Docker installer. Check this server's internet connection."
  sh "$TMP/get-docker.sh" >/dev/null 2>&1 || die "Docker did not install. Run: curl -fsSL https://get.docker.com | sh   and read what it says."
fi
systemctl enable --now docker >/dev/null 2>&1 || true
docker info >/dev/null 2>&1 || die "Docker is installed but not running. Try: systemctl start docker"
if ! docker compose version >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker-compose-plugin >/dev/null 2>&1 || die "Docker Compose is missing. Install it: apt-get install docker-compose-plugin"
fi
ok "$(docker --version | sed 's/,.*//'), $(docker compose version --short 2>/dev/null || echo compose)"

# ── 3. Your site and Supabase ────────────────────────────────────────────
step "3. Your site and your Supabase project"
# Values already saved are the defaults.
[ -n "$DOMAIN" ] || DOMAIN=$(env_get NEXT_PUBLIC_ROOT_DOMAIN)
[ -n "$SB_URL" ] || SB_URL=$(env_get NEXT_PUBLIC_SUPABASE_URL)
[ -n "$ANON_KEY" ] || ANON_KEY=$(env_get NEXT_PUBLIC_SUPABASE_ANON_KEY)
[ -n "$SERVICE_KEY" ] || SERVICE_KEY=$(env_get SUPABASE_SERVICE_ROLE_KEY)
[ -n "$DB_URL" ] || DB_URL=$(env_get DATABASE_URL)
[ -n "$ACME_EMAIL" ] || ACME_EMAIL=$(env_get PC_ACME_EMAIL)

if [ -n "$INTERACTIVE" ]; then
  say "  You need a Supabase project (supabase.com, the free plan works). Keep its"
  say "  dashboard open: each question says where to find the value."
fi

# The domain
while :; do
  [ -n "$INTERACTIVE" ] && ask DOMAIN "Domain of the site" "Like www.example.com. Its DNS A record must point to this server's IP address."
  DOMAIN=$(printf '%s' "$DOMAIN" | tr 'A-Z' 'a-z' | sed -e 's#^[a-z]*://##' -e 's#/.*$##' -e 's/:.*$//')
  if printf '%s' "$DOMAIN" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'; then break; fi
  [ -n "$INTERACTIVE" ] || die "Give the site's domain with --domain (like www.example.com)."
  warn "That is not a domain. Example: www.example.com"; DOMAIN=
done
ok "Domain: $DOMAIN"

# Check the Supabase values against Supabase itself. Keys go to curl in a
# file, never on the command line, so other users of the server cannot see them.
sb_status() { # url path key [admin]
  : > "$TMP/h"; chmod 600 "$TMP/h"
  printf 'apikey: %s\n' "$3" >> "$TMP/h"
  [ -n "${4:-}" ] && printf 'Authorization: Bearer %s\n' "$3" >> "$TMP/h"
  curl -sS -o /dev/null -m 15 -w '%{http_code}' -H "@$TMP/h" "$1$2" 2>/dev/null || printf '000'
}

while :; do
  if [ -n "$INTERACTIVE" ]; then
    ask SB_URL "Supabase Project URL" "Supabase > Project Settings > API (Data API) > Project URL. Looks like https://abcdefgh.supabase.co"
    ask ANON_KEY "Publishable key" "Project Settings > API Keys > publishable key (sb_publishable_...). The older \"anon\" key works too."
    ask SERVICE_KEY "Secret key" "Same page: the secret key (sb_secret_...). It stays on this server. Typing is hidden." secret
  fi
  SB_URL=$(printf '%s' "$SB_URL" | sed -e 's#/*$##')
  problem=
  if ! printf '%s' "$SB_URL" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]+)?$'; then problem="The Project URL should look like https://abcdefgh.supabase.co (nothing after .co)."
  elif [ -z "$ANON_KEY" ]; then problem="The publishable key is needed."
  elif [ -z "$SERVICE_KEY" ]; then problem="The secret key is needed."
  else
    case "$ANON_KEY" in sb_secret_*) problem="The publishable key you gave is a SECRET key. Put the publishable one (sb_publishable_...) there." ;; esac
    case "$SERVICE_KEY" in sb_publishable_*) problem="The secret key you gave is the publishable key. Use the secret one (sb_secret_...)." ;; esac
  fi
  if [ -z "$problem" ]; then
    code=$(sb_status "$SB_URL" /auth/v1/settings "$ANON_KEY")
    if [ "$code" = "000" ]; then problem="Supabase does not answer at $SB_URL. Check the URL, and that the project is not paused (open it in Supabase and click Restore)."
    elif [ "$code" != "200" ]; then problem="Supabase refuses the publishable key (HTTP $code). Copy it again; it must be from the same project as the URL."
    else
      code=$(sb_status "$SB_URL" '/auth/v1/admin/users?page=1&per_page=1' "$SERVICE_KEY" admin)
      [ "$code" = "200" ] || problem="Supabase refuses the secret key (HTTP $code). Copy it again from Project Settings > API Keys."
    fi
  fi
  [ -z "$problem" ] && break
  warn "$problem"
  [ -n "$INTERACTIVE" ] || die "Fix the Supabase values and run this again."
done
ok "Supabase answers and accepts both keys."

while :; do
  [ -n "$INTERACTIVE" ] && ask DB_URL "Database connection string" "Supabase > Connect (top bar) > \"Session pooler\". Copy it and replace [YOUR-PASSWORD] with your database password. Typing is hidden." secret
  problem=
  case "$DB_URL" in
    "") problem="The connection string is needed: it creates the tables and installs updates." ;;
    postgres://*|postgresql://*) ;;
    *) problem="The connection string must start with postgresql://" ;;
  esac
  case "$DB_URL" in *YOUR-PASSWORD*|*YOUR_PASSWORD*) problem="Replace [YOUR-PASSWORD] in the connection string with your database password (no brackets)." ;; esac
  case "$DB_URL" in *:6543/*) warn "This is the \"Transaction pooler\" (port 6543). The \"Session pooler\" (port 5432) is safer for updates." ;; esac
  [ -z "$problem" ] && break
  warn "$problem"
  [ -n "$INTERACTIVE" ] || die "Give a valid --database-url and run this again."
  DB_URL=
done

if [ -n "$INTERACTIVE" ] && [ -z "$ACME_EMAIL" ]; then
  ask ACME_EMAIL "Email for HTTPS certificate notices (optional, Enter to skip)" ""
fi

# DNS: only a warning. Caddy keeps trying until the domain points here.
SERVER_IP=$(curl -4 -fsS -m 8 https://api.ipify.org 2>/dev/null || true)
DNS_IPS=$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{ print $1 }' | sort -u | tr '\n' ' ')
if [ -z "$DNS_IPS" ]; then
  warn "$DOMAIN does not resolve yet. Add a DNS A record for it pointing to ${SERVER_IP:-this server's IP}. HTTPS starts by itself once it does."
elif [ -n "$SERVER_IP" ] && ! printf ' %s ' "$DNS_IPS" | grep -q " $SERVER_IP "; then
  warn "$DOMAIN points to $DNS_IPS, not to this server ($SERVER_IP). Change its DNS A record. HTTPS starts by itself once it points here."
else
  ok "$DOMAIN points to this server."
fi

# The other name (www. or bare) redirects to the main one, when it points here too.
case "$DOMAIN" in www.*) ALIAS=${DOMAIN#www.} ;; *) ALIAS="www.$DOMAIN" ;; esac
if [ -z "$(getent ahostsv4 "$ALIAS" 2>/dev/null)" ]; then ALIAS=; fi
# Only redirect between example.com and www.example.com, not sub.example.com.
case "$DOMAIN" in www.*) ;; *.*.*) ALIAS= ;; esac

# ── 4. Settings ──────────────────────────────────────────────────────────
step "4. Settings"
if [ ! -f "$ENV_FILE" ]; then
  printf '%s\n' "# Passive Coder CMS (self-hosted, one site). Written by selfhost/install.sh." \
    "# Keep this file private: it holds secret keys. Change a value, then run:" \
    "#   sudo sh $PC_DIR/install.sh" > "$ENV_FILE"
fi
chmod 600 "$ENV_FILE"
env_set NEXT_PUBLIC_CMS_MODE standalone
env_set NEXT_PUBLIC_SUPABASE_URL "$SB_URL"
env_set NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON_KEY"
env_set SUPABASE_SERVICE_ROLE_KEY "$SERVICE_KEY"
env_set NEXT_PUBLIC_ROOT_DOMAIN "$DOMAIN"
env_set NEXT_PUBLIC_APP_URL "https://$DOMAIN"
env_set DATABASE_URL "$DB_URL"
env_set PASSIVECODER_LICENCE_FILE /app/data/licence.json
made=0
# Secret keys are made once and never replaced: COURIER_SECRET_KEY unlocks
# saved payment keys, APP_SECRET signs links.
[ -n "$(env_get APP_SECRET)" ] || { env_set APP_SECRET "$(rand_b64)"; made=$((made + 1)); }
[ -n "$(env_get CRON_SECRET)" ] || { env_set CRON_SECRET "$(rand_hex 32)"; made=$((made + 1)); }
[ -n "$(env_get COURIER_SECRET_KEY)" ] || { env_set COURIER_SECRET_KEY "$(rand_b64)"; made=$((made + 1)); }
[ -n "$(env_get SETUP_TOKEN)" ] || { env_set SETUP_TOKEN "$(rand_hex 16)"; made=$((made + 1)); }
env_set PC_ACME_EMAIL "$ACME_EMAIL"
env_set PC_BUILD "$BUILD"
if [ -n "$BUILD" ]; then
  env_set PC_IMAGE passivecoder-cms:local
  env_set PC_CRON_IMAGE passivecoder-cron:local
else
  # A custom image (PC_IMAGE set when running this) is remembered.
  env_set PC_IMAGE "$PC_IMAGE"
  env_set PC_CRON_IMAGE "$PC_CRON_IMAGE"
fi
if [ "$made" -gt 0 ]; then ok "Saved $ENV_FILE (made $made new secret keys)"; else ok "Saved $ENV_FILE (secret keys kept)"; fi
note "Keep a copy of this file somewhere safe: without it, saved payment keys cannot be read."

mkdir -p "$PC_DIR/data" "$PC_DIR/backups"
# The app runs as user 1001 inside its container.
chown 1001:1001 "$PC_DIR/data"
chmod 700 "$PC_DIR/backups"

# Caddy: HTTPS for the domain, the other name redirects to it.
{
  if [ -n "$ACME_EMAIL" ]; then printf '{\n\temail %s\n}\n\n' "$ACME_EMAIL"; fi
  printf '%s {\n\tencode zstd gzip\n\treverse_proxy app:3000\n}\n' "$DOMAIN"
  if [ -n "$ALIAS" ]; then printf '\n%s {\n\tredir https://%s{uri} permanent\n}\n' "$ALIAS" "$DOMAIN"; fi
} > "$PC_DIR/Caddyfile"
chmod 644 "$PC_DIR/Caddyfile"
ok "HTTPS for $DOMAIN${ALIAS:+ (and $ALIAS, which redirects to it)}"

cat > "$PC_DIR/compose.yml" <<'EOF'
# Passive Coder CMS (self-hosted). Written by selfhost/install.sh: run that
# again rather than editing this file. Settings: .env next to this file.
name: passivecoder

services:
  app:
    image: ${PC_IMAGE}
    env_file: .env
    environment:
      NEXT_PUBLIC_CMS_MODE: standalone
      PASSIVECODER_LICENCE_FILE: /app/data/licence.json
    volumes:
      - ./data:/app/data
    ports:
      - "127.0.0.1:3000:3000"
    restart: unless-stopped

  cron:
    image: ${PC_CRON_IMAGE}
    env_file: .env
    environment:
      SITE_URL: http://app:3000
    depends_on:
      - app
    restart: unless-stopped

  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
    restart: unless-stopped

  # Daily database copy (backup.sh runs it). Not a long-running service.
  backup:
    image: postgres:17-alpine
    profiles: ["tools"]
    env_file: .env
    volumes:
      - ./backups:/backups
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        set -eu -o pipefail
        f=/backups/db-$$(date +%Y%m%d-%H%M%S).sql.gz
        pg_dump "$$DATABASE_URL" --no-owner --no-privileges --schema=public --schema=auth --schema=storage | gzip > "$$f.part"
        mv "$$f.part" "$$f"
        echo "saved $$f"

volumes:
  caddy_data:
  caddy_config:
EOF
chmod 644 "$PC_DIR/compose.yml"

cat > "$PC_DIR/backup.sh" <<'EOF'
#!/bin/sh
# Daily backup of Passive Coder CMS (run by /etc/cron.d/passivecoder):
# a copy of the database, and of the settings and data folder.
# Keeps the newest 14 of each in the backups folder.
set -eu
umask 077
cd "$(dirname "$0")"
stamp=$(date +%Y%m%d-%H%M%S)
docker compose --profile tools run --rm -T backup
tar -czf "backups/files-$stamp.tar.gz" .env data Caddyfile 2>/dev/null || true
for kind in db files; do
  ls -1t backups/$kind-*.gz 2>/dev/null | tail -n +15 | while IFS= read -r old; do rm -f "$old"; done
done
rm -f backups/*.part
echo "backup done: $stamp"
EOF
chmod 700 "$PC_DIR/backup.sh"

printf '%s\n' "# Passive Coder CMS: daily backup at 03:30 (server time). Written by install.sh." \
  "30 3 * * * root /bin/sh $PC_DIR/backup.sh >> $PC_DIR/backups/backup.log 2>&1" > /etc/cron.d/passivecoder
chmod 644 /etc/cron.d/passivecoder
ok "Daily backup at 03:30 into $PC_DIR/backups (newest 14 kept)."

# ── 5. The app ───────────────────────────────────────────────────────────
step "5. Getting the app"
cd "$PC_DIR"
if [ -n "$BUILD" ]; then
  if [ -d src/.git ]; then git -C src pull --ff-only -q || die "Could not update the code in $PC_DIR/src."
  else git clone -q --depth 1 --branch "$PC_BRANCH" "$PC_REPO" src || die "Could not download the code from $PC_REPO."; fi
  note "Building the app here. This takes 10 to 25 minutes."
  # The ready-made kind of build: settings go in when it starts, so changing
  # one later never needs a new build.
  docker build --build-arg PC_GENERIC=1 --target runner -t passivecoder-cms:local src || die "The build did not finish. If the messages say \"Killed\" or \"out of memory\", the server needs more memory (about 8 GB)."
  docker build --target cron -t passivecoder-cron:local src >/dev/null || die "Could not build the scheduled-jobs image."
else
  docker compose pull -q app cron caddy || die "Could not download the app image ($PC_IMAGE). Check the internet connection, or build it here instead: run this again with --build (needs about 8 GB of memory)."
fi
docker compose --profile tools pull -q backup >/dev/null 2>&1 || true
ok "App ready."

# Keep this script and the updater next to the install, for later: from the
# file that is running when there is one, otherwise from the app image.
self_copied=
if [ -f "$0" ] && grep -q 'one-command install on a server' "$0" 2>/dev/null; then
  self=$(cd "$(dirname "$0")" && pwd)/$(basename "$0")
  [ "$self" = "$PC_DIR/install.sh" ] || cp "$0" "$PC_DIR/install.sh"
  self_copied=1
fi
for f in install.sh update.sh; do
  [ "$f" = install.sh ] && [ -n "$self_copied" ] && continue
  if docker compose run --rm --no-deps -T app cat "selfhost/$f" > "$TMP/$f" 2>/dev/null && [ -s "$TMP/$f" ]; then cp "$TMP/$f" "$PC_DIR/$f"; fi
done
chmod 700 "$PC_DIR"/*.sh 2>/dev/null || true

# ── 6. Database ──────────────────────────────────────────────────────────
step "6. Database"
db_ready=
tries=0
while [ $tries -lt 3 ]; do
  tries=$((tries + 1))
  if docker compose run --rm --no-deps -T app node selfhost/setup-db.mjs --if-empty \
    && docker compose run --rm --no-deps -T app node selfhost/migrate.mjs; then
    db_ready=1; break
  fi
  warn "The database step did not work (the reason is above)."
  if [ -n "$INTERACTIVE" ] && confirm "Enter the connection string again?"; then
    ask DB_URL "Database connection string" "Supabase > Connect > \"Session pooler\", with your database password in place of [YOUR-PASSWORD]." secret
    env_set DATABASE_URL "$DB_URL"
  else
    break
  fi
done
if [ -n "$db_ready" ]; then ok "Database ready."
else warn "Going on without it. The web installer's system check shows what to fix, and has a button to load the database."; fi

# ── 7. Start ─────────────────────────────────────────────────────────────
step "7. Starting the site"
docker compose up -d --remove-orphans --force-recreate app cron caddy || die "The site did not start. See: docker compose -f $PC_DIR/compose.yml logs app"
note "Waiting for the app to answer..."
i=0; code=000
while [ $i -lt 90 ]; do
  code=$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1:3000/setup 2>/dev/null || printf '000')
  case "$code" in 2*|3*|4*) break ;; esac
  i=$((i + 1)); sleep 2
done
case "$code" in 2*|3*|4*) ok "The app is running." ;; *) die "The app does not answer after 3 minutes. See what it says: docker compose -f $PC_DIR/compose.yml logs --tail 50 app" ;; esac

https_ok=
hc=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "https://$DOMAIN/setup" 2>/dev/null || printf '000')
case "$hc" in 2*|3*|4*) https_ok=1; ok "HTTPS works: https://$DOMAIN" ;; *) warn "HTTPS is not ready yet. It starts by itself within a few minutes once $DOMAIN points to this server." ;; esac

TOKEN=$(env_get SETUP_TOKEN)
say ""
say "${G}${B}Done. Finish in your browser:${N}"
say ""
if [ -n "$HIDE_CODE" ]; then
  say "  ${B}https://$DOMAIN/setup${N}"
  say ""
  say "  Setup code: the SETUP_TOKEN line in $PC_DIR/.env (not shown here)."
else
  say "  ${B}https://$DOMAIN/setup#code=$TOKEN${N}"
  say ""
  say "  Setup code (if it asks): ${B}$TOKEN${N}"
fi
[ -n "$https_ok" ] || say "  (Works once HTTPS is ready; until then this server only answers on port 80/443 for $DOMAIN.)"
say ""
say "  Install folder:  $PC_DIR   (settings: .env, backups: backups/)"
say "  Update later:    sudo sh $PC_DIR/update.sh"
say "  Change settings: edit $PC_DIR/.env, then: sudo sh $PC_DIR/install.sh"
say "  See the logs:    docker compose -f $PC_DIR/compose.yml logs -f app"
