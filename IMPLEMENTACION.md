# Sistema de Autenticación y Catálogo de Materiales

## Modelo Implementado

### Estructura Híbrida:

**ADMINISTRADOR:**
- Gestiona el catálogo central de materiales
- Configura proveedores y comisiones
- Actualiza precios centralmente

**USUARIO (Constructor/Cliente):**
- Accede al catálogo de materiales del admin
- Puede crear materiales personalizados
- Gestiona sus propios items/partidas
- Control total de sus proyectos

## Cambios en Base de Datos

### Tabla `User`:
- `password`: Campo para autenticación local
- Relación con `materialesPersonalizados` (materiales propios)
- Relación con `items` (items propios)

### Tabla `Material`:
- `esCatalogo`: Boolean (true = catálogo admin, false = personalizado)
- `usuarioId`: ID del usuario (null si es del catálogo)
- `comisionPorcentaje`: % de comisión para materiales del catálogo
- `urlProveedor`: URL del proveedor para tracking

### Tabla `Item`:
- `usuarioId`: Cada item pertenece a un usuario

## Endpoints Implementados

### Autenticación:
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login
- `GET /auth/me` - Obtener perfil (requiere token)

### Admin (requiere rol ADMIN):
- `POST /admin/materiales` - Crear material del catálogo
- `PUT /admin/materiales/:id` - Actualizar material del catálogo
- `GET /admin/materiales` - Listar materiales del catálogo

## Flujo de Uso

1. **Usuario se registra/inicia sesión**
2. **Usuario crea proyecto**
3. **Usuario selecciona materiales:**
   - Del catálogo admin → Genera comisión
   - Crea materiales personalizados → Sin comisión
4. **Usuario crea items/partidas** con sus materiales
5. **Admin gestiona catálogo** y actualiza precios/proveedores

## Próximos Pasos

1. Crear formulario de nuevo material (admin)
2. Actualizar página de materiales para mostrar catálogo + personalizados
3. Agregar filtros por tipo (catálogo vs personalizado)
4. Implementar tracking de comisiones
5. Dashboard de estadísticas para admin
6. Middleware de protección de rutas en frontend

## Comandos para Ejecutar

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Login: http://localhost:3000/login
- Admin Materiales: http://localhost:3000/admin/materiales

## Crear Usuario Admin

```sql
-- Ejecutar en PostgreSQL
UPDATE "User" SET rol = 'ADMIN' WHERE email = 'tu-email@ejemplo.com';
```
