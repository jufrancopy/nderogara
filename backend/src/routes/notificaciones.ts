import { FastifyInstance } from 'fastify'
import { notificationsController } from '../controllers/notificationsController'

export async function notificacionesRoutes(fastify: FastifyInstance) {
  // Proteger rutas
  fastify.addHook('preHandler', async (request, reply) => {
    await request.jwtVerify()
  })

  // PUT /notificaciones/:id/leer
  fastify.put('/:id/leer', notificationsController.marcarComoLeida)
}
