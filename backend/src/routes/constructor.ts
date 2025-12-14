import { FastifyInstance } from 'fastify'
import { constructorController } from '../controllers/constructorController'

export async function constructorRoutes(fastify: FastifyInstance) {
  // Proteger rutas
  fastify.addHook('preHandler', async (request, reply) => {
    await request.jwtVerify()
  })

  // GET /constructor/dashboard
  fastify.get('/dashboard', constructorController.getDashboard)
}
