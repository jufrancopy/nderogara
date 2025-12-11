import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const addMaterialSchema = z.object({
  materialId: z.string(),
  cantidadPorUnidad: z.number().positive(),
  observaciones: z.string().optional()
})

export const materialesPorItemController = {
  // POST /items/:id/materiales
  async addMaterialToItem(request: FastifyRequest<{
    Params: { id: string }
    Body: typeof addMaterialSchema._type
  }>, reply: FastifyReply) {
    try {
      const { id: itemId } = request.params
      const validatedData = addMaterialSchema.parse(request.body)

      // Verificar si ya existe la relación
      const existing = await prisma.materialPorItem.findUnique({
        where: {
          itemId_materialId: {
            itemId,
            materialId: validatedData.materialId
          }
        }
      })

      if (existing) {
        return reply.status(400).send({
          success: false,
          error: 'Este material ya está asociado al item'
        })
      }

      const materialPorItem = await prisma.materialPorItem.create({
        data: {
          itemId,
          ...validatedData
        },
        include: {
          material: {
            select: {
              nombre: true,
              unidad: true,
              precioUnitario: true
            }
          }
        }
      })

      return reply.status(201).send({
        success: true,
        data: materialPorItem,
        message: 'Material asociado exitosamente'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        })
      }

      console.error('Error adding material to item:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // PUT /items/:itemId/materiales/:materialId
  async updateMaterialInItem(request: FastifyRequest<{
    Params: { itemId: string, materialId: string }
    Body: { cantidadPorUnidad: number, observaciones?: string }
  }>, reply: FastifyReply) {
    try {
      const { itemId, materialId } = request.params
      const { cantidadPorUnidad, observaciones } = request.body

      const materialPorItem = await prisma.materialPorItem.update({
        where: {
          itemId_materialId: {
            itemId,
            materialId
          }
        },
        data: {
          cantidadPorUnidad,
          observaciones
        },
        include: {
          material: {
            select: {
              nombre: true,
              unidad: true,
              precioUnitario: true
            }
          }
        }
      })

      return reply.send({
        success: true,
        data: materialPorItem,
        message: 'Relación actualizada exitosamente'
      })
    } catch (error) {
      console.error('Error updating material in item:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // DELETE /items/:itemId/materiales/:materialId
  async removeMaterialFromItem(request: FastifyRequest<{
    Params: { itemId: string, materialId: string }
  }>, reply: FastifyReply) {
    try {
      const { itemId, materialId } = request.params

      await prisma.materialPorItem.delete({
        where: {
          itemId_materialId: {
            itemId,
            materialId
          }
        }
      })

      return reply.send({
        success: true,
        message: 'Material removido del item exitosamente'
      })
    } catch (error) {
      console.error('Error removing material from item:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}