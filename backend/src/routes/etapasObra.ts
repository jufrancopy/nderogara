import { FastifyInstance } from 'fastify'
import { etapasObraController } from '../controllers/etapasObraController'

export async function etapasObraRoutes(fastify: FastifyInstance) {
  // GET /proyectos/:id/etapas
  fastify.get('/:id/etapas', etapasObraController.getEtapasByProyecto)

  // POST /proyectos/:id/etapas
  fastify.post('/:id/etapas', etapasObraController.createEtapa)

  // PUT /proyectos/:proyectoId/etapas/:etapaId
  fastify.put('/:proyectoId/etapas/:etapaId', etapasObraController.updateEtapa)

  // DELETE /proyectos/:proyectoId/etapas/:etapaId
  fastify.delete('/:proyectoId/etapas/:etapaId', etapasObraController.deleteEtapa)

  // POST /proyectos/:proyectoId/etapas/:etapaId/materiales-extra
  fastify.post('/:proyectoId/etapas/:etapaId/materiales-extra', etapasObraController.addMaterialExtra)
}