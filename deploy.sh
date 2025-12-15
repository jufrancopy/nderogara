#!/bin/bash

# Script de deploy completo para BuildManager
echo "🚀 Iniciando deploy completo..."

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install

# Ejecutar migraciones de Prisma
echo "🗄️ Ejecutando migraciones de base de datos..."
npx prisma migrate deploy

# Regenerar cliente de Prisma
echo "🔧 Regenerando cliente de Prisma..."
npx prisma generate

# Build del backend
echo "📦 Compilando backend..."
npm run build
cd ..

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
sudo -u jucfra npm install

# Build del frontend
echo "📦 Haciendo build del frontend..."
npm run build

# Copiar archivos estáticos para standalone
echo "📁 Copiando archivos estáticos..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Reiniciar servicios PM2
echo "🔄 Reiniciando servicios..."
pm2 restart nderogara-frontend
pm2 restart nderogara-backend

# Verificar estado de servicios
echo "🔍 Verificando estado de servicios..."
pm2 status

echo "✅ Deploy completado exitosamente!"
echo "🌐 Sitio: https://nderogara.thepydeveloper.dev"
echo ""
echo "📋 Resumen del deploy:"
echo "  ✅ Dependencias instaladas"
echo "  ✅ Base de datos actualizada"
echo "  ✅ Cliente Prisma regenerado"
echo "  ✅ Backend compilado"
echo "  ✅ Frontend compilado"
echo "  ✅ Servicios reiniciados"
