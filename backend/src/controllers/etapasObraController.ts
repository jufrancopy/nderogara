import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const createEtapaSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  orden: z.number().int().positive(),
  fechaInicioPlaneada: z.string().optional(),
  fechaFinPlaneada: z.string().optional()
})

const updateEtapaSchema = z.object({
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  fechaInicioPlaneada: z.string().optional(),
  fechaFinPlaneada: z.string().optional(),
  fechaInicioReal: z.string().optional(),
  fechaFinReal: z.string().optional(),
  estado: z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'ATRASADA', 'CANCELADA']).optional(),
  observaciones: z.string().optional()
})

export const etapasObraController = {
  // GET /proyectos/:id/etapas
  async getEtapasByProyecto(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id: proyectoId } = request.params

      const etapas = await prisma.etapaObra.findMany({
        where: { proyectoId },
        include: {
          materialesExtra: {
            include: {
              material: true
            }
          }
        },
        orderBy: { orden: 'asc' }
      })

      return reply.send({
        success: true,
        data: etapas
      })
    } catch (error) {
      console.error('Error fetching etapas:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // POST /proyectos/:id/etapas
  async createEtapa(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id: proyectoId } = request.params
      const validatedData = createEtapaSchema.parse(request.body)

      const etapa = await prisma.etapaObra.create({
        data: {
          ...validatedData,
          proyectoId,
          fechaInicioPlaneada: validatedData.fechaInicioPlaneada ? new Date(validatedData.fechaInicioPlaneada) : null,
          fechaFinPlaneada: validatedData.fechaFinPlaneada ? new Date(validatedData.fechaFinPlaneada) : null
        }
      })

      return reply.status(201).send({
        success: true,
        data: etapa,
        message: 'Etapa creada exitosamente'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        })
      }

      console.error('Error creating etapa:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // PUT /proyectos/:proyectoId/etapas/:etapaId
  async updateEtapa(request: FastifyRequest<{ 
    Params: { proyectoId: string, etapaId: string } 
  }>, reply: FastifyReply) {
    try {
      const { etapaId } = request.params
      const validatedData = updateEtapaSchema.parse(request.body)

      const updateData: any = { ...validatedData }
      
      if (validatedData.fechaInicioPlaneada) {
        updateData.fechaInicioPlaneada = new Date(validatedData.fechaInicioPlaneada)
      }
      if (validatedData.fechaFinPlaneada) {
        updateData.fechaFinPlaneada = new Date(validatedData.fechaFinPlaneada)
      }
      if (validatedData.fechaInicioReal) {
        updateData.fechaInicioReal = new Date(validatedData.fechaInicioReal)
      }
      if (validatedData.fechaFinReal) {
        updateData.fechaFinReal = new Date(validatedData.fechaFinReal)
      }

      const etapa = await prisma.etapaObra.update({
        where: { id: etapaId },
        data: updateData,
        include: {
          materialesExtra: {
            include: {
              material: true
            }
          }
        }
      })

      return reply.send({
        success: true,
        data: etapa,
        message: 'Etapa actualizada exitosamente'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        })
      }

      console.error('Error updating etapa:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // DELETE /proyectos/:proyectoId/etapas/:etapaId
  async deleteEtapa(request: FastifyRequest<{ 
    Params: { proyectoId: string, etapaId: string } 
  }>, reply: FastifyReply) {
    try {
      const { etapaId } = request.params

      await prisma.etapaObra.delete({
        where: { id: etapaId }
      })

      return reply.send({
        success: true,
        message: 'Etapa eliminada exitosamente'
      })
    } catch (error) {
      console.error('Error deleting etapa:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // POST /proyectos/:proyectoId/etapas/:etapaId/materiales-extra
  async addMaterialExtra(request: FastifyRequest<{ 
    Params: { proyectoId: string, etapaId: string }
    Body: { materialId: string, cantidad: number, costoUnitario: number, motivo?: string }
  }>, reply: FastifyReply) {
    try {
      const { etapaId } = request.params
      const { materialId, cantidad, costoUnitario, motivo } = request.body

      const costoTotal = cantidad * costoUnitario

      const materialExtra = await prisma.materialExtraEtapa.create({
        data: {
          etapaId,
          materialId,
          cantidad,
          costoUnitario,
          costoTotal,
          motivo
        },
        include: {
          material: true
        }
      })

      return reply.status(201).send({
        success: true,
        data: materialExtra,
        message: 'Material extra agregado exitosamente'
      })
    } catch (error) {
      console.error('Error adding material extra:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}