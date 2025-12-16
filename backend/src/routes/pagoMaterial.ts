import { FastifyInstance } from 'fastify';
import {
  getPagosMaterial,
  createPagoMaterial,
  updatePagoMaterial,
  deletePagoMaterial,
  getEstadoPagoMaterial
} from '../controllers/pagoMaterialController';
import { authenticate } from '../middleware/auth';

export default async function pagoMaterialRoutes(fastify: FastifyInstance) {
  // Aplicar middleware de autenticación a todas las rutas
  fastify.addHook('preHandler', authenticate);

  // Obtener todos los pagos de un material
  fastify.get('/materiales/:materialPorItemId/pagos', getPagosMaterial);

  // Crear nuevo pago para un material
  fastify.post('/materiales/pagos', createPagoMaterial);

  // Actualizar pago de material
  fastify.put('/materiales/pagos/:id', updatePagoMaterial);

  // Eliminar pago de material
  fastify.delete('/materiales/pagos/:id', deletePagoMaterial);

  // Obtener estado de pago de un material
  fastify.get('/materiales/:materialPorItemId/estado-pago', getEstadoPagoMaterial);
}
