import { FastifyInstance } from 'fastify'
import { itemsController } from '../controllers/itemsController'
import { materialesPorItemController } from '../controllers/materialesPorItemController'
import { hasRole } from '../middleware/hasRole'

export async function itemsRoutes(fastify: FastifyInstance) {
  // GET /items - Requiere autenticación
  fastify.get('/', {
    preHandler: async (request, reply) => {
      await request.jwtVerify()
    }
  }, itemsController.getItems)

  // GET /items/:id - Público
  fastify.get('/:id', itemsController.getItemById)

  // GET /items/:id/costo-estimado - Público
  fastify.get('/:id/costo-estimado', itemsController.getCostoEstimado)

  // POST /items - Administradores, constructores y proveedores de servicios
  fastify.post('/', {
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
      await hasRole(['ADMIN', 'CONSTRUCTOR', 'PROVEEDOR_SERVICIOS'])(request, reply)
    }]
  }, itemsController.createItem)

  // PUT /items/:id - Administradores, constructores y proveedores de servicios
  fastify.put('/:id', {
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
      await hasRole(['ADMIN', 'CONSTRUCTOR', 'PROVEEDOR_SERVICIOS'])(request, reply)
    }]
  }, itemsController.updateItem)

  // DELETE /items/:id - Administradores, constructores y proveedores de servicios
  fastify.delete('/:id', {
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
      await hasRole(['ADMIN', 'CONSTRUCTOR', 'PROVEEDOR_SERVICIOS'])(request, reply)
    }]
  }, itemsController.deleteItem)

  // Rutas para materiales en items - Solo administradores
  // POST /items/:id/materiales
  fastify.post('/:id/materiales', { 
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
      await hasRole(['ADMIN'])(request, reply)
    }] 
  }, materialesPorItemController.addMaterialToItem)

  // PUT /items/:itemId/materiales/:materialId - Solo administradores
  fastify.put('/:itemId/materiales/:materialId', { 
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
      await hasRole(['ADMIN'])(request, reply)
    }] 
  }, materialesPorItemController.updateMaterialInItem)

  // DELETE /items/:itemId/materiales/:materialId - Solo administradores
  fastify.delete('/:itemId/materiales/:materialId', { 
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
      await hasRole(['ADMIN'])(request, reply)
    }] 
  }, materialesPorItemController.removeMaterialFromItem)
}
