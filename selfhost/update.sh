#!/bin/sh
# Passive Coder CMS (self-hosted): update an install made by install.sh.
#
#   sudo sh /opt/passivecoder/update.sh             new version + database updates
#   sudo sh /opt/passivecoder/update.sh --restart   only restart (after editing .env)
#
# Steps: backup of the database, new app version (downloaded, or built here
# when the install was made with --build), database updates, restart, and a
# check that the site answers. If the database step fails, the site keeps
# running the old version.
#
# Written for POSIX sh (dash): no bash needed.

set -eu
umask 077

PC_DIR=${PC_DIR:-$(cd "$(dirname "$0")" && pwd)}
RESTART_ONLY=
SKIP_BACKUP=
while [ $# -gt 0 ]; do
  case "$1" in
    --restart) RESTART_ONLY=1; shift ;;
    --no-backup) SKIP_BACKUP=1; shift ;;
    --dir) PC_DIR=${2:-}; shift 2 ;;
    --help|-h) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$1" >&2; exit 2 ;;
  esac
done

if [ -t 1 ]; then B=$(printf '\033[1m'); G=$(printf '\033[32m'); Y=$(printf '\033[33m'); R=$(printf '\033[31m'); N=$(printf '\033[0m'); else B=; G=; Y=; R=; N=; fi
step() { printf '\n%s== %s%s\n' "$B" "$*" "$N"; }
ok()   { printf '  %sok%s    %s\n' "$G" "$N" "$*"; }
warn() { printf '  %swarn%s  %s\n' "$Y" "$N" "$*"; }
die()  { printf '\n%sStopped:%s %s\n' "$R" "$N" "$*" >&2; exit 1; }

[ "$(id -u)" = "0" ] || die "Run this as root: sudo sh $0"
[ -f "$PC_DIR/.env" ] && [ -f "$PC_DIR/compose.yml" ] || die "No install found in $PC_DIR. Install first with selfhost/install.sh, or pass --dir."
cd "$PC_DIR"
env_get() { sed -n "s/^$1=//p" .env | tail -n 1 | sed -e "s/^'\(.*\)'\$/\1/" -e 's/^"\(.*\)"$/\1/'; }
BUILD=$(env_get PC_BUILD)

wait_up() {
  i=0
  while [ $i -lt 90 ]; do
    code=$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1:3000/setup 2>/dev/null || printf '000')
    case "$code" in 2*|3*|4*) return 0 ;; esac
    i=$((i + 1)); sleep 2
  done
  return 1
}

if [ -n "$RESTART_ONLY" ]; then
  step "Restarting with the settings in .env"
  docker compose up -d --force-recreate app cron caddy
  wait_up && ok "The site is running." || die "The app does not answer. See: docker compose -f $PC_DIR/compose.yml logs --tail 50 app"
  exit 0
fi

if [ -z "$SKIP_BACKUP" ]; then
  step "1. Backup"
  if sh ./backup.sh; then ok "Backup saved in $PC_DIR/backups."
  else warn "The backup did not work (see above). Going on; stop now with Ctrl+C if you want to fix that first."; sleep 5; fi
fi

step "2. New version"
if [ -n "$BUILD" ]; then
  [ -d src/.git ] || die "The code folder $PC_DIR/src is missing. Run install.sh again with --build."
  git -C src pull --ff-only -q || die "Could not update the code in $PC_DIR/src (were files changed there?)."
  docker build --build-arg PC_GENERIC=1 --target runner -t passivecoder-cms:local src || die "The build did not finish. The site still runs the old version."
  docker build --target cron -t passivecoder-cron:local src >/dev/null || die "Could not build the scheduled-jobs image."
else
  docker compose pull -q app cron caddy || die "Could not download the new version. The site still runs the old one."
fi
docker compose --profile tools pull -q backup >/dev/null 2>&1 || true
ok "New version ready."

step "3. Database updates"
# Runs from the NEW image (it carries the new migrations), before the switch.
docker compose run --rm --no-deps -T app node selfhost/migrate.mjs || die "The database update failed (see above). The site still runs the old version; nothing else was changed."
ok "Database up to date."

step "4. Restart"
docker compose up -d --remove-orphans --force-recreate app cron caddy
wait_up && ok "The site is running the new version." || die "The app does not answer. See: docker compose -f $PC_DIR/compose.yml logs --tail 50 app"

# Newer scripts from the new version, for next time.
TMP=$(mktemp -d)
for f in install.sh update.sh; do
  if docker compose run --rm --no-deps -T app cat "selfhost/$f" > "$TMP/$f" 2>/dev/null && [ -s "$TMP/$f" ]; then cp "$TMP/$f" "$PC_DIR/$f.new" && mv "$PC_DIR/$f.new" "$PC_DIR/$f"; fi
done
rm -rf "$TMP"
chmod 700 "$PC_DIR"/*.sh 2>/dev/null || true
docker image prune -f >/dev/null 2>&1 || true
printf '\n%sUpdated.%s\n' "$G$B" "$N"
