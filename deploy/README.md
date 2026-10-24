# ATELIER server deployment

Current deployment model: **pull-based deployment from GitHub**.

```text
GitHub main
   │  api.github.com (commit check, ETag)
   │  codeload.github.com (source tarball)
   ▼
/srv/atelier
   ├─ auto-deploy timer (every 2 min)
   ├─ Docker image atelier:<commit>
   ├─ docker compose -> app on 127.0.0.1:3000
   ├─ ./data/atelier.db   (persistent SQLite)
   └─ ./backups/*.db      (daily + pre-deploy)
```

This avoids storing SSH deployment secrets in GitHub and works on servers whose
network can reach `api.github.com` and `codeload.github.com` but not `github.com`.

## Server prerequisites

- Linux x86_64, Docker Engine + Compose plugin
- `curl`, `jq`, `sqlite3`, `tar`, `flock`
- `/srv/atelier` with at least a few GB of free disk

Docker Hub is not directly reachable from this environment; the daemon is configured
with the Tencent Cloud registry mirror:

```json
{ "registry-mirrors": ["https://mirror.ccs.tencentyun.com"] }
```

## Initial setup

1. Create directories and copy the deployment files:

```bash
mkdir -p /srv/atelier/{scripts,data,backups}
chown 1001:1001 /srv/atelier/data
chmod 700 /srv/atelier/backups
install -m 755 deploy/auto-deploy.sh /srv/atelier/scripts/auto-deploy.sh
install -m 755 deploy/backup.sh /srv/atelier/scripts/backup.sh
install -m 644 docker-compose.yml /srv/atelier/docker-compose.yml
```

2. Create `/srv/atelier/.env` with mode `600`. Required values:

```dotenv
APP_IMAGE=atelier:pending
BIND_ADDRESS=127.0.0.1
TZ=Asia/Shanghai
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=change-me-to-a-strong-password
SEED_INVITE_CODE=YOUR-INVITE-CODE
SITE_URL=https://your-domain.example
COOKIE_SECURE=true
DATABASE_PATH=/data/atelier.db
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=stable-32-byte-base64-key
```

3. Install systemd units:

```bash
install -m 644 deploy/atelier-deploy.service /etc/systemd/system/
install -m 644 deploy/atelier-deploy.timer /etc/systemd/system/
install -m 644 deploy/atelier-backup.service /etc/systemd/system/
install -m 644 deploy/atelier-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now atelier-deploy.timer atelier-backup.timer
```

4. Trigger the first deployment:

```bash
/srv/atelier/scripts/auto-deploy.sh
```

The first request to `/api/health` creates and seeds the SQLite database.

## Operations

```bash
# Manual deploy check
/srv/atelier/scripts/auto-deploy.sh

# Logs
cd /srv/atelier && docker compose logs -f app
journalctl -u atelier-deploy.service -n 100 --no-pager
systemctl list-timers 'atelier-*'

# Restart
cd /srv/atelier && docker compose restart app

# Backup now
/srv/atelier/scripts/backup.sh

# Retry the last failed commit
rm -f /srv/atelier/.failed_sha
/srv/atelier/scripts/auto-deploy.sh
```

## Restore a backup

```bash
cd /srv/atelier
docker compose stop app
cp backups/atelier-YYYYMMDD-HHMMSS.db data/atelier.db
rm -f data/atelier.db-wal data/atelier.db-shm
docker compose start app
```

Always stop the application before replacing the database file.

## Domain + HTTPS later

For the temporary direct-IP phase the app binds `0.0.0.0:3000` and
`COOKIE_SECURE=false`. Once the domain passes ICP filing:

1. In 宝塔面板 create the site and reverse-proxy it to `http://127.0.0.1:3000`.
2. Enable Let's Encrypt SSL and force HTTPS.
3. Set `BIND_ADDRESS=127.0.0.1`, `SITE_URL=https://your-domain`, and
   `COOKIE_SECURE=true` in `/srv/atelier/.env`.
4. Recreate the container: `cd /srv/atelier && docker compose up -d`.
5. Close port 3000 in the Tencent Cloud firewall.

## Notes

- The app is intentionally a single instance. SQLite is not designed for multiple
  writers across multiple hosts.
- Builds happen on the server. Keep at least 2 GB of free memory or add swap.
- Keep `.env` out of the repository and never bake it into the image.
- Deployment scripts are server-managed copies. If you change them in the repo,
  reinstall them with `install` as shown above.
