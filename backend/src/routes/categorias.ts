import { FastifyInstance } from 'fastify'
import { categoriasController } from '../controllers/categoriasController'

export async function categoriasRoutes(fastify: FastifyInstance) {
  // GET /categorias
  fastify.get('/', categoriasController.getCategorias)
}