import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Esquemas de validación
const createProyectoSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  superficieTotal: z.number().positive().optional(),
  direccion: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFinEstimada: z.string().optional(),
  margenGanancia: z.number().min(0).max(100).optional(),
  moneda: z.string().default('COP'),
  clienteNombre: z.string().optional(),
  clienteTelefono: z.string().optional(),
  clienteEmail: z.string().email().optional(),
  encargadoNombre: z.string().optional(),
  encargadoTelefono: z.string().optional(),
})

export const proyectosController = {
  // GET /proyectos
  async getProyectos(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'No autenticado'
        })
      }

      const proyectos = await prisma.proyecto.findMany({
        where: { usuarioId: (request.user as any).id },
        include: {
          usuario: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { presupuestoItems: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return reply.send({
        success: true,
        data: proyectos
      })
    } catch (error) {
      console.error('Error fetching proyectos:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // GET /proyectos/:id
  async getProyectoById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'No autenticado'
        })
      }

      const { id } = request.params

      const proyecto = await prisma.proyecto.findFirst({
        where: { 
          id,
          usuarioId: (request.user as any).id
        },
        include: {
          usuario: {
            select: { id: true, name: true, email: true }
          },
          presupuestoItems: {
            include: {
              item: true
            }
          },
          cotizaciones: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!proyecto) {
        return reply.status(404).send({
          success: false,
          error: 'Proyecto no encontrado'
        })
      }

      return reply.send({
        success: true,
        data: proyecto
      })
    } catch (error) {
      console.error('Error fetching proyecto:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // POST /proyectos
  async createProyecto(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'No autenticado',
        })
      }
      const usuarioId = (request.user as any).id

      console.log('📝 Creating proyecto with data:', request.body)
      const validatedData = createProyectoSchema.parse(request.body)

      const proyecto = await prisma.proyecto.create({
        data: {
          ...validatedData,
          usuarioId: usuarioId,
          fechaInicio: validatedData.fechaInicio ? new Date(validatedData.fechaInicio) : null,
          fechaFinEstimada: validatedData.fechaFinEstimada ? new Date(validatedData.fechaFinEstimada) : null,
        },
        include: {
          usuario: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      return reply.status(201).send({
        success: true,
        data: proyecto,
        message: 'Proyecto creado exitosamente'
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

      console.error('❌ Error creating proyecto:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // PUT /proyectos/:id
  async updateProyecto(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'No autenticado'
        })
      }

      const { id } = request.params
      const validatedData = createProyectoSchema.partial().parse(request.body)

      const existing = await prisma.proyecto.findFirst({
        where: { id, usuarioId: request.user.id }
      })

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Proyecto no encontrado'
        })
      }

      const proyecto = await prisma.proyecto.update({
        where: { id },
        data: {
          ...validatedData,
          fechaInicio: validatedData.fechaInicio ? new Date(validatedData.fechaInicio) : undefined,
          fechaFinEstimada: validatedData.fechaFinEstimada ? new Date(validatedData.fechaFinEstimada) : undefined,
        },
        include: {
          usuario: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      return reply.send({
        success: true,
        data: proyecto,
        message: 'Proyecto actualizado exitosamente'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        })
      }

      console.error('Error updating proyecto:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // DELETE /proyectos/:id
  async deleteProyecto(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'No autenticado'
        })
      }

      const { id } = request.params

      const existing = await prisma.proyecto.findFirst({
        where: { id, usuarioId: (request.user as any).id }
      })

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Proyecto no encontrado'
        })
      }

      await prisma.proyecto.delete({
        where: { id }
      })

      return reply.send({
        success: true,
        message: 'Proyecto eliminado exitosamente'
      })
    } catch (error) {
      console.error('Error deleting proyecto:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // PUT /proyectos/:id/estado
  async updateEstadoProyecto(request: FastifyRequest<{ 
    Params: { id: string }
    Body: { estado: string }
  }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'No autenticado'
        })
      }

      const { id } = request.params
      const { estado } = request.body

      const existing = await prisma.proyecto.findFirst({
        where: { id, usuarioId: (request.user as any).id }
      })

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Proyecto no encontrado'
        })
      }

      const proyecto = await prisma.proyecto.update({
        where: { id },
        data: { estado: estado as any },
        include: {
          usuario: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      return reply.send({
        success: true,
        data: proyecto,
        message: 'Estado del proyecto actualizado'
      })
    } catch (error) {
      console.error('Error updating proyecto estado:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}