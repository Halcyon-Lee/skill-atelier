# ATELIER deployment

## Current model: GitHub Actions

```text
push / merge to main
        │
        ▼
GitHub Actions
  ├─ Verify: npm ci + lint + typecheck + build
  ├─ Build & push image to ghcr.io/halcyon-lee/skill-atelier:<sha>
  └─ SSH deploy using a restricted key
        │
        ▼
Tencent Cloud server
  ├─ /usr/local/sbin/atelier-ci-deploy (forced command)
  ├─ docker login to GHCR with the job's short-lived token
  ├─ docker compose
  │    ├─ app: 127.0.0.1:3000 (not publicly exposed)
  │    └─ gateway: nginx on 0.0.0.0:80
  ├─ /srv/atelier/data/atelier.db
  └─ /srv/atelier/backups/*.db
```

A failing `Verify` prevents deployment. The server-side deploy receiver checks
`/api/health` through the Nginx gateway and rolls back to the previous image if the new version is unhealthy.

The old server-side polling deployment is kept as a fallback but its timer is disabled.

## Repository requirements

The repository has one required secret:

| Secret | Purpose |
| --- | --- |
| `DEPLOY_SSH_KEY` | Private key for the restricted deploy account |

The private key is generated outside the repository. On the developer machine it
lives at `~/.ssh/atelier_ci`; the corresponding public key is installed on the
server with this forced command:

```text
restrict,command="/usr/local/sbin/atelier-ci-deploy" ssh-ed25519 ... atelier-github-actions
```

The key cannot open a shell. It can only ask the server to deploy a full commit SHA.

The known host key is pinned in [`known_hosts`](known_hosts). If the server is
rebuilt, update that file with:

```bash
ssh-keyscan -t ed25519 <server-ip> > deploy/known_hosts
```

## Server requirements

- Linux x86_64
- Docker Engine + Compose plugin
- `curl`, `sqlite3`, `flock`
- `/srv/atelier` with several GB free
- SSH port reachable from GitHub Actions runners

Docker Hub is not directly reachable from this server; Docker is configured with
the Tencent Cloud registry mirror. GHCR is reachable directly.

## Server layout

```text
/srv/atelier/
├── .env                 # secrets, mode 600, never committed
├── docker-compose.yml
├── nginx.conf           # public HTTP gateway on port 80
├── data/atelier.db      # persistent
├── backups/             # daily + pre-deploy snapshots
├── scripts/
│   ├── auto-deploy.sh   # legacy fallback, timer disabled
│   └── backup.sh
└── .deployed_sha
```

The CI receiver is installed at:

```text
/usr/local/sbin/atelier-ci-deploy
```

## Operations

```bash
# Deploy: push or merge to main
git push origin main

# Re-run the latest workflow from GitHub Actions UI
# Actions -> CI/CD -> Run workflow

# Application + gateway logs
cd /srv/atelier && docker compose logs -f app gateway

# Current deployment
cat /srv/atelier/.deployed_sha
grep '^APP_IMAGE=' /srv/atelier/.env
docker ps --filter name=atelier-app

# Health through the public gateway
curl -fsS http://127.0.0.1/api/health

# Manual backup
/srv/atelier/scripts/backup.sh

# Backup timer
systemctl list-timers 'atelier-*'
```

If a deploy fails health checks, the receiver automatically re-creates the
previous image. Inspect Actions logs and `/srv/atelier/backups/`.

## Roll back manually

The previous image is still present locally. Set it explicitly:

```bash
cd /srv/atelier
PREVIOUS=$(docker images 'ghcr.io/halcyon-lee/skill-atelier' --format '{{.Repository}}:{{.Tag}}' | grep -v latest | head -2 | tail -1)
sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$PREVIOUS|" .env
docker compose up -d --no-build
curl -fsS http://127.0.0.1/api/health
```

## Restore a database backup

```bash
cd /srv/atelier
docker compose stop app
cp backups/atelier-YYYYMMDD-HHMMSS.db data/atelier.db
rm -f data/atelier.db-wal data/atelier.db-shm
docker compose start app
```

Always stop the application before replacing the database file.

## Legacy fallback

The original pull-based deployment still exists on the server and builds locally
from a GitHub source tarball:

```bash
# Enable fallback polling (only if GitHub Actions cannot reach the server)
systemctl enable --now atelier-deploy.timer

# Manually deploy the latest main
/srv/atelier/scripts/auto-deploy.sh

# Disable fallback again once Actions is healthy
systemctl disable --now atelier-deploy.timer
```

Do not run the poller and Actions at the same time; both use the same deployment
lock, but the fallback should remain disabled during normal operation.

## Domain + HTTPS later

In the current direct-IP phase the app binds `127.0.0.1:3000`, the Docker Nginx
gateway listens on port 80, and `COOKIE_SECURE=false`.

Once the domain passes ICP filing:

1. Point the domain's A record at the server.
2. Add a port 443 server block to `/srv/atelier/nginx.conf`, with the certificate
   and key mounted into the gateway, and redirect port 80 to HTTPS.
3. Set `SITE_URL=https://your-domain` and `COOKIE_SECURE=true` in `/srv/atelier/.env`.
4. `cd /srv/atelier && docker compose up -d --force-recreate app && docker compose restart gateway`.
5. Keep only 80 and 443 public; port 3000 is already bound to loopback.
6. Add the ICP number to the site footer as required.

## Notes

- The app is intentionally a single instance. SQLite is not designed for multiple
  writers across multiple hosts.
- Repository secrets are available to workflows in this repository. Give write
  access only to trusted collaborators; external contributors should use fork PRs.
- Direct pushes to `main` deploy automatically. If you want to prevent broken
  builds from entering `main`, protect the branch with a required `Verify` check
  (PR with 0 required approvals is enough).
- The edge is a Docker Nginx container with host networking. Do not start another
  web server on port 80 while it is running.
- Keep `.env` out of the repository and never bake it into the Docker image.
