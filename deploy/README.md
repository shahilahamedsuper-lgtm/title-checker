# Production Deployment Guide

React (Vite) + Express + Nginx — single domain, two deployment paths.

---

## Folder Structure

```
deploy/
├── backend/
│   ├── server.js          # Express app
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   └── App.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   ├── nginx.conf         # Nginx config inside Docker container
│   └── Dockerfile
├── nginx/
│   ├── myapp.conf         # Nginx config for bare-metal VPS
│   └── ecosystem.config.js  # PM2 config
├── docker-compose.yml
└── README.md              # ← you are here
```

---

## Option A — Docker (recommended, one command)

### Prerequisites
- Docker ≥ 24
- Docker Compose ≥ 2.20

### Run

```bash
cd deploy
docker compose up --build -d
```

Open **http://localhost** — done.

### How it works

```
Browser → :80 (Nginx in frontend container)
              ├── /          → serves React build from /usr/share/nginx/html
              └── /api/*     → proxies to backend:5000 (Docker internal network)
```

### Stop

```bash
docker compose down
```

### Rebuild after code changes

```bash
docker compose up --build -d
```

---

## Option B — Bare-metal Ubuntu VPS

### 1. Server setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### 2. Deploy code

```bash
# Create app directory
sudo mkdir -p /var/www/myapp
sudo chown $USER:$USER /var/www/myapp

# Copy project files (from your local machine)
scp -r deploy/backend  user@YOUR_SERVER_IP:/var/www/myapp/
scp -r deploy/frontend user@YOUR_SERVER_IP:/var/www/myapp/

# On the server — install backend dependencies
cd /var/www/myapp/backend
npm ci --omit=dev

# Build the frontend
cd /var/www/myapp/frontend
npm ci
npm run build
# Build output is now at /var/www/myapp/frontend/dist
```

### 3. Start the backend with PM2

```bash
cd /var/www/myapp
pm2 start nginx/ecosystem.config.js
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

### 4. Configure Nginx

```bash
# Copy the Nginx site config
sudo cp /var/www/myapp/nginx/myapp.conf /etc/nginx/sites-available/myapp

# Edit the domain name
sudo nano /etc/nginx/sites-available/myapp
# Change: server_name myapp.com www.myapp.com;
# to your actual domain or server IP

# Enable the site
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/

# Remove the default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Open your domain

Navigate to **http://YOUR_SERVER_IP** or **http://myapp.com**

---

## Option C — HTTPS with Let's Encrypt (after Option B)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d myapp.com -d www.myapp.com

# Certbot auto-edits your Nginx config and sets up auto-renewal
# Verify renewal works
sudo certbot renew --dry-run
```

After this, **https://myapp.com** works automatically.

---

## Local Development (no Docker)

### Backend

```bash
cd deploy/backend
cp .env.example .env
npm install
npm run dev          # nodemon, auto-restarts on changes
# Runs on http://localhost:5000
```

### Frontend

```bash
cd deploy/frontend
cp .env.example .env
npm install
npm run dev          # Vite dev server with /api proxy to :5000
# Runs on http://localhost:5173
```

The Vite dev proxy forwards all `/api/*` requests to `http://localhost:5000`, so no CORS issues during development.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the Express server listens on |
| `NODE_ENV` | `development` | Set to `production` in prod |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS origins (dev only) |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `` (empty) | API base URL. Empty = same-origin (production). Set to `http://localhost:5000` only if running frontend without a proxy. |

---

## Architecture

```
                    ┌─────────────────────────────────┐
                    │           Nginx :80/:443         │
                    │                                  │
  Browser ─────────►  /          → React build (dist) │
                    │  /api/*    → proxy → :5000       │
                    └──────────────────┬──────────────┘
                                       │
                              ┌────────▼────────┐
                              │  Express :5000  │
                              │  /api/hello     │
                              │  /api/health    │
                              └─────────────────┘
```

---

## Adding More API Routes

In `backend/server.js`:

```js
app.get("/api/users", (req, res) => {
  res.json([{ id: 1, name: "Alice" }]);
});
```

In `frontend/src/App.jsx`:

```js
const res = await fetch("/api/users");
const users = await res.json();
```

No CORS config needed — Nginx proxies everything under `/api/` to the backend.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `502 Bad Gateway` | Backend not running. Check `pm2 status` or `docker compose ps` |
| `404` on page refresh | Nginx `try_files` missing. Ensure `location /` block has `try_files $uri $uri/ /index.html` |
| CORS error in dev | Make sure Vite proxy is configured in `vite.config.js` |
| Port 80 already in use | `sudo lsof -i :80` then stop the conflicting process |
| SSL cert not renewing | `sudo certbot renew --dry-run` — check cron job with `sudo systemctl status certbot.timer` |
