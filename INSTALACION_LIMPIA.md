# 🚀 Instalación Limpia - Build Manager

## 📋 Descripción
Esta guía explica cómo realizar una instalación completamente limpia del sistema Build Manager, eliminando todos los datos existentes y comenzando desde cero con las últimas funcionalidades implementadas.

## ⚠️ Advertencia Importante
**Esta instalación borrará TODOS los datos existentes de la base de datos.** Asegúrate de hacer backup de cualquier dato importante antes de proceder.

---

## 🛠️ Paso 1: Preparación del Entorno

### 1.1 Detener servicios en ejecución
```bash
# Detener el servidor backend si está corriendo
cd backend && pkill -f "tsx watch"

# Detener el servidor frontend si está corriendo
cd frontend && pkill -f "next dev"
```

### 1.2 Verificar dependencias
```bash
# Verificar Node.js
node --version
# Debe ser >= 18.0.0

# Verificar npm
npm --version
# Debe ser >= 8.0.0

# Verificar PostgreSQL
psql --version
# Debe estar corriendo
```

---

## 🗑️ Paso 2: Limpieza Completa de Base de Datos

### 2.1 Resetear PostgreSQL
```bash
# Entrar a PostgreSQL como superusuario
sudo -u postgres psql

# Dentro de PostgreSQL:
DROP DATABASE IF EXISTS buildmanager;
CREATE DATABASE buildmanager;
\q
```

### 2.2 Verificar configuración de base de datos
```bash
# Editar .env si es necesario
cd backend
nano .env

# Verificar que tenga:
DATABASE_URL="postgresql://username:password@localhost:5432/buildmanager"
JWT_SECRET="tu_jwt_secret_seguro"
```

---

## 📦 Paso 3: Instalación de Dependencias

### 3.1 Backend
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### 3.2 Frontend
```bash
cd frontend
rm -rf node_modules package-lock.json .next
npm install
```

---

## 🗃️ Paso 4: Configuración de Base de Datos

### 4.1 Aplicar migraciones
```bash
cd backend
npx prisma migrate reset --force
```

### 4.2 Generar cliente Prisma
```bash
npx prisma generate
```

### 4.3 Ejecutar seeders
```bash
# Solo ejecutar el seeder de usuarios
npm run seed-users

# Verificación: Debería mostrar usuarios creados
```

---

## 🔧 Paso 5: Verificación de Funcionalidades

### 5.1 Iniciar servicios
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5.2 Verificar URLs
- **Backend:** http://localhost:3001/health
- **Frontend:** http://localhost:3000

### 5.3 Probar funcionalidades principales

#### Autenticación
1. ✅ Ir a http://localhost:3000/login
2. ✅ Registrarse como cliente
3. ✅ Verificar login/logout

#### Gestión de Proyectos
1. ✅ Crear un nuevo proyecto
2. ✅ Configurar etapas automáticamente
3. ✅ Ver progreso de obra

#### Sistema de Pagos Fragmentados
1. ✅ Marcar etapa como COMPLETADA
2. ✅ Ver botón "💰 Pagar"
3. ✅ Registrar pago parcial con comprobante
4. ✅ Ver modal "👁️ Ver Pagos" con imagen del comprobante
5. ✅ Ver indicadores de progreso de pago

#### Gestión de Items y Materiales
1. ✅ Crear items de construcción
2. ✅ Gestionar materiales por item
3. ✅ Calcular costos estimados

---

## 📋 Lista de Verificación Final

### ✅ Backend
- [ ] Servidor corriendo en puerto 3001
- [ ] Base de datos conectada
- [ ] Migraciones aplicadas
- [ ] Seeders ejecutados (solo usuarios)

### ✅ Frontend
- [ ] Servidor corriendo en puerto 3000
- [ ] Login/Registro funcionando
- [ ] Navegación sin errores

### ✅ Funcionalidades Clave
- [ ] **Pagos Fragmentados:** Pago parcial + comprobante
- [ ] **Modal de Pagos:** Ver historial con imágenes
- [ ] **Indicadores Visuales:** 💰 [número] y barras de progreso
- [ ] **Actualización Automática:** Sin refrescar página
- [ ] **Gestión de Etapas:** Crear/Marcar/Eliminar
- [ ] **Sistema de Items:** CRUD completo
- [ ] **Materiales:** Asociación y cálculos

### ✅ Base de Datos
- [ ] Tabla `PagoEtapa` con `montoTotal`
- [ ] Campo `comprobanteUrl` funcional
- [ ] Estados de pago correctos
- [ ] Relaciones entre tablas intactas

---

## 🐛 Solución de Problemas

### Error: "Network Error"
```bash
# Verificar que el backend esté corriendo
curl http://localhost:3001/health
```

### Error: "Database connection failed"
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar credenciales en .env
```

### Error: "Prisma client not generated"
```bash
cd backend
npx prisma generate
```

### Comprobantes no se muestran
```bash
# Verificar directorio de uploads
ls -la backend/public/uploads/comprobantes/

# Verificar permisos
chmod 755 backend/public/uploads/comprobantes/
```

---

## 📚 Documentación Adicional

- **API Docs:** Ver rutas en `backend/src/routes/`
- **Modelos:** Ver schema en `backend/prisma/schema.prisma`
- **Componentes:** Ver `frontend/src/components/`
- **Configuración:** Ver archivos `.env.example`

---

## 🎯 Próximos Pasos

Una vez completada la instalación limpia:

1. **Crear usuario administrador** desde el seeder
2. **Configurar roles y permisos**
3. **Crear proyectos de ejemplo**
4. **Probar todas las funcionalidades**
5. **Documentar cualquier issue encontrado**

---

**✅ Instalación completada exitosamente**

*Fecha de creación: Diciembre 2025*
*Versión del sistema: Build Manager v2.0 - Pagos Fragmentados*
