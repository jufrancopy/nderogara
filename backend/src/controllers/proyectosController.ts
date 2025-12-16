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
  imagenUrl: z.string().optional(),
})

// Helper para construir la cláusula de autorización basada en el rol del usuario
const getAuthWhereClause = (user: any, id?: string) => {
  const where: { id?: string; usuarioId?: string; clienteEmail?: string } = {}

  if (id) {
    where.id = id
  }

  switch (user.rol) {
    case 'ADMIN':
      // Los administradores pueden acceder a todo, no se aplica filtro de usuario.
      break
    case 'CLIENTE':
      // Los clientes solo ven proyectos donde su email coincide.
      where.clienteEmail = user.email
      break
    default:
      // Otros roles (CONSTRUCTOR, etc.) solo ven los proyectos que crearon.
      where.usuarioId = user.id
      break
  }
  return where
}

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

      const whereClause = getAuthWhereClause(request.user)

      const proyectos = await prisma.proyecto.findMany({
        where: whereClause,
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
      const whereClause = getAuthWhereClause(request.user, id)

      const proyecto = await prisma.proyecto.findFirst({
        where: whereClause,
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
      const { id: usuarioId } = request.user

      console.log('📝 Creating proyecto with data:', request.body)
      console.log('🖼️ imagenUrl received:', (request.body as any).imagenUrl)
      const validatedData = createProyectoSchema.parse(request.body)
      console.log('✅ Validated data imagenUrl:', validatedData.imagenUrl)

      const proyecto = await prisma.proyecto.create({
        data: {
          ...validatedData,
          usuarioId,
          fechaInicio: validatedData.fechaInicio ? new Date(validatedData.fechaInicio) : null,
          fechaFinEstimada: validatedData.fechaFinEstimada ? new Date(validatedData.fechaFinEstimada) : null,
        },
        include: {
          usuario: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Crear notificación si se asignó un constructor
      if (validatedData.encargadoNombre) {
        try {
          // Buscar el usuario constructor por nombre
          const constructor = await prisma.user.findFirst({
            where: {
              OR: [
                { name: validatedData.encargadoNombre },
                { email: validatedData.encargadoNombre }
              ],
              rol: 'CONSTRUCTOR'
            }
          })

          if (constructor) {
            await prisma.notificacion.create({
              data: {
                titulo: 'Nuevo proyecto asignado',
                mensaje: `Se te ha asignado el proyecto "${proyecto.nombre}". Revisa los detalles y comienza con la planificación.`,
                tipo: 'INFO',
                usuarioId: constructor.id,
                proyectoId: proyecto.id
              }
            })
          }
        } catch (error) {
          console.error('Error creating notification:', error)
          // No fallar la creación del proyecto por error en notificaciones
        }
      }

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
        where: getAuthWhereClause(request.user, id)
      })

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Proyecto no encontrado o sin permisos'
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
        where: getAuthWhereClause(request.user, id)
      })

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Proyecto no encontrado o sin permisos'
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
      
      // 1. Definir los estados válidos (deben coincidir con tu schema de Prisma)
      const estadoSchema = z.object({
        estado: z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'])
      });

      // 2. Validar el cuerpo de la petición
      const { estado } = estadoSchema.parse(request.body);

      const user = request.user;

      const existing = await prisma.proyecto.findFirst({
        // Solo el creador del proyecto o un admin puede cambiar el estado
        where: { 
          id,
          ...(user.rol !== 'ADMIN' && { usuarioId: user.id })
        }
      })

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Proyecto no encontrado o sin permisos para modificar'
        })
      }

      const proyecto = await prisma.proyecto.update({
        where: { id },
        data: { estado }, // 3. Usar el estado ya validado y tipado
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
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Estado inválido',
          details: error.errors
        })
      }

      console.error('Error updating proyecto estado:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // GET /proyectos/:id/financiaciones
  async getFinanciacionesForProyecto(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({ success: false, error: 'No autenticado' });
      }

      const { id: proyectoId } = request.params;

      // 1. Verificar que el usuario tiene acceso a este proyecto
      const projectAuthClause = getAuthWhereClause(request.user, proyectoId);
      const proyecto = await prisma.proyecto.findFirst({ where: projectAuthClause });

      if (!proyecto) {
        return reply.status(404).send({ success: false, error: 'Proyecto no encontrado o sin permisos' });
      }

      // 2. Obtener las financiaciones para el proyecto validado
      //    (Esto asume que tienes un modelo 'financiacion' en Prisma)
      const financiaciones = await prisma.financiacion.findMany({
        where: {
          proyectoId: proyectoId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return reply.send({ success: true, data: financiaciones });

    } catch (error) {
      console.error(`Error fetching financiaciones for proyecto ${request.params.id}:`, error);
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  },
}
