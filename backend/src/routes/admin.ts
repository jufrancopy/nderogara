import { FastifyInstance } from 'fastify';
import {
  createMaterialCatalogo,
  updateMaterialCatalogo,
  getMaterialCatalogoById,
  getMaterialesCatalogo,
  deleteMaterialCatalogo,
  getAdminDashboard,
  createOfertaAdmin,
  updateOfertaAdmin,
  deleteOfertaAdmin,
  getOfertasByMaterial
} from '../controllers/materialesAdminController';
import { isAdmin } from '../middleware/auth';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await request.jwtVerify();
    await isAdmin(request, reply);
  });

  fastify.get('/dashboard', getAdminDashboard);
  fastify.post('/materiales', createMaterialCatalogo);
  fastify.get('/materiales/:id', getMaterialCatalogoById);
  fastify.put('/materiales/:id', updateMaterialCatalogo);
  fastify.delete('/materiales/:id', deleteMaterialCatalogo);
  fastify.get('/materiales', getMaterialesCatalogo);

  // Rutas para gestionar ofertas desde admin
  fastify.post('/materiales/:materialId/ofertas', createOfertaAdmin);
  fastify.get('/materiales/:materialId/ofertas', getOfertasByMaterial);
  fastify.put('/ofertas/:ofertaId', updateOfertaAdmin);
  fastify.delete('/ofertas/:ofertaId', deleteOfertaAdmin);
}
