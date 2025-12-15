#!/usr/bin/env node

// Script para iniciar Next.js en modo standalone
// Apunta al build de producción en .next/standalone

const { spawn } = require('child_process');
const path = require('path');

// Cambiar al directorio standalone donde está el build
process.chdir(path.join(__dirname, '.next', 'standalone'));

// Iniciar el servidor de Next.js
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || 3002,
    HOSTNAME: process.env.HOSTNAME || '0.0.0.0'
  }
});

server.on('error', (err) => {
  console.error('Error starting Next.js server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Next.js server exited with code ${code}`);
  process.exit(code);
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
});
