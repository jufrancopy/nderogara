#!/bin/bash

# Script de deploy para BuildManager
echo "🚀 Iniciando deploy..."

# Build del backend
echo "📦 Compilando backend..."
cd backend
npm run build
cd ..

# Build del frontend
echo "📦 Haciendo build del frontend..."
cd frontend
npm run build

# Copiar archivos estáticos para standalone
echo "📁 Copiando archivos estáticos..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Reiniciar servicios PM2
echo "🔄 Reiniciando servicios..."
pm2 restart nderogara-frontend
pm2 restart nderogara-backend

echo "✅ Deploy completado!"
echo "🌐 Sitio: https://nderogara.thepydeveloper.dev"