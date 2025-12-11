import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function proyectosReferenciaRoutes(fastify: FastifyInstance) {
  // GET /proyectos/referencia - Público
  fastify.get('/referencia', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const proyectos = await prisma.proyecto.findMany({
        where: { esReferencia: true },
        include: {
          _count: {
            select: { presupuestoItems: true }
          }
        },
        orderBy: { superficieTotal: 'asc' }
      });

      reply.send({ success: true, data: proyectos });
    } catch (error) {
      console.error('Error fetching proyectos referencia:', error);
      reply.status(500).send({ success: false, error: 'Error al cargar proyectos' });
    }
  });

  // GET /proyectos/referencia/:id - Público
  fastify.get('/referencia/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const proyecto = await prisma.proyecto.findFirst({
        where: { id, esReferencia: true },
        include: {
          presupuestoItems: {
            include: {
              item: {
                include: {
                  materialesPorItem: {
                    include: {
                      material: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!proyecto) {
        return reply.status(404).send({ success: false, error: 'Proyecto no encontrado' });
      }

      reply.send({ success: true, data: proyecto });
    } catch (error) {
      console.error('Error fetching proyecto referencia:', error);
      reply.status(500).send({ success: false, error: 'Error al cargar proyecto' });
    }
  });
}
