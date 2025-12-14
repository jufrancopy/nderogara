import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const constructorController = {
  // GET /constructor/dashboard
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const userId = user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'No autenticado'
        });
      }

      // Obtener proyectos del constructor
      const proyectos = await prisma.proyecto.findMany({
        where: {
          encargadoNombre: {
            not: null // Solo proyectos que tienen encargado asignado
          },
          OR: [
            // Proyectos donde el constructor es el encargado
            {
              encargadoNombre: {
                equals: user.name || user.email // Comparar con nombre o email del usuario
              }
            }
          ]
        },
        include: {
          presupuestoItems: {
            include: {
              item: true
            }
          },
          etapasObra: {
            select: {
              id: true,
              nombre: true,
              estado: true,
              orden: true
            }
          },
          _count: {
            select: {
              presupuestoItems: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Calcular estadísticas
      const stats = {
        totalProyectos: proyectos.length,
        proyectosActivos: proyectos.filter(p => p.estado === 'EN_PROGRESO').length,
        proyectosCompletados: proyectos.filter(p => p.estado === 'COMPLETADO').length,
        totalPresupuesto: proyectos.reduce((total, proyecto) => {
          return total + proyecto.presupuestoItems.reduce((sum, item) => sum + Number(item.costoTotal), 0)
        }, 0)
      };

      // Obtener notificaciones del usuario
      const notificaciones = await prisma.notificacion.findMany({
        where: {
          usuarioId: userId
        },
        include: {
          proyecto: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      return reply.send({
        success: true,
        data: {
          proyectos,
          notificaciones,
          stats
        }
      });
    } catch (error) {
      console.error('Error fetching constructor dashboard:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}
