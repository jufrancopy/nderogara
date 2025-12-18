import Fastify, { FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import dotenv from 'dotenv'
import path from 'path'
import { hasRolePlugin } from './middleware/hasRole'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string
      email: string
      rol: string
    }
  }
}

// Cargar variables de entorno
dotenv.config()

const fastify = Fastify({
  logger: true
})

// Registrar plugins
fastify.register(cors, {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.0.12:3000',
    'https://nderogara.thepydeveloper.dev',
    process.env.FRONTEND_URL
  ].filter((url): url is string => Boolean(url)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
})

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

// Servir archivos estáticos
fastify.register(import('@fastify/static'), {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/'
})

fastify.register(hasRolePlugin)

// Rutas básicas
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', message: 'Nde Rogara API is running' }
})

// Registrar rutas
fastify.register(async function (fastify) {
  const { materialesRoutes } = await import('./routes/materiales')
  const { categoriasRoutes } = await import('./routes/categorias')
  const { proyectosRoutes } = await import('./routes/proyectos')
  const { proyectosReferenciaRoutes } = await import('./routes/proyectosReferencia')
  const { itemsRoutes } = await import('./routes/items')
  const { authRoutes } = await import('./routes/auth')
  const { etapasObraRoutes } = await import('./routes/etapasObra')
  const { adminRoutes } = await import('./routes/admin')
  const { uploadRoutes } = await import('./routes/upload')
  const { inmueblesRoutes } = await import('./routes/inmuebles')
  const { pagosRoutes } = await import('./routes/pagos')
  const { constructorRoutes } = await import('./routes/constructor')
  const { notificacionesRoutes } = await import('./routes/notificaciones')
  const proveedorMaterialesRoutes = await import('./routes/proveedorMateriales')
  const adminUsersRoutes = await import('./routes/adminUsers')
  const proveedorRoutes = await import('./routes/proveedor')
  const financiacionRoutes = await import('./routes/financiacion')
  const pagoMaterialRoutes = await import('./routes/pagoMaterial')

  await fastify.register(authRoutes, { prefix: '/auth' })
  await fastify.register(uploadRoutes, { prefix: '/upload' })
  await fastify.register(adminRoutes, { prefix: '/admin' })
  await fastify.register(adminUsersRoutes.default, { prefix: '/admin/users' })
  await fastify.register(inmueblesRoutes, { prefix: '/inmuebles' })
  await fastify.register(proveedorMaterialesRoutes.default, { prefix: '/proveedor' })
  await fastify.register(proveedorRoutes.default, { prefix: '/proveedor' })
  await fastify.register(proyectosReferenciaRoutes, { prefix: '/proyectos' })
  await fastify.register(materialesRoutes, { prefix: '/materiales' })
  await fastify.register(categoriasRoutes, { prefix: '/categorias' })
  await fastify.register(proyectosRoutes, { prefix: '/proyectos' })
  await fastify.register(itemsRoutes, { prefix: '/items' })
  await fastify.register(etapasObraRoutes, { prefix: '/proyectos' })
  await fastify.register(pagosRoutes)
  await fastify.register(constructorRoutes, { prefix: '/constructor' })
  await fastify.register(notificacionesRoutes, { prefix: '/notificaciones' })
  await fastify.register(financiacionRoutes.default)
  await fastify.register(pagoMaterialRoutes.default)

  // Ruta pública para proveedores (sin autenticación requerida)
  fastify.get('/proveedores', async (request, reply) => {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      const proveedores = await prisma.proveedor.findMany({
        where: { esActivo: true },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          ciudad: true,
          departamento: true
        },
        orderBy: { nombre: 'asc' }
      })

      reply.send({ success: true, data: proveedores })
    } catch (error) {
      console.error('Error fetching proveedores:', error)
      reply.status(500).send({ success: false, error: 'Error al obtener proveedores' })
    }
  })

  // Ruta para crear proveedores faltantes (one-time fix)
  fastify.post('/fix-proveedores', async (request, reply) => {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      // Encontrar usuarios PROVEEDOR_MATERIALES que no tienen proveedor
      const usuariosSinProveedor = await prisma.user.findMany({
        where: {
          rol: 'PROVEEDOR_MATERIALES',
          proveedor: null // No tienen proveedor asociado
        },
        select: {
          id: true,
          name: true,
          email: true,
          telefono: true,
          empresa: true
        }
      })

      console.log(`Encontrados ${usuariosSinProveedor.length} usuarios sin proveedor`)

      const resultados = []
      for (const usuario of usuariosSinProveedor) {
        try {
          const proveedor = await prisma.proveedor.create({
            data: {
              nombre: usuario.empresa || usuario.name || 'Proveedor',
              email: usuario.email,
              telefono: usuario.telefono || '',
              sitioWeb: null,
              logo: null,
              esActivo: true,
              usuarioId: usuario.id,
              latitud: null,
              longitud: null,
              ciudad: null,
              departamento: null
            }
          })
          resultados.push({ usuario: usuario.email, proveedor: proveedor.nombre, status: 'creado' })
        } catch (error) {
          console.error(`Error creando proveedor para ${usuario.email}:`, error)
          resultados.push({ usuario: usuario.email, status: 'error', error: (error as Error).message })
        }
      }

      reply.send({
        success: true,
        message: `Procesados ${usuariosSinProveedor.length} usuarios`,
        data: resultados
      })
    } catch (error) {
      console.error('Error en fix-proveedores:', error)
      reply.status(500).send({ success: false, error: 'Error al crear proveedores faltantes' })
    }
  })
})

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Server running on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
