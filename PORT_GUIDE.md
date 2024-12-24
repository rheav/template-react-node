# Port Configuration Guide

## Port Overview
- PostgreSQL: 5432 (default internal database port)
- Backend API: 3000 (development) / 80 or 443 (production)
- Frontend: 5173 (development) / served through 80 or 443 (production)

## Production Port Setup

### 1. Database (PostgreSQL)
- Keep port 5432 for internal communication only
- NEVER expose PostgreSQL port directly to the internet
- Access only through your application

### 2. Backend API
- Development: Use port 3000
- Production: Use port 80 (HTTP) or 443 (HTTPS) - RECOMMENDED
- Alternative: Use port 8080 if 80 is not available

### 3. Frontend
- Development: Port 5173 (Vite default)
- Production: Served through the same port as backend (80/443)

## Security Recommendations

1. Database:
```bash
# Keep PostgreSQL listening only on localhost
listen_addresses = 'localhost'  # in postgresql.conf
```

2. Application:
```bash
# Use reverse proxy (Nginx) for production
server {
    listen 80;
    server_name yourdomain.com;
    
    location /api {
        proxy_pass http://localhost:3000;
    }
    
    location / {
        root /path/to/your/react/build;
        try_files $uri $uri/ /index.html;
    }
}
```

## Environment Files

### Development (.env)
```env
DATABASE_URL="postgres://postgres:Calabasas7425!@back-ends_postgre-template-fullstack-app:5432/back-ends"
SERVER_PORT=3000
```

### Production (.env)
```env
DATABASE_URL="postgres://postgres:Calabasas7425!@localhost:5432/back-ends"
SERVER_PORT=80  # or 443 for HTTPS
```

## Port Exposure Guide

1. Development:
   - Frontend: 5173 (local only)
   - Backend: 3000 (local only)
   - Database: 5432 (local only)

2. Production:
   - Expose ONLY port 80/443 for the application
   - All other services should be internal
   - Use reverse proxy (Nginx) to handle external requests

## Common Issues

1. Port Already in Use:
```bash
# Check what's using a port
sudo lsof -i :PORT_NUMBER

# Kill process using a port
sudo kill -9 $(sudo lsof -t -i:PORT_NUMBER)
```

2. Permission Denied:
```bash
# For ports below 1024 (like 80/443)
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```
