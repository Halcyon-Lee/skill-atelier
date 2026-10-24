#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# Invoked by OpenSSH as a forced command for the GitHub Actions deploy key.
# The client sends two lines on stdin: GitHub actor, then a short-lived GHCR token.
# The image reference is derived from a validated commit SHA.

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

APP_DIR="/srv/atelier"
ENV_FILE="$APP_DIR/.env"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"
STATE_FILE="$APP_DIR/.deployed_sha"
FAILED_FILE="$APP_DIR/.failed_sha"
LOCK_FILE="$APP_DIR/.deploy.lock"
HEALTH_URL="http://127.0.0.1:80/api/health"
IMAGE_REPO="ghcr.io/halcyon-lee/skill-atelier"

log() {
  printf '[ci-deploy %s] %s\n' "$(date '+%F %T')" "$*" >&2
}

die() {
  log "ERROR: $*"
  exit 1
}

command_text="${SSH_ORIGINAL_COMMAND:-}"
if [[ ! "$command_text" =~ ^deploy[[:space:]]+([0-9a-f]{40})$ ]]; then
  log "Rejected: this key only accepts 'deploy <full commit sha>'."
  exit 64
fi
sha="${BASH_REMATCH[1]}"
image="$IMAGE_REPO:$sha"

IFS= read -r ghcr_user || true
IFS= read -r ghcr_token || true
[[ "$ghcr_user" =~ ^[A-Za-z0-9-]{1,39}$ ]] || die "Invalid GHCR username"
[ "${#ghcr_token}" -ge 20 ] || die "Missing GHCR token"

[ -f "$ENV_FILE" ] || die "$ENV_FILE is missing"
[ -f "$COMPOSE_FILE" ] || die "$COMPOSE_FILE is missing"

for required in docker curl sqlite3; do
  command -v "$required" >/dev/null || die "Required command missing: $required"
done
docker compose version >/dev/null || die "docker compose plugin is missing"

exec 9>"$LOCK_FILE"
flock -w 600 9 || die "Another deployment is already running"

docker_config=$(mktemp -d)
cleanup() {
  rm -rf "$docker_config"
}
trap cleanup EXIT

export DOCKER_CONFIG="$docker_config"

log "Authenticating to GHCR as $ghcr_user"
if ! printf '%s' "$ghcr_token" | docker login ghcr.io -u "$ghcr_user" --password-stdin >/dev/null 2>&1; then
  die "GHCR authentication failed"
fi

log "Pulling $image"
if ! docker pull "$image"; then
  printf '%s\n' "$sha" > "$FAILED_FILE"
  die "Image pull failed; the running version was not changed"
fi

if [ "$(cat "$STATE_FILE" 2>/dev/null || true)" = "$sha" ]; then
  log "Commit ${sha:0:12} is already deployed"
  exit 0
fi

previous_image=$(sed -n 's/^APP_IMAGE=//p' "$ENV_FILE" | tail -1)
previous_image_available=0
if [ -n "$previous_image" ] && docker image inspect "$previous_image" >/dev/null 2>&1; then
  previous_image_available=1
fi

if [ -f "$APP_DIR/data/atelier.db" ]; then
  log "Creating a pre-deploy database backup"
  backup_path="$APP_DIR/backups/pre-deploy-$(date +%Y%m%d-%H%M%S).db"
  sqlite3 "$APP_DIR/data/atelier.db" ".backup '$backup_path'" \
    || log "WARNING: pre-deploy backup failed"
fi

if grep -q '^APP_IMAGE=' "$ENV_FILE"; then
  sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$image|" "$ENV_FILE"
else
  printf 'APP_IMAGE=%s\n' "$image" >> "$ENV_FILE"
fi
chmod 600 "$ENV_FILE"

restore_previous() {
  if [ "$previous_image_available" -eq 1 ] && [ "$previous_image" != "$image" ]; then
    log "Rolling back to $previous_image"
    sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$previous_image|" "$ENV_FILE"
    (cd "$APP_DIR" && docker compose up -d --no-build --remove-orphans) || true
  else
    log "No previous image available for rollback"
  fi
}

log "Starting the new container"
if ! (cd "$APP_DIR" && docker compose up -d --no-build --remove-orphans); then
  restore_previous
  printf '%s\n' "$sha" > "$FAILED_FILE"
  die "Container failed to start"
fi

healthy=0
for _ in $(seq 1 45); do
  if curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1; then
    healthy=1
    break
  fi
  sleep 2
done

if [ "$healthy" -ne 1 ]; then
  log "Health check failed. Recent application logs:"
  (cd "$APP_DIR" && docker compose logs --tail=80 app) >&2 || true
  restore_previous
  printf '%s\n' "$sha" > "$FAILED_FILE"
  die "Deployment failed its health check"
fi

printf '%s\n' "$sha" > "$STATE_FILE"
rm -f "$FAILED_FILE"
log "Deployment healthy: $image"
log "Done"
