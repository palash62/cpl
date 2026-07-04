# Production deploy — leadvix.io + leadgenlink.site

## Domains

| Domain | App | Port |
|--------|-----|------|
| http://leadvix.io | `apps/platform` | 3000 |
| http://leadgenlink.site | `apps/tracking` | 3001 |

## Flow (no build on server)

1. **GitHub Actions** (or your laptop) runs `deploy/build-production.sh`
2. Built `.next` folders are **rsynced** to the server
3. Server runs `deploy/server-pull-run.sh` — `git pull`, `npm ci`, **PM2 restart only**

`.next` is not in git — only built artifacts are copied.

## One-time server setup

```bash
# On AWS EC2 (ubuntu@65.0.21.180)
git clone https://github.com/palash62/cpl.git
cd cpl
bash deploy/env-production.sh
# Edit apps/platform/.env and apps/tracking/.env — set real DATABASE_URL, AUTH_SECRET, INTERNAL_SERVICE_TOKEN

# DNS: point leadvix.io and leadgenlink.site to server IP
# Nginx + PM2 installed via server-pull-run.sh

sudo apt install -y nginx
npm i -g pm2
```

## GitHub Actions secrets (for auto-deploy on push to master)

| Secret | Example |
|--------|---------|
| `DEPLOY_HOST` | `65.0.21.180` |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_KEY` | contents of `cpl.pem` |
| `DEPLOY_PATH` | `/home/ubuntu/cpl` |

## Manual deploy from your Mac

```bash
bash deploy/build-production.sh
DEPLOY_SSH_HOST=AWS-CPL bash deploy/push-to-server.sh
```

Uses `~/.ssh/config` host `AWS-CPL`.

## Server update only (after CI already built)

```bash
cd /home/ubuntu/cpl
bash deploy/server-pull-run.sh
```

## Local domain test (same machine)

```bash
bash deploy/run-domains.sh
```

Adds `/etc/hosts` entries and nginx for HTTP domains.
