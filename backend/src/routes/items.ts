import { FastifyInstance } from 'fastify'
import { itemsController } from '../controllers/itemsController'
import { materialesPorItemController } from '../controllers/materialesPorItemController'
import { hasRole } from '../middleware/hasRole'

export async function itemsRoutes(fastify: FastifyInstance) {
  // GET /items - Público
  fastify.get('/', itemsController.getItems)

  // GET /items/:id - Público
  fastify.get('/:id', itemsController.getItemById)

  // GET /items/:id/costo-estimado - Público
  fastify.get('/:id/costo-estimado', itemsController.getCostoEstimado)

  // POST /items - Solo administradores
  fastify.post('/', { 
    preHandler: [async (request, reply) => {
      await fastify.jwtVerify(request, reply)
      await hasRole(['ADMIN'])(request, reply)
    }] 
  }, itemsController.createItem)

  // PUT /items/:id - Solo administradores
  fastify.put('/:id', { 
    preHandler: [async (request, reply) => {
      await fastify.jwtVerify(request, reply)
      await hasRole(['ADMIN'])(request, reply)
    }] 
  }, itemsController.updateItem)

  // DELETE /items/:id - Solo administradores
  fastify.delete('/:id', { 
    preHandler: [async (request, reply) => {
      await fastify.jwtVerify(request, reply)
      await hasRole(['ADMIN'])(request, reply)
    }] 
  }, itemsController.deleteItem)

  // Rutas para materiales en items - Solo administradores
  // POST /items/:id/materiales
  fastify.post('/:id/materiales', { 
    preHandler: [async (request, reply) => {
      await fastify.jwtVerify(request, reply)
      await hasRole(['ADMIN'])(request, reply)
    }] 
  }, materialesPorItemController.addMaterialToItem)

  // PUT /items/:itemId/materiales/:materialId - Solo administradores
  fastify.put('/:itemId/materiales/:materialId', { 
    preHandler: [async (request, reply) => {
      await fastify.jwtVerify(request, reply)
      await hasRole(['ADMIN'])(request, reply)
    }] 
  }, materialesPorItemController.updateMaterialInItem)

  // DELETE /items/:itemId/materiales/:materialId - Solo administradores
  fastify.delete('/:itemId/materiales/:materialId', { 
    preHandler: [async (request, reply) => {
      await fastify.jwtVerify(request, reply)
      await hasRole(['ADMIN'])(request, reply)
    }] 
  }, materialesPorItemController.removeMaterialFromItem)
}