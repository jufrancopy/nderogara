import { FastifyInstance } from 'fastify';
import {
  getFinanciaciones,
  createFinanciacion,
  updateFinanciacion,
  deleteFinanciacion,
  getPresupuestoTotal
} from '../controllers/financiacionController';
import { authenticate } from '../middleware/auth';

export default async function financiacionRoutes(fastify: FastifyInstance) {
  // Aplicar middleware de autenticación a todas las rutas
  fastify.addHook('preHandler', authenticate);

  // Ruta básica para evitar errores 404 (temporal)
  fastify.get('/financiaciones', async (request, reply) => {
    return { data: [], success: true };
  });

  // Obtener todas las financiaciones de un proyecto
  fastify.get('/proyectos/:proyectoId/financiaciones', getFinanciaciones);

  // Crear nueva financiación
  fastify.post('/proyectos/:proyectoId/financiaciones', createFinanciacion);

  // Actualizar financiación
  fastify.put('/financiaciones/:id', updateFinanciacion);

  // Eliminar financiación
  fastify.delete('/financiaciones/:id', deleteFinanciacion);

  // Obtener presupuesto total de un proyecto
  fastify.get('/proyectos/:proyectoId/presupuesto-total', getPresupuestoTotal);
}
