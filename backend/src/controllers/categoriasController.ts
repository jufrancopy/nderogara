import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const categoriasController = {
  // GET /categorias
  async getCategorias(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categorias = await prisma.categoriaMaterial.findMany({
        orderBy: { nombre: 'asc' }
      })

      return reply.send({
        success: true,
        data: categorias
      })
    } catch (error) {
      console.error('Error fetching categorias:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}