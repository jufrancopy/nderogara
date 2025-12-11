import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const addItemSchema = z.object({
  itemId: z.string(),
  cantidadMedida: z.number().positive()
})

export const presupuestoController = {
  // POST /proyectos/:id/presupuesto
  async addItemToPresupuesto(request: FastifyRequest<{
    Params: { id: string }
    Body: typeof addItemSchema._type
  }>, reply: FastifyReply) {
    try {
      const { id: proyectoId } = request.params
      const validatedData = addItemSchema.parse(request.body)

      // Verificar si ya existe el item en el presupuesto
      const existing = await prisma.presupuestoItem.findUnique({
        where: {
          proyectoId_itemId: {
            proyectoId,
            itemId: validatedData.itemId
          }
        }
      })

      if (existing) {
        return reply.status(400).send({
          success: false,
          error: 'Este item ya está en el presupuesto'
        })
      }

      // Obtener el item con sus materiales para calcular costos
      const item = await prisma.item.findUnique({
        where: { id: validatedData.itemId },
        include: {
          materialesPorItem: {
            include: {
              material: true
            }
          }
        }
      })

      if (!item) {
        return reply.status(404).send({
          success: false,
          error: 'Item no encontrado'
        })
      }

      // Calcular costos
      console.log('🧮 Calculando costos para item:', item.nombre)
      console.log('📦 Materiales encontrados:', item.materialesPorItem.length)
      
      const costoMateriales = item.materialesPorItem.reduce((total, materialItem) => {
        const precioUnitario = Number(materialItem.material.precioUnitario)
        const cantidadPorUnidad = Number(materialItem.cantidadPorUnidad)
        const costoMaterial = precioUnitario * cantidadPorUnidad
        
        console.log(`💰 Material: ${materialItem.material.nombre}`);
        console.log(`   - Precio unitario: ${precioUnitario}`);
        console.log(`   - Cantidad por unidad: ${cantidadPorUnidad}`);
        console.log(`   - Costo material: ${costoMaterial}`);
        
        return total + costoMaterial
      }, 0) * validatedData.cantidadMedida
      
      console.log('💵 Costo materiales total:', costoMateriales)

      const costoManoObra = Number(item.manoObraUnitaria || 0) * validatedData.cantidadMedida
      const costoTotal = costoMateriales + costoManoObra

      // Crear el item del presupuesto
      const presupuestoItem = await prisma.presupuestoItem.create({
        data: {
          proyectoId,
          itemId: validatedData.itemId,
          cantidadMedida: validatedData.cantidadMedida,
          costoMateriales,
          costoManoObra,
          costoTotal
        },
        include: {
          item: true
        }
      })

      return reply.status(201).send({
        success: true,
        data: presupuestoItem,
        message: 'Item agregado al presupuesto exitosamente'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        })
      }

      console.error('Error adding item to presupuesto:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // DELETE /proyectos/:proyectoId/presupuesto/:itemId
  async removeItemFromPresupuesto(request: FastifyRequest<{
    Params: { proyectoId: string, itemId: string }
  }>, reply: FastifyReply) {
    try {
      const { proyectoId, itemId } = request.params

      await prisma.presupuestoItem.delete({
        where: {
          proyectoId_itemId: {
            proyectoId,
            itemId
          }
        }
      })

      return reply.send({
        success: true,
        message: 'Item removido del presupuesto exitosamente'
      })
    } catch (error) {
      console.error('Error removing item from presupuesto:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}