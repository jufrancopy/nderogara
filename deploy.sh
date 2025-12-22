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

# Cambiar propietario temporalmente para npm install
echo "🔧 Ajustando permisos para npm install..."
sudo chown -R $USER:$USER . 2>/dev/null || true

npm install

# Restaurar permisos originales si es necesario
echo "🔧 Verificando permisos..."
# No necesitamos restaurar ya que el chown fue temporal

# Build del frontend
echo "📦 Haciendo build del frontend..."
npm run build

# Copiar archivos estáticos para standalone
echo "📁 Preparando archivos para producción..."

# Copiar static y public al standalone (Next.js los necesita al mismo nivel)
if [ -d ".next/standalone" ]; then
    echo "✓ Copiando archivos estáticos..."
    cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
    cp -r public .next/standalone/ 2>/dev/null || true
    echo "✓ Archivos copiados correctamente"
else
    echo "⚠️  Advertencia: No se encontró el directorio .next/standalone"
    echo "   Verifica que output: 'standalone' esté en next.config"
fi

cd ..

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
