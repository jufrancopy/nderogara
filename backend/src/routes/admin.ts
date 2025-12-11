import { FastifyInstance } from 'fastify';
import { createMaterialCatalogo, updateMaterialCatalogo, getMaterialesCatalogo } from '../controllers/materialesAdminController';
import { isAdmin } from '../middleware/auth';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await request.jwtVerify();
    await isAdmin(request, reply);
  });

  fastify.post('/materiales', createMaterialCatalogo);
  fastify.put('/materiales/:id', updateMaterialCatalogo);
  fastify.get('/materiales', getMaterialesCatalogo);
}
