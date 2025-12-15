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
        select: {
          id: true,
          nombre: true,
          manoObraUnitaria: true,
          unidadMedida: true,
          materialesPorItem: {
            select: {
              id: true,
              cantidadPorUnidad: true,
              material: {
                select: {
                  id: true,
                  nombre: true,
                  precio: true,
                  precioBase: true,
                  ofertas: {
                    select: {
                      precio: true,
                      stock: true
                    },
                    where: { stock: true }
                  }
                }
              }
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
        // Prioridad: 1) Ofertas disponibles, 2) Precio base, 3) Precio personalizado
        let precioUnitario = 0

        // Buscar ofertas activas con stock
        const ofertasActivas = materialItem.material.ofertas?.filter(oferta => oferta.stock === true) || []
        if (ofertasActivas.length > 0) {
          // Usar la oferta más económica
          precioUnitario = Math.min(...ofertasActivas.map(o => Number(o.precio)))
          console.log(`💰 Material: ${materialItem.material.nombre} - Usando oferta: ${precioUnitario}`)
        } else if (materialItem.material.precioBase) {
          // Usar precio base si no hay ofertas
          precioUnitario = Number(materialItem.material.precioBase)
          console.log(`💰 Material: ${materialItem.material.nombre} - Usando precio base: ${precioUnitario}`)
        } else if (materialItem.material.precio) {
          // Usar precio personalizado como último recurso
          precioUnitario = Number(materialItem.material.precio)
          console.log(`💰 Material: ${materialItem.material.nombre} - Usando precio personalizado: ${precioUnitario}`)
        }

        const cantidadPorUnidad = Number(materialItem.cantidadPorUnidad)
        const costoMaterial = precioUnitario * cantidadPorUnidad

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
