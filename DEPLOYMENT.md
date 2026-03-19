# Deployment Guide

This guide covers multiple ways to deploy the Agentation MCP server so it's always available.

## Option 1: Railway (Recommended) 🚀

Railway provides persistent servers with automatic HTTPS.

### Prerequisites
- Railway account (https://railway.app)
- Railway CLI installed (`npm i -g @railway/cli`)

### Deployment Steps

```bash
# Login to Railway
railway login

# Initialize Railway in project
cd opencode-agentation-mcp
railway init

# Deploy
railway up

# Get public URL
railway domain
```

### Environment Variables

Set these in Railway dashboard:
- `PORT`: 4747
- `AGENTATION_STORE`: sqlite (for persistence)

### Auto-Deployment

Railway automatically deploys when you push to GitHub.

---

## Option 2: Render 🌥️

Render provides free tier with persistent disk.

### Prerequisites
- Render account (https://render.com)

### Deployment Steps

1. Go to https://render.com/blueprints
2. Connect your GitHub repository
3. Create a new Web Service
4. Configure:
   - **Root Directory**: (leave empty)
   - **Build Command**: `npm install -g agentation-mcp`
   - **Start Command**: `npx agentation-mcp server --port $PORT`
   - **Plan**: Free

5. Add Environment Variable:
   - `PORT`: 4747

6. Click "Create Web Service"

### Auto-Deployment

Render automatically deploys on every push to GitHub.

---

## Option 3: Docker Compose (Self-Hosted) 🐳

Run on your own server or local machine.

### Prerequisites
- Docker installed
- Docker Compose installed

### Deployment Steps

```bash
# Clone the repository
git clone https://github.com/siddheshbmane/opencode-agentation-mcp.git
cd opencode-agentation-mcp

# Start the server
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop server
docker-compose down
```

### Access

- Local: http://localhost:4747
- Network: http://YOUR_IP:4747

### Persistence

Data is stored in SQLite by default. To persist:
- Create a volume mount in docker-compose.yml
- Or use PostgreSQL/MySQL with `AGENTATION_STORE` variable

---

## Option 4: Docker (Single Container) 🐳

Run a single Docker container.

### Prerequisites
- Docker installed

### Deployment Steps

```bash
# Pull and run
docker run -d \
  --name agentation-mcp \
  -p 4747:4747 \
  --restart unless-stopped \
  siddheshbmane/opencode-agentation-mcp:latest

# Check status
docker ps

# View logs
docker logs -f agentation-mcp

# Stop
docker stop agentation-mcp
docker rm agentation-mcp
```

### Build Your Own Image

```bash
# Build image
docker build -t agentation-mcp .

# Run
docker run -d -p 4747:4747 --name agentation-mcp agentation-mcp
```

---

## Option 5: Railway CLI (Direct) 🚂

Deploy directly from the CLI.

### Prerequisites
- Railway CLI installed
- Railway account

### Deployment Steps

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd opencode-agentation-mcp
railway init

# Deploy
railway up

# Set environment variables
railway variables set PORT=4747
railway variables set AGENTATION_STORE=sqlite

# Get public URL
railway domain
```

---

## Option 6: Always-On Local Server 🏠

Keep the server running locally all the time.

### Using systemd (Linux)

```bash
# Create service file
sudo nano /etc/systemd/system/agentation-mcp.service
```

Add content:
```ini
[Unit]
Description=Agentation MCP Server
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/opencode-agentation-mcp
ExecStart=/usr/bin/npx agentation-mcp server --port 4747
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable agentation-mcp
sudo systemctl start agentation-mcp
sudo systemctl status agentation-mcp
```

### Using launchd (macOS)

```bash
# Create plist file
nano ~/Library/LaunchAgents/com.agentation.mcp.plist
```

Add content:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.agentation.mcp</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npx</string>
        <string>agentation-mcp</string>
        <string>server</string>
        <string>--port</string>
        <string>4747</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/agentation-mcp.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/agentation-mcp.log</string>
</dict>
</plist>
```

Enable:
```bash
launchctl load ~/Library/LaunchAgents/com.agentation.mcp.plist
launchctl start com.agentation.mcp
```

---

## Option 7: PM2 (Process Manager) ⚡

Use PM2 to keep the server running.

### Prerequisites
- PM2 installed (`npm install -g pm2`)

### Deployment Steps

```bash
# Install PM2
npm install -g pm2

# Start with PM2
cd opencode-agentation-mcp
pm2 start npx --name "agentation-mcp" -- agentation-mcp server --port 4747

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup

# View status
pm2 status

# View logs
pm2 logs agentation-mcp

# Restart
pm2 restart agentation-mcp

# Stop
pm2 stop agentation-mcp
```

### Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'agentation-mcp',
    script: 'npx',
    args: 'agentation-mcp server --port 4747',
    interpreter: 'none',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    exp_backoff_restart_delay: 100,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

Run:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Option 8: Always-On with Screen/Tmux 🖥️

Run in a persistent terminal session.

### Using Screen

```bash
# Create screen session
screen -S agentation-mcp

# Start server
npx agentation-mcp server --port 4747

# Detach: Ctrl+A, D

# Reattach
screen -r agentation-mcp

# List screens
screen -ls

# Kill session
screen -X -S agentation-mcp quit
```

### Using Tmux

```bash
# Create tmux session
tmux new -s agentation-mcp

# Start server
npx agentation-mcp server --port 4747

# Detach: Ctrl+B, D

# Reattach
tmux attach -t agentation-mcp

# List sessions
tmux ls

# Kill session
tmux kill-session -t agentation-mcp
```

---

## Connecting to Your Deployment

### Update Your Application

Once deployed, update your OpenCode MCP configuration:

```json
{
  "mcpServers": {
    "agentation": {
      "command": "npx",
      "args": ["-y", "agentation-mcp", "server", "--http-url", "https://YOUR-RAILWAY-URL.railway.app"]
    }
  }
}
```

Or use HTTP client directly:

```typescript
const client = new AgentationClient('https://YOUR-RAILWAY-URL.railway.app');
```

### Verify Deployment

```bash
# Check health
curl https://YOUR-URL/health

# Should return
{
  "status": "ok",
  "mode": "remote"
}
```

---

## Environment Variables

Common environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4747 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `AGENTATION_STORE` | sqlite | Storage backend |
| `AGENTATION_EVENT_RETENTION_DAYS` | 7 | Days to keep events |
| `DATABASE_URL` | - | Database connection string |

---

## Troubleshooting

### Server Not Starting

```bash
# Check logs
docker-compose logs
pm2 logs agentation-mcp
tail -f /tmp/agentation-mcp.log

# Check port availability
lsof -i :4747

# Check firewall
sudo ufw status
```

### Connection Refused

```bash
# Verify server is running
curl http://localhost:4747/health

# Check firewall rules
sudo iptables -L -n | grep 4747

# Check Cloudflare/Railway proxy
# Ensure port 4747 is not blocked
```

### Database Connection Issues

```bash
# For SQLite
ls -la ~/.agentation/store.db

# For PostgreSQL
psql $DATABASE_URL -c "SELECT 1"
```

---

## Auto-Deployment Setup

### GitHub Actions

Every push to `main` branch automatically deploys.

Workflow already configured in `.github/workflows/ci.yml`.

### Railway Auto-Deploy

1. Connect GitHub repo in Railway dashboard
2. Enable "Autodeploy" toggle
3. Every push deploys automatically

### Render Auto-Deploy

1. Connect GitHub repo in Render
2. Enable "Auto Deploy" toggle
3. Every push deploys automatically

---

## Security Considerations

### Production Checklist

- [ ] Use HTTPS (Railway/Render provide this)
- [ ] Set strong environment variables
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Use SQLite for local, PostgreSQL for production
- [ ] Regular backups of database
- [ ] Monitor server logs
- [ ] Set up alerts for downtime

### Recommended Settings

```bash
# Environment variables
PORT=4747
AGENTATION_STORE=postgresql
DATABASE_URL=postgresql://user:secure-password@host:5432/agentation
AGENTATION_EVENT_RETENTION_DAYS=30
```

---

## Monitoring

### Health Check Endpoint

```bash
# Local health check
curl http://localhost:4747/health

# Remote health check
curl https://YOUR-URL/health
```

### Server Status

```bash
# View server status
curl http://localhost:4747/status
```

### Real-Time Logs

```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs agentation-mcp

# systemd
journalctl -u agentation-mcp -f

# Screen/Tmux
tmux attach -t agentation-mcp
```

---

## Support

For deployment issues:
1. Check server logs
2. Verify environment variables
3. Test locally first
4. Open an issue on GitHub

---

**Status:** ✅ Deployment Configurations Ready
**Version:** 1.0.0
**Last Updated:** 2026-03-16
