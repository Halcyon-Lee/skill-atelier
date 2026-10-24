#!/usr/bin/env bash
set -Eeuo pipefail

# Pull-based deployment for ATELIER.
# GitHub's web/git endpoints are unreliable from this network, but api.github.com
# and codeload.github.com are reachable. Poll the public repository, build only
# when main changes, then health-check and roll back on failure.

REPO_OWNER="Halcyon-Lee"
REPO_NAME="skill-atelier"
BRANCH="main"

APP_DIR="/srv/atelier"
ENV_FILE="$APP_DIR/.env"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"
STATE_FILE="$APP_DIR/.deployed_sha"
FAILED_FILE="$APP_DIR/.failed_sha"
ETAG_FILE="$APP_DIR/.github_etag"
LOCK_FILE="$APP_DIR/.deploy.lock"
BUILD_ROOT="$APP_DIR/.builds"
HEALTH_URL="http://127.0.0.1:3000/api/health"

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

die() {
  log "ERROR: $*"
  exit 1
}

[ -f "$ENV_FILE" ] || die "$ENV_FILE is missing"
[ -f "$COMPOSE_FILE" ] || die "$COMPOSE_FILE is missing"
mkdir -p "$BUILD_ROOT" "$APP_DIR/backups"

exec 9>"$LOCK_FILE"
flock -n 9 || {
  log "Another deployment is already running"
  exit 0
}

for command in curl jq tar docker sqlite3; do
  command -v "$command" >/dev/null || die "Required command not found: $command"
done
docker compose version >/dev/null || die "docker compose plugin is missing"

headers=$(mktemp)
response=$(mktemp)
trap 'rm -f "$headers" "$response"' EXIT

request_args=(
  -sS
  --max-time 30
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: 2022-11-28"
  -H "User-Agent: atelier-auto-deploy"
)
if [ -f "$ETAG_FILE" ]; then
  request_args+=(-H "If-None-Match: $(cat "$ETAG_FILE")")
fi

http_code=$(
  curl "${request_args[@]}" -D "$headers" -o "$response" -w "%{http_code}" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/commits/$BRANCH"
) || die "Could not reach GitHub API"

if [ "$http_code" = "304" ]; then
  log "No new commit on $BRANCH"
  exit 0
fi

if [ "$http_code" != "200" ]; then
  log "GitHub API returned HTTP $http_code"
  head -c 500 "$response" >&2 || true
  exit 1
fi

etag=$(awk -F': ' 'tolower($1) == "etag" { gsub("\r", "", $2); value=$2 } END { print value }' "$headers")
if [ -n "$etag" ]; then
  printf '%s\n' "$etag" > "$ETAG_FILE"
fi

sha=$(jq -r '.sha // empty' "$response")
[ -n "$sha" ] || die "Could not read the latest commit SHA"
short="${sha:0:12}"

if [ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE")" = "$sha" ]; then
  log "Commit $short is already deployed"
  exit 0
fi

if [ -f "$FAILED_FILE" ] && [ "$(cat "$FAILED_FILE")" = "$sha" ]; then
  log "Commit $short previously failed; waiting for a newer commit"
  exit 0
fi

image="atelier:$short"
build_dir="$BUILD_ROOT/$short"
previous_image=$(sed -n 's/^APP_IMAGE=//p' "$ENV_FILE" | tail -1)
previous_image_available=0
if [ -n "$previous_image" ] && docker image inspect "$previous_image" >/dev/null 2>&1; then
  previous_image_available=1
fi

log "Deploying $short from GitHub"
rm -rf "$build_dir"
mkdir -p "$build_dir"

if ! curl -fsS --max-time 300 -L \
  "https://codeload.github.com/$REPO_OWNER/$REPO_NAME/tar.gz/$sha" \
  | tar -xz -C "$build_dir" --strip-components=1; then
  rm -rf "$build_dir"
  printf '%s\n' "$sha" > "$FAILED_FILE"
  die "Source download failed"
fi

if [ ! -f "$build_dir/Dockerfile" ]; then
  rm -rf "$build_dir"
  printf '%s\n' "$sha" > "$FAILED_FILE"
  die "Downloaded source does not contain a Dockerfile"
fi

if ! DOCKER_BUILDKIT=1 docker build -t "$image" "$build_dir"; then
  rm -rf "$build_dir"
  printf '%s\n' "$sha" > "$FAILED_FILE"
  die "Docker build failed; the previous version is still running"
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
rm -rf "$build_dir"
log "Deployment healthy: $image"

# Keep the three most recent application images.
docker images --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' \
  | awk '$1 ~ /^atelier:/ { print }' \
  | sort -k2,3 -r \
  | tail -n +4 \
  | awk '{ print $1 }' \
  | while read -r old_image; do
      if [ "$old_image" != "$image" ] && [ "$old_image" != "${previous_image:-}" ]; then
        docker image rm "$old_image" >/dev/null 2>&1 || true
      fi
    done

# Remove abandoned build directories from older failed attempts.
find "$BUILD_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

log "Done"
