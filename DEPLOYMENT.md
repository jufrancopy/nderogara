# Guía de Despliegue - Nde Rogara

## Requisitos del Servidor
- Ubuntu/Debian Server
- Node.js 18+
- PostgreSQL 12+
- Nginx
- PM2 (para gestión de procesos)
- Git

## 1. Preparación del Servidor

### Instalar dependencias
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalaciones
node --version
npm --version
pm2 --version
```

## 2. Configuración de Base de Datos

### Crear base de datos y usuario
```bash
sudo -u postgres psql

-- En PostgreSQL:
CREATE DATABASE nderogara;
CREATE USER nderogara_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE nderogara TO nderogara_user;
\q
```

## 3. Clonar y Configurar el Proyecto

### Clonar repositorio
```bash
cd /var/www/html
sudo git clone https://github.com/jufrancopy/nderogara.git
sudo chown -R $USER:$USER /var/www/html/nderogara
cd /var/www/html/nderogara
```

### Configurar Backend
```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
```

### Editar archivo .env del backend
```bash
nano .env
```

Contenido del archivo `.env`:
```env
# Base de datos
DATABASE_URL="postgresql://nderogara_user:tu_password_seguro@localhost:5432/nderogara"

# JWT
JWT_SECRET="tu_jwt_secret_muy_seguro_aqui"

# Puerto
PORT=3001

# Entorno
NODE_ENV=production

# CORS
FRONTEND_URL=https://nderogara.thepydeveloper.dev
```

### Configurar Frontend
```bash
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
nano .env.local
```

Contenido del archivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://apinderogara.thepydeveloper.dev
```

## 4. Configuración de Nginx

### Crear configuración para el backend (API)
```bash
sudo nano /etc/nginx/sites-available/apinderogara.thepydeveloper.dev
```

Contenido:
```nginx
server {
    listen 80;
    server_name apinderogara.thepydeveloper.dev;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Servir archivos estáticos
    location /uploads/ {
        alias /var/www/html/nderogara/backend/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Crear configuración para el frontend
```bash
sudo nano /etc/nginx/sites-available/nderogara.thepydeveloper.dev
```

Contenido:
```nginx
server {
    listen 80;
    server_name nderogara.thepydeveloper.dev;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Habilitar sitios
```bash
sudo ln -s /etc/nginx/sites-available/apinderogara.thepydeveloper.dev /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/nderogara.thepydeveloper.dev /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 5. Configurar Base de Datos

### Ejecutar migraciones
```bash
cd /var/www/html/nderogara/backend

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Opcional: Ejecutar seeders
npm run seed
```

## 6. Construir y Desplegar

### Construir backend
```bash
cd /var/www/html/nderogara/backend
npm run build
```

### Construir frontend
```bash
cd /var/www/html/nderogara/frontend
npm run build
```

## 7. Configurar PM2

### Crear archivo de configuración PM2
```bash
cd /var/www/html/nderogara
nano ecosystem.config.js
```

Contenido:
```javascript
module.exports = {
  apps: [
    {
      name: 'nderogara-backend',
      cwd: './backend',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'nderogara-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
```

### Crear directorio de logs
```bash
mkdir -p /var/www/html/nderogara/logs
```

### Iniciar aplicaciones con PM2
```bash
cd /var/www/html/nderogara

# Iniciar aplicaciones
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

# Configurar PM2 para iniciar al arranque
pm2 startup
# Ejecutar el comando que PM2 te muestre
```

## 8. Configurar SSL con Let's Encrypt

### Instalar Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtener certificados SSL
```bash
sudo certbot --nginx -d nderogara.thepydeveloper.dev -d apinderogara.thepydeveloper.dev
```

### Verificar renovación automática
```bash
sudo certbot renew --dry-run
```

## 9. Comandos de Mantenimiento

### Ver logs de PM2
```bash
pm2 logs nderogara-backend
pm2 logs nderogara-frontend
pm2 logs
```

### Reiniciar aplicaciones
```bash
pm2 restart nderogara-backend
pm2 restart nderogara-frontend
pm2 restart all
```

### Actualizar aplicación
```bash
cd /var/www/html/nderogara

# Detener aplicaciones
pm2 stop all

# Actualizar código
git pull origin main

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Frontend
cd ../frontend
npm install
npm run build

# Reiniciar aplicaciones
cd ..
pm2 restart all
```

### Backup de base de datos
```bash
# Crear backup
pg_dump -U nderogara_user -h localhost nderogara > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
psql -U nderogara_user -h localhost nderogara < backup_file.sql
```

## 10. Monitoreo

### Ver estado de servicios
```bash
# PM2
pm2 status
pm2 monit

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql
```

### Ver uso de recursos
```bash
htop
df -h
free -h
```

## 11. Firewall (Opcional)

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## URLs Finales

- **Frontend**: https://nderogara.thepydeveloper.dev
- **Backend API**: https://apinderogara.thepydeveloper.dev
- **Archivos estáticos**: https://apinderogara.thepydeveloper.dev/uploads/

## Usuarios por Defecto

Después del seed:
- **Admin**: admin@buildmanager.com / admin123
- **Proveedor**: proveedor@materiales.com / proveedor123
- **Vendedor**: vendedor@inmuebles.com / vendedor123

## Troubleshooting

### Si el backend no inicia:
```bash
cd /var/www/html/nderogara/backend
npm run dev  # Para ver errores en desarrollo
```

### Si hay problemas de permisos:
```bash
sudo chown -R $USER:$USER /var/www/html/nderogara
chmod -R 755 /var/www/html/nderogara
```

### Si PostgreSQL no conecta:
```bash
sudo -u postgres psql -c "SELECT version();"
```