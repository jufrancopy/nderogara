import { FastifyInstance } from 'fastify';
console.log("Registrando rutas de financiacion");
import {
  getFinanciaciones,
  createFinanciacion,
  updateFinanciacion,
  deleteFinanciacion,
  getPresupuestoTotal
} from '../controllers/financiacionController';
import { authenticate } from '../middleware/auth';

export default async function financiacionRoutes(fastify: FastifyInstance) {
  // Ruta básica para evitar errores 404 (temporal) - COMPLETAMENTE PÚBLICA
  fastify.get('/financiaciones', async (request, reply) => {
    return { data: [], success: true };
  });

  // Aplicar middleware de autenticación a todas las rutas restantes
  fastify.addHook('preHandler', authenticate);

  // Obtener todas las financiaciones de un proyecto
  fastify.get('/:proyectoId/financiaciones', async (request, reply) => {
    console.log('Route hit: GET /:proyectoId/financiaciones', request.params);
    return getFinanciaciones(request, reply);
  });

  // Crear nueva financiación
  fastify.post('/:proyectoId/financiaciones', createFinanciacion);

  // Actualizar financiación
  fastify.put('/financiaciones/:id', updateFinanciacion);

  // Eliminar financiación
  fastify.delete('/financiaciones/:id', deleteFinanciacion);

  // Obtener presupuesto total de un proyecto
  fastify.get('/:proyectoId/presupuesto-total', getPresupuestoTotal);
}
