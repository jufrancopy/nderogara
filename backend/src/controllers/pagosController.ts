import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Esquemas de validación
const createPagoSchema = z.object({
  etapaId: z.string(),
  itemId: z.string().optional(), // Opcional para pago completo de etapa
  monto: z.number().positive('El monto debe ser mayor a 0'),
  montoTotal: z.number().optional(), // Monto total adeudado
  comprobanteUrl: z.string().optional(),
  notas: z.string().optional()
})

const updatePagoSchema = z.object({
  comprobanteUrl: z.string().optional(),
  estado: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO']).optional(),
  notas: z.string().optional()
})

export const pagosController = {
  // DELETE /proyectos/:proyectoId/presupuesto/:presupuestoItemId/pagos/:pagoId - Eliminar pago de presupuesto
  async deletePresupuestoPago(request: FastifyRequest<{
    Params: { proyectoId: string; presupuestoItemId: string; pagoId: string }
  }>, reply: FastifyReply) {
    try {
      const { pagoId } = request.params
      const user = (request as any).user
      const userRol = user?.rol

      const pagoExistente = await prisma.pagoPresupuestoItem.findUnique({
        where: { id: pagoId },
        include: {
          presupuestoItem: {
            include: { proyecto: true }
          }
        }
      })

      if (!pagoExistente) {
        return reply.status(404).send({
          success: false,
          error: 'Pago no encontrado'
        })
      }

      if (userRol !== 'ADMIN' && pagoExistente.presupuestoItem.proyecto.usuarioId !== user.id) {
        return reply.status(403).send({
          success: false,
          error: 'No tiene permisos para eliminar este pago'
        })
      }

      await prisma.pagoPresupuestoItem.delete({
        where: { id: pagoId }
      })

      return reply.send({
        success: true,
        message: 'Pago eliminado exitosamente'
      })
    } catch (error) {
      console.error('Error deleting presupuesto pago:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },
  // GET /proyectos/:proyectoId/etapas/:etapaId/pagos - Obtener pagos de una etapa
  async getPagosEtapa(request: FastifyRequest<{
    Params: { proyectoId: string, etapaId: string }
  }>, reply: FastifyReply) {
    try {
      const { etapaId } = request.params
      const user = (request as any).user
      const userRol = user?.rol

      // Verificar que el usuario tenga acceso al proyecto
      const etapa = await prisma.etapaObra.findUnique({
        where: { id: etapaId },
        include: { proyecto: true }
      })

      if (!etapa) {
        return reply.status(404).send({
          success: false,
          error: 'Etapa no encontrada'
        })
      }

      // Solo admin puede ver todos los pagos, otros roles solo si son dueños del proyecto
      if (userRol !== 'ADMIN' && etapa.proyecto.usuarioId !== user.id) {
        return reply.status(403).send({
          success: false,
          error: 'No tiene permisos para ver estos pagos'
        })
      }

      const pagos = await prisma.pagoEtapa.findMany({
        where: { etapaId },
        include: {
          item: {
            select: {
              id: true,
              nombre: true,
              unidadMedida: true
            }
          }
        },
        orderBy: { fechaPago: 'desc' }
      })

      return reply.send({
        success: true,
        data: pagos
      })
    } catch (error) {
      console.error('Error fetching pagos:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // POST /proyectos/:proyectoId/etapas/:etapaId/pagos - Crear pago
  async createPago(request: FastifyRequest<{
    Params: { proyectoId: string, etapaId: string }
  }>, reply: FastifyReply) {
    try {
      const { etapaId } = request.params
      const user = (request as any).user
      const userRol = user?.rol

      // Verificar que el usuario tenga acceso al proyecto
      const etapa = await prisma.etapaObra.findUnique({
        where: { id: etapaId },
        include: { proyecto: true }
      })

      if (!etapa) {
        return reply.status(404).send({
          success: false,
          error: 'Etapa no encontrada'
        })
      }

      // Solo admin puede crear pagos para cualquier proyecto
      if (userRol !== 'ADMIN' && etapa.proyecto.usuarioId !== user.id) {
        return reply.status(403).send({
          success: false,
          error: 'No tiene permisos para crear pagos en este proyecto'
        })
      }

      const validatedData = createPagoSchema.parse(request.body)

      const pago = await prisma.pagoEtapa.create({
        data: {
          etapaId: validatedData.etapaId,
          itemId: validatedData.itemId || null,
          monto: validatedData.monto,
          comprobanteUrl: validatedData.comprobanteUrl,
          notas: validatedData.notas,
          estado: 'PENDIENTE'
        },
        include: {
          item: {
            select: {
              id: true,
              nombre: true,
              unidadMedida: true
            }
          },
          etapa: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      })

      return reply.status(201).send({
        success: true,
        data: pago,
        message: 'Pago registrado exitosamente'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Validation error:', error.errors)
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        })
      }

      console.error('❌ Error creating pago:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // PUT /proyectos/:proyectoId/etapas/:etapaId/pagos/:pagoId - Actualizar pago
  async updatePago(request: FastifyRequest<{
    Params: { proyectoId: string, etapaId: string, pagoId: string }
  }>, reply: FastifyReply) {
    try {
      const { pagoId } = request.params
      const user = (request as any).user
      const userRol = user?.rol

      // Verificar que el pago existe y el usuario tenga acceso
      const pagoExistente = await prisma.pagoEtapa.findUnique({
        where: { id: pagoId },
        include: {
          etapa: {
            include: { proyecto: true }
          }
        }
      })

      if (!pagoExistente) {
        return reply.status(404).send({
          success: false,
          error: 'Pago no encontrado'
        })
      }

      // Solo admin puede actualizar pagos de cualquier proyecto
      if (userRol !== 'ADMIN' && pagoExistente.etapa.proyecto.usuarioId !== user.id) {
        return reply.status(403).send({
          success: false,
          error: 'No tiene permisos para actualizar este pago'
        })
      }

      const validatedData = updatePagoSchema.parse(request.body)

      const pago = await prisma.pagoEtapa.update({
        where: { id: pagoId },
        data: validatedData,
        include: {
          item: {
            select: {
              id: true,
              nombre: true,
              unidadMedida: true
            }
          },
          etapa: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      })

      return reply.send({
        success: true,
        data: pago,
        message: 'Pago actualizado exitosamente'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        })
      }

      console.error('Error updating pago:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // DELETE /proyectos/:proyectoId/etapas/:etapaId/pagos/:pagoId - Eliminar pago
  async deletePago(request: FastifyRequest<{
    Params: { proyectoId: string, etapaId: string, pagoId: string }
  }>, reply: FastifyReply) {
    try {
      const { pagoId } = request.params
      const user = (request as any).user
      const userRol = user?.rol

      // Verificar que el pago existe y el usuario tenga acceso
      const pagoExistente = await prisma.pagoEtapa.findUnique({
        where: { id: pagoId },
        include: {
          etapa: {
            include: { proyecto: true }
          }
        }
      })

      if (!pagoExistente) {
        return reply.status(404).send({
          success: false,
          error: 'Pago no encontrado'
        })
      }

      // Solo admin puede eliminar pagos de cualquier proyecto
      if (userRol !== 'ADMIN' && pagoExistente.etapa.proyecto.usuarioId !== user.id) {
        return reply.status(403).send({
          success: false,
          error: 'No tiene permisos para eliminar este pago'
        })
      }

      // Solo se pueden eliminar pagos pendientes
      if (pagoExistente.estado !== 'PENDIENTE') {
        return reply.status(400).send({
          success: false,
          error: 'Solo se pueden eliminar pagos pendientes'
        })
      }

      await prisma.pagoEtapa.delete({
        where: { id: pagoId }
      })

      return reply.send({
        success: true,
        message: 'Pago eliminado exitosamente'
      })
    } catch (error) {
      console.error('Error deleting pago:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}
