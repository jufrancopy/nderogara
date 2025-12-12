import { FastifyInstance } from 'fastify'
import { proyectosController } from '../controllers/proyectosController'
import { presupuestoController } from '../controllers/presupuestoController'

export async function proyectosRoutes(fastify: FastifyInstance) {
  // Proteger todas las rutas con autenticación y verificación de rol
  fastify.addHook('preHandler', async (request, reply) => {
    await request.jwtVerify()

    const user = request.user as any
    // Solo permitir ADMIN y CLIENTE acceder a proyectos
    if (user.rol !== 'ADMIN' && user.rol !== 'CLIENTE') {
      reply.status(403).send({ error: 'Acceso denegado. Solo clientes pueden gestionar proyectos.' })
    }
  })

  // GET /proyectos
  fastify.get('/', proyectosController.getProyectos)

  // GET /proyectos/:id
  fastify.get('/:id', proyectosController.getProyectoById)

  // POST /proyectos
  fastify.post('/', proyectosController.createProyecto)

  // PUT /proyectos/:id
  fastify.put('/:id', proyectosController.updateProyecto)

  // PUT /proyectos/:id/estado
  fastify.put('/:id/estado', proyectosController.updateEstadoProyecto)

  // DELETE /proyectos/:id
  fastify.delete('/:id', proyectosController.deleteProyecto)

  // Rutas de presupuesto
  // POST /proyectos/:id/presupuesto
  fastify.post('/:id/presupuesto', presupuestoController.addItemToPresupuesto)

  // DELETE /proyectos/:proyectoId/presupuesto/:itemId
  fastify.delete('/:proyectoId/presupuesto/:itemId', presupuestoController.removeItemFromPresupuesto)
}
