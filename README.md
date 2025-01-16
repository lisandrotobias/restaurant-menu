# Restaurant Menu - Setup Guide

## Architecture Overview

### Infrastructure
- VPS hosting with Docker containerization
- Nginx reverse proxy
- Let's Encrypt SSL certificates
- SvelteKit application with Node.js backend
- Redis for menu caching

### Domain Structure
- Production URL: `menu.capybarasolutions.com`
- Restaurant-specific menus: `menu.capybarasolutions.com/r/{restaurantId}/menu`
- SSL: Enabled with auto-renewal
- DNS: A record pointing to VPS IP

## Directory Structure

```
/opt/apps/
├── nginx/
│   ├── conf.d/
│   │   └── restaurant-menu.conf
│   ├── certbot/
│   │   ├── conf/
│   │   └── www/
│   ├── docker-compose.yml
│   └── ssl-renew.sh
└── restaurant-menu/
    ├── docker-compose.yml
    ├── docker-compose.dev.yml
    ├── Dockerfile
    ├── .env.example
    └── [application files]
```

## Environment Configuration

Create a `.env` file based on `.env.example`:
```env
REDIS_URL=redis://localhost:6379
API_URL=http://localhost:8000
```

## Development Setup

Run the development container:
```bash
# Start the development server
docker-compose -f docker-compose.dev.yml up --build

# Stop the development server
docker-compose -f docker-compose.dev.yml down
```

The development server will be available at `http://localhost:3000`

## Technical Implementation

### Docker Configuration

#### Development Service
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  restaurant-menu:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: restaurant-menu-dev
    network_mode: "host"
    env_file:
      - .env
    environment:
      - NODE_ENV=development
    restart: unless-stopped
```

#### Production Service
```yaml
# docker-compose.yml
version: '3.8'
services:
  restaurant-menu:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: restaurant-menu
    expose:
      - "3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - ORIGIN=https://menu.capybarasolutions.com
    networks:
      - web
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  web:
    name: nginx-proxy
    external: true
```

### Nginx Configuration
```nginx
# /opt/apps/nginx/conf.d/restaurant-menu.conf
server {
    listen 80;
    server_name menu.capybarasolutions.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name menu.capybarasolutions.com;

    ssl_certificate /etc/letsencrypt/live/menu.capybarasolutions.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/menu.capybarasolutions.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://restaurant-menu:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL Certificate Management

SSL certificates are managed through Let's Encrypt with automatic renewal:

```bash
# /opt/apps/nginx/ssl-renew.sh
#!/bin/bash
COMPOSE="/usr/local/bin/docker-compose --no-ansi"
DOCKER="/usr/bin/docker"

cd /opt/apps/nginx/
$COMPOSE run certbot renew && $COMPOSE kill -s SIGHUP nginx
$DOCKER container prune -f
```

Renewal is scheduled via crontab to run every 12 hours:
```bash
0 */12 * * * /opt/apps/nginx/ssl-renew.sh >> /var/log/cron.log 2>&1
```

## API Integration

The application integrates with a backend API and uses Redis for caching:

- Menu endpoint: `{API_URL}/restaurants/{restaurantId}/menu`
- Restaurant info: `{API_URL}/restaurants/{restaurantId}`
- Cache keys:
  - Menu: `menu:{restaurantId}`
  - Restaurant info: `info:{restaurantId}`

## Maintenance

### Logs
```bash
# Development logs
docker-compose -f docker-compose.dev.yml logs -f

# Production logs
docker-compose logs -f

# Nginx logs
docker-compose -f /opt/apps/nginx/docker-compose.yml logs -f nginx
```

### Service Management
```bash
# Restart development
docker-compose -f docker-compose.dev.yml restart

# Restart production
docker-compose restart

# Restart nginx
cd /opt/apps/nginx
docker-compose restart
```

### Cache Management
```bash
# Connect to Redis CLI
redis-cli

# Clear specific restaurant cache
DEL menu:1 info:1

# Monitor cache operations
MONITOR
```

### SSL Certificate
```bash
# Manual certificate renewal
cd /opt/apps/nginx
docker-compose run certbot renew
```