#!/bin/bash

# Script de despliegue automatizado para Nde Rogara
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando despliegue de Nde Rogara..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Este script debe ejecutarse desde la raíz del proyecto"
    exit 1
fi

# Detener aplicaciones PM2
print_status "Deteniendo aplicaciones..."
pm2 stop nderogara-backend nderogara-frontend || true

# Actualizar código desde Git
print_status "Actualizando código desde Git..."
git pull origin main

# Backend
print_status "Configurando backend..."
cd backend

# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
print_status "Ejecutando migraciones de base de datos..."
npx prisma migrate deploy

# Construir backend
print_status "Construyendo backend..."
npm run build

# Frontend
print_status "Configurando frontend..."
cd ../frontend

# Instalar dependencias
npm install

# Construir frontend
print_status "Construyendo frontend..."
npm run build

# Volver al directorio raíz
cd ..

# Crear directorio de logs si no existe
mkdir -p logs

# Reiniciar aplicaciones con PM2
print_status "Iniciando aplicaciones..."
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

# Verificar estado
print_status "Verificando estado de las aplicaciones..."
pm2 status

print_status "¡Despliegue completado exitosamente!"
print_status "Frontend: https://nderogara.thepydeveloper.dev"
print_status "Backend: https://apinderogara.thepydeveloper.dev"

echo ""
print_warning "Para ver los logs en tiempo real:"
echo "pm2 logs"
echo ""
print_warning "Para monitorear las aplicaciones:"
echo "pm2 monit"