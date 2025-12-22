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

      // Permitir múltiples instancias del mismo material (cada una puede tener diferentes ofertas)
      // No hay validación de unicidad aquí - se permite agregar el mismo material múltiples veces

      const materialPorItem = await prisma.materialPorItem.create({
        data: {
          itemId,
          ...validatedData
        },
        include: {
          material: {
            include: {
              ofertas: {
                where: { stock: true },
                select: {
                  precio: true,
                  stock: true
                }
              }
            }
          }
        }
      })

      // Determinar el precio unitario a usar (prioridad: ofertas → precio base → precio personalizado)
      let precioUnitario = 0

      // Buscar ofertas activas con stock
      const ofertasActivas = materialPorItem.material.ofertas?.filter(oferta => oferta.stock === true) || []
      if (ofertasActivas.length > 0) {
        // Usar la oferta más económica
        precioUnitario = Math.min(...ofertasActivas.map(o => Number(o.precio)))
      } else if (materialPorItem.material.precioBase) {
        // Usar precio base si no hay ofertas
        precioUnitario = Number(materialPorItem.material.precioBase)
      } else if (materialPorItem.material.precio) {
        // Usar precio personalizado como último recurso
        precioUnitario = Number(materialPorItem.material.precio)
      }

      // Crear la respuesta con el precio unitario determinado
      const responseData = {
        ...materialPorItem,
        material: {
          ...materialPorItem.material,
          precioUnitario
        }
      }

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
    Body: { cantidadPorUnidad: number, precioUnitario?: number, observaciones?: string }
  }>, reply: FastifyReply) {
    try {
      const { itemId, materialId } = request.params
      const { cantidadPorUnidad, precioUnitario, observaciones } = request.body

      // Verificar que el registro existe y pertenece al item
      const existingRecord = await prisma.materialPorItem.findFirst({
        where: {
          id: materialId,
          itemId: itemId
        }
      })

      if (!existingRecord) {
        return reply.status(404).send({
          success: false,
          error: 'Material no encontrado en este item'
        })
      }

      console.log('Actualizando MaterialPorItem:', {
        id: materialId,
        cantidadPorUnidad,
        precioUnitario,
        precioUnitarioType: typeof precioUnitario,
        observaciones
      });

      const materialPorItem = await prisma.materialPorItem.update({
        where: {
          id: materialId
        },
        data: {
          cantidadPorUnidad,
          ...(precioUnitario !== undefined && { precioUnitario }),
          observaciones
        },
        include: {
          material: {
            include: {
              ofertas: {
                where: { stock: true },
                select: {
                  precio: true,
                  stock: true
                }
              }
            }
          }
        }
      });

      console.log('MaterialPorItem actualizado:', {
        id: materialPorItem.id,
        precioUnitario: materialPorItem.precioUnitario,
        precioUnitarioType: typeof materialPorItem.precioUnitario
      });

      // Determinar el precio unitario a usar (prioridad: precio específico → ofertas → precio base → precio personalizado)
      let precioUnitarioCalculado = materialPorItem.precioUnitario || 0

      if (!precioUnitarioCalculado) {
        // Buscar ofertas activas con stock
        const ofertasActivas = materialPorItem.material.ofertas?.filter((oferta: any) => oferta.stock === true) || []
        if (ofertasActivas.length > 0) {
          // Usar la oferta más económica
          precioUnitarioCalculado = Math.min(...ofertasActivas.map((o: any) => Number(o.precio)))
        } else if (materialPorItem.material.precioBase) {
          // Usar precio base si no hay ofertas
          precioUnitarioCalculado = Number(materialPorItem.material.precioBase)
        } else if (materialPorItem.material.precio) {
          // Usar precio personalizado como último recurso
          precioUnitarioCalculado = Number(materialPorItem.material.precio)
        }
      }

      // Crear la respuesta con el precio unitario determinado
      const responseData = {
        ...materialPorItem,
        material: {
          ...materialPorItem.material,
          precioUnitario: precioUnitarioCalculado
        }
      }

      return reply.send({
        success: true,
        data: responseData,
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

      console.log('Backend - removeMaterialFromItem:')
      console.log('- itemId:', itemId)
      console.log('- materialId (registro MaterialPorItem):', materialId)

      // Verificar que el registro existe y pertenece al item
      const materialPorItem = await prisma.materialPorItem.findFirst({
        where: {
          id: materialId,
          itemId: itemId
        }
      })

      console.log('MaterialPorItem encontrado:', !!materialPorItem)
      if (materialPorItem) {
        console.log('- ID:', materialPorItem.id)
        console.log('- ItemId:', materialPorItem.itemId)
        console.log('- MaterialId:', materialPorItem.materialId)
      }

      if (!materialPorItem) {
        // Buscar sin el filtro de itemId para ver si existe en otro lado
        const materialPorItemAnywhere = await prisma.materialPorItem.findUnique({
          where: { id: materialId }
        })
        console.log('MaterialPorItem existe en otro item?', !!materialPorItemAnywhere)
        if (materialPorItemAnywhere) {
          console.log('- Existe en itemId:', materialPorItemAnywhere.itemId)
        }

        return reply.status(404).send({
          success: false,
          error: 'Material no encontrado en este item'
        })
      }

      // Eliminar el registro
      await prisma.materialPorItem.delete({
        where: {
          id: materialId
        }
      })

      console.log('Material eliminado exitosamente')
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
