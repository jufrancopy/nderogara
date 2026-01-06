import { FastifyInstance } from 'fastify'
import { pagosController } from '../controllers/pagosController'
import { hasRole } from '../middleware/hasRole'

export async function pagosRoutes(fastify: FastifyInstance) {
  // Todas las rutas requieren autenticación
  fastify.addHook('preHandler', async (request, reply) => {
    await request.jwtVerify()
  })

  // GET /proyectos/:proyectoId/etapas/:etapaId/pagos - Obtener pagos de una etapa
  fastify.get<{
    Params: { proyectoId: string; etapaId: string }
  }>('/proyectos/:proyectoId/etapas/:etapaId/pagos', pagosController.getPagosEtapa)

  // POST /proyectos/:proyectoId/etapas/:etapaId/pagos - Crear pago
  fastify.post<{
    Params: { proyectoId: string; etapaId: string }
  }>('/proyectos/:proyectoId/etapas/:etapaId/pagos', {
    preHandler: hasRole(['ADMIN', 'CLIENTE'])
  }, pagosController.createPago)

  // PUT /proyectos/:proyectoId/etapas/:etapaId/pagos/:pagoId - Actualizar pago
  fastify.put<{
    Params: { proyectoId: string; etapaId: string; pagoId: string }
  }>('/proyectos/:proyectoId/etapas/:etapaId/pagos/:pagoId', {
    preHandler: hasRole(['ADMIN', 'CLIENTE'])
  }, pagosController.updatePago)

  // DELETE /proyectos/:proyectoId/etapas/:etapaId/pagos/:pagoId - Eliminar pago
  fastify.delete<{
    Params: { proyectoId: string; etapaId: string; pagoId: string }
  }>('/proyectos/:proyectoId/etapas/:etapaId/pagos/:pagoId', {
    preHandler: hasRole(['ADMIN', 'CLIENTE'])
  }, pagosController.deletePago)

  // DELETE /proyectos/:proyectoId/presupuesto/:presupuestoItemId/pagos/:pagoId - Eliminar pago de item presupuesto
  fastify.delete<{
    Params: { proyectoId: string; presupuestoItemId: string; pagoId: string }
  }>('/proyectos/:proyectoId/presupuesto/:presupuestoItemId/pagos/:pagoId', {
    preHandler: hasRole(['ADMIN', 'CLIENTE'])
  }, pagosController.deletePresupuestoPago)
}
