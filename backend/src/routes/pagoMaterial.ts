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
  console.log('🔄 Registrando rutas de pagoMaterial...');

  // Aplicar middleware de autenticación a todas las rutas
  fastify.addHook('preHandler', authenticate);

  // Obtener todos los pagos de un material
  fastify.get('/materiales/:materialPorItemId/pagos', getPagosMaterial);
  console.log('✅ Ruta registrada: GET /materiales/:materialPorItemId/pagos');

  // Crear nuevo pago para un material
  fastify.post('/materiales/pagos', createPagoMaterial);
  console.log('✅ Ruta registrada: POST /materiales/pagos');

  // Actualizar pago de material
  fastify.put('/materiales/pagos/:id', updatePagoMaterial);
  console.log('✅ Ruta registrada: PUT /materiales/pagos/:id');

  // Eliminar pago de material
  fastify.delete('/materiales/pagos/:id', deletePagoMaterial);
  console.log('✅ Ruta registrada: DELETE /materiales/pagos/:id');

  // Obtener estado de pago de un material
  fastify.get('/materiales/:materialPorItemId/estado-pago', getEstadoPagoMaterial);
  console.log('✅ Ruta registrada: GET /materiales/:materialPorItemId/estado-pago');

  console.log('🎉 Todas las rutas de pagoMaterial registradas correctamente');
}
