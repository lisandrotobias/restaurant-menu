# Restaurant Menu - Production Setup

## Architecture Overview

### Infrastructure
- VPS hosting with Docker containerization
- Nginx reverse proxy
- Let's Encrypt SSL certificates
- SvelteKit application with Node.js backend

### Domain Structure
- Production URL: `menu.capybarasolutions.com`
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
    ├── Dockerfile
    └── [application files]
```

## Technical Implementation

### Docker Configuration

#### Nginx Service
```yaml
# /opt/apps/nginx/docker-compose.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./conf.d:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    networks:
      - web
    restart: unless-stopped

  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

networks:
  web:
    name: nginx-proxy
    external: true
```

#### Restaurant Menu Service
```yaml
# /opt/apps/restaurant-menu/docker-compose.yml
version: '3.8'
services:
  restaurant-menu:
    build:
      context: .
      dockerfile: Dockerfile
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - ORIGIN=https://menu.capybarasolutions.com
    networks:
      - web
    restart: unless-stopped

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

## Deployment Process

1. DNS Configuration
   - Created A record for `menu.capybarasolutions.com`
   - Pointed to VPS IP address

2. Initial Setup
   - Created directory structure in `/opt/apps`
   - Set up Docker network: `nginx-proxy`
   - Configured Nginx and application services

3. SSL Implementation
   - Generated initial SSL certificate using Let's Encrypt
   - Configured Nginx for SSL termination
   - Set up automatic certificate renewal

4. Service Deployment
   - Deployed Nginx reverse proxy
   - Deployed SvelteKit application
   - Verified SSL and HTTP to HTTPS redirection

## Maintenance

### Logs
```bash
# Nginx logs
docker-compose -f /opt/apps/nginx/docker-compose.yml logs -f nginx

# Application logs
docker-compose -f /opt/apps/restaurant-menu/docker-compose.yml logs -f
```

### Service Management
```bash
# Restart services
cd /opt/apps/nginx
docker-compose restart

cd /opt/apps/restaurant-menu
docker-compose restart
```

### SSL Certificate
```bash
# Manual certificate renewal
cd /opt/apps/nginx
docker-compose run certbot renew
```