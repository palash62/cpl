# LeadFlow CPL Platform — GoDaddy VPS Deployment

**Target:** GoDaddy VPS · Ubuntu 22.04+ · MySQL 8 · Node.js 20 · Nginx · PM2

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| VPS RAM | 2 GB minimum (4 GB recommended) |
| OS | Ubuntu 22.04 LTS |
| Node.js | 20 LTS |
| MySQL | 8.0+ |
| Domain | Pointed to VPS IP |

---

## 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Install PM2 globally
sudo npm install -g pm2
```

---

## 2. MySQL Database

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE leadflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'leadflow'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON leadflow.* TO 'leadflow'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Connection string:**

```
DATABASE_URL="mysql://leadflow:your-strong-password@localhost:3306/leadflow"
```

---

## 3. Application Deploy

```bash
# Clone repository
cd /var/www
sudo git clone <your-repo-url> leadflow
cd leadflow
sudo chown -R $USER:$USER /var/www/leadflow

# Install dependencies
npm ci

# Environment
cp .env.example .env
nano .env
```

**Required `.env` on VPS:**

```env
DATABASE_URL="mysql://leadflow:PASSWORD@localhost:3306/leadflow"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

```bash
# Database migrate and seed
npx prisma db push
npm run db:seed

# Production build
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 4. Nginx Reverse Proxy

Copy [`deploy/nginx.conf`](deploy/nginx.conf) to `/etc/nginx/sites-available/leadflow`:

```bash
sudo ln -s /etc/nginx/sites-available/leadflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot auto-renews. Verify:

```bash
sudo certbot renew --dry-run
```

---

## 6. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 7. PM2 Process Manager

See [`ecosystem.config.js`](../ecosystem.config.js):

| Command | Purpose |
|---------|---------|
| `pm2 status` | Check app health |
| `pm2 logs leadflow` | View logs |
| `pm2 restart leadflow` | Restart after deploy |
| `pm2 monit` | Live monitoring |

---

## 8. Deploy Updates

```bash
cd /var/www/leadflow
git pull origin main
npm ci
npx prisma db push
npm run build
pm2 restart leadflow
```

---

## 9. Smoke Tests (Post-Deploy)

```bash
# Health check
curl -I https://yourdomain.com/login

# Login verification (from project root)
npm run test:smoke
```

Expected: HTTP 200 on `/login`, all seed accounts authenticate.

---

## 10. Backup

```bash
# Daily MySQL backup (add to crontab)
0 2 * * * mysqldump -u leadflow -p'PASSWORD' leadflow > /backups/leadflow-$(date +\%Y\%m\%d).sql
```

---

## 11. Troubleshooting

| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | Check `pm2 status`; ensure app on port 3000 |
| DB connection refused | Verify MySQL running: `sudo systemctl status mysql` |
| Auth redirect loop | Ensure `AUTH_URL` matches public HTTPS URL |
| Slow first load | Normal after deploy; Turbopack not used in production |

---

## Architecture on VPS

```
Internet → Nginx (443) → PM2 → Next.js (3000) → Prisma → MySQL (3306)
```
