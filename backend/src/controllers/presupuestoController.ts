import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const addItemSchema = z.object({
  itemId: z.string(),
  cantidadMedida: z.number().positive(),
  esDinamico: z.boolean().optional().default(false)
})

// Función helper para calcular costo dinámico
async function calcularCostoDinamico(presupuestoItemId: string) {
  // Obtener pagos aprobados - solo estos cuentan para el costo dinámico
  const pagos = await prisma.pagoPresupuestoItem.findMany({
    where: {
      presupuestoItemId,
      estado: 'APROBADO' // Solo pagos aprobados cuentan para el costo
    }
  })

  // Costo dinámico = suma de todos los pagos realizados
  const totalPagos = pagos.reduce((sum, pago) => sum + Number(pago.montoPagado), 0)
  return totalPagos
}

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

      // Para items dinámicos, el costo inicial es 0 y se calcula posteriormente con los pagos
      const costoManoObra = validatedData.esDinamico ? 0 : Number(item.manoObraUnitaria || 0) * validatedData.cantidadMedida
      const costoTotal = validatedData.esDinamico ? 0 : costoMateriales + costoManoObra

      // Crear el item del presupuesto
      const presupuestoItem = await prisma.presupuestoItem.create({
        data: {
          proyectoId,
          itemId: validatedData.itemId,
          cantidadMedida: validatedData.cantidadMedida,
          costoMateriales: validatedData.esDinamico ? 0 : costoMateriales,
          costoManoObra,
          costoTotal,
          esDinamico: validatedData.esDinamico
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
  },

  // PUT /proyectos/:proyectoId/presupuesto/:presupuestoItemId
  async updatePresupuestoItem(request: FastifyRequest<{
    Params: { proyectoId: string, presupuestoItemId: string }
    Body: { cantidadMedida?: number, esDinamico?: boolean }
  }>, reply: FastifyReply) {
    try {
      const { proyectoId, presupuestoItemId } = request.params
      const { cantidadMedida, esDinamico } = request.body

      // Verificar que el presupuestoItem pertenece al proyecto
      const existingItem = await prisma.presupuestoItem.findFirst({
        where: {
          id: presupuestoItemId,
          proyectoId
        }
      })

      if (!existingItem) {
        return reply.status(404).send({
          success: false,
          error: 'Item del presupuesto no encontrado'
        })
      }

      // Preparar datos de actualización
      const updateData: any = {}

      if (cantidadMedida !== undefined) {
        updateData.cantidadMedida = cantidadMedida
      }

      if (esDinamico !== undefined) {
        updateData.esDinamico = esDinamico
      }

      // Actualizar el item
      const presupuestoItem = await prisma.presupuestoItem.update({
        where: { id: presupuestoItemId },
        data: updateData,
        include: {
          item: true
        }
      })

      return reply.send({
        success: true,
        data: presupuestoItem,
        message: 'Item del presupuesto actualizado exitosamente'
      })

    } catch (error) {
      console.error('Error updating presupuesto item:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // PUT /proyectos/:id/presupuesto/reordenar
  async reordenarPresupuestoItems(request: FastifyRequest<{
    Params: { id: string }
    Body: { itemIds: string[] }
  }>, reply: FastifyReply) {
    try {
      const { id: proyectoId } = request.params
      const { itemIds } = request.body

      // Validar que itemIds sea un array
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'itemIds debe ser un array no vacío'
        })
      }

      // Verificar que todos los itemIds pertenecen al proyecto
      const presupuestoItems = await prisma.presupuestoItem.findMany({
        where: {
          proyectoId,
          id: { in: itemIds }
        }
      })

      if (presupuestoItems.length !== itemIds.length) {
        return reply.status(400).send({
          success: false,
          error: 'Algunos items no pertenecen a este proyecto'
        })
      }

      // Actualizar el orden de cada item usando una transacción
      const updatePromises = itemIds.map((itemId, index) =>
        prisma.presupuestoItem.update({
          where: { id: itemId },
          data: { orden: index }
        })
      )

      await prisma.$transaction(updatePromises)

      return reply.send({
        success: true,
        message: 'Orden del presupuesto actualizado exitosamente'
      })

    } catch (error) {
      console.error('Error reordenando presupuesto items:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // POST /proyectos/:id/presupuesto/:presupuestoItemId/pagos
  async crearPagoPresupuestoItem(request: FastifyRequest<{
    Params: { id: string, presupuestoItemId: string }
    Body: { montoPagado: number, comprobanteUrl: string, notas?: string }
  }>, reply: FastifyReply) {
    try {
      const { id: proyectoId, presupuestoItemId } = request.params
      const { montoPagado, comprobanteUrl, notas } = request.body

      // Verificar que el presupuestoItem pertenece al proyecto
      const presupuestoItem = await prisma.presupuestoItem.findFirst({
        where: {
          id: presupuestoItemId,
          proyectoId
        }
      })

      if (!presupuestoItem) {
        return reply.status(404).send({
          success: false,
          error: 'Item del presupuesto no encontrado'
        })
      }

      // Crear el pago y marcarlo como aprobado automáticamente
      const pago = await prisma.pagoPresupuestoItem.create({
        data: {
          presupuestoItemId,
          proyectoId,
          montoPagado,
          comprobanteUrl,
          notas,
          estado: 'APROBADO' // Marcar como aprobado automáticamente
        }
      })

      // Si el item es dinámico, recalcular el costo total inmediatamente
      const itemDinamico = await prisma.presupuestoItem.findUnique({
        where: { id: presupuestoItemId },
        select: { esDinamico: true }
      })

      if (itemDinamico?.esDinamico) {
        const costoDinamico = await calcularCostoDinamico(presupuestoItemId)
        await prisma.presupuestoItem.update({
          where: { id: presupuestoItemId },
          data: { costoTotal: costoDinamico }
        })
      }

      return reply.status(201).send({
        success: true,
        data: pago,
        message: 'Pago registrado exitosamente'
      })

    } catch (error) {
      console.error('Error creando pago de presupuesto item:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // GET /proyectos/:id/presupuesto/:presupuestoItemId/pagos
  async obtenerPagosPresupuestoItem(request: FastifyRequest<{
    Params: { id: string, presupuestoItemId: string }
  }>, reply: FastifyReply) {
    try {
      const { id: proyectoId, presupuestoItemId } = request.params

      // Verificar que el presupuestoItem pertenece al proyecto
      const presupuestoItem = await prisma.presupuestoItem.findFirst({
        where: {
          id: presupuestoItemId,
          proyectoId
        }
      })

      if (!presupuestoItem) {
        return reply.status(404).send({
          success: false,
          error: 'Item del presupuesto no encontrado'
        })
      }

      // Obtener todos los pagos del item
      const pagos = await prisma.pagoPresupuestoItem.findMany({
        where: { presupuestoItemId },
        orderBy: { fechaPago: 'desc' }
      })

      return reply.send({
        success: true,
        data: pagos
      })

    } catch (error) {
      console.error('Error obteniendo pagos de presupuesto item:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // PUT /proyectos/:id/presupuesto/:presupuestoItemId/pagos/:pagoId/estado
  async actualizarEstadoPagoPresupuestoItem(request: FastifyRequest<{
    Params: { id: string, presupuestoItemId: string, pagoId: string }
    Body: { estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' }
  }>, reply: FastifyReply) {
    try {
      const { id: proyectoId, presupuestoItemId, pagoId } = request.params
      const { estado } = request.body

      // Verificar que el pago pertenece al proyecto y presupuestoItem
      const pago = await prisma.pagoPresupuestoItem.findFirst({
        where: {
          id: pagoId,
          presupuestoItemId,
          proyectoId
        }
      })

      if (!pago) {
        return reply.status(404).send({
          success: false,
          error: 'Pago no encontrado'
        })
      }

      // Actualizar el estado del pago
      const pagoActualizado = await prisma.pagoPresupuestoItem.update({
        where: { id: pagoId },
        data: { estado }
      })

      // Si el item es dinámico y el pago se aprobó, recalcular el costo total
      if (estado === 'APROBADO') {
        const costoDinamico = await calcularCostoDinamico(presupuestoItemId)

        await prisma.presupuestoItem.update({
          where: { id: presupuestoItemId },
          data: { costoTotal: costoDinamico }
        })
      }

      return reply.send({
        success: true,
        data: pagoActualizado,
        message: 'Estado del pago actualizado exitosamente'
      })

    } catch (error) {
      console.error('Error actualizando estado de pago:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}
