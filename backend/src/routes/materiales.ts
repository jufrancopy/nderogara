import { FastifyInstance } from 'fastify';
import { materialesController } from '../controllers/materialesController';

export async function materialesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      // Permitir acceso sin auth para ver catálogo público
    }
  });

  fastify.get('/', materialesController.getMateriales);
  fastify.get('/:id', materialesController.getMaterialById);
}
