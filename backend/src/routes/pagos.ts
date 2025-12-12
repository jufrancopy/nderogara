import { FastifyInstance } from 'fastify'
import { pagosController } from '../controllers/pagosController'
import { hasRole } from '../middleware/hasRole'

export async function pagosRoutes(fastify: FastifyInstance) {
  // Todas las rutas requieren autenticación
  fastify.addHook('preHandler', async (request, reply) => {
    await request.jwtVerify()
  })

  // GET /proyectos/:proyectoId/etapas/:etapaId/pagos - Obtener pagos de una etapa
  fastify.get('/proyectos/:proyectoId/etapas/:etapaId/pagos', pagosController.getPagosEtapa)

  // POST /proyectos/:proyectoId/etapas/:etapaId/pagos - Crear pago
  fastify.post('/proyectos/:proyectoId/etapas/:etapaId/pagos', {
    preHandler: hasRole(['ADMIN', 'CLIENTE'])
  }, pagosController.createPago)

  // PUT /proyectos/:proyectoId/etapas/:etapaId/pagos/:pagoId - Actualizar pago
  fastify.put('/proyectos/:proyectoId/etapas/:etapaId/pagos/:pagoId', {
    preHandler: hasRole(['ADMIN', 'CLIENTE'])
  }, pagosController.updatePago)

  // DELETE /proyectos/:proyectoId/etapas/:etapaId/pagos/:pagoId - Eliminar pago
  fastify.delete('/proyectos/:proyectoId/etapas/:etapaId/pagos/:pagoId', {
    preHandler: hasRole(['ADMIN', 'CLIENTE'])
  }, pagosController.deletePago)
}
