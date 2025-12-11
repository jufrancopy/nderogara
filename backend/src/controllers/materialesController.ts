import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const materialesController = {
  // GET /materiales - Lista materiales con sus ofertas
  async getMateriales(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      
      const materiales = await prisma.material.findMany({
        where: userId ? {
          OR: [
            { usuarioId: null }, // Materiales del catálogo
            { usuarioId: userId } // Materiales personalizados del usuario
          ]
        } : {
          usuarioId: null // Solo catálogo si no está autenticado
        },
        include: {
          categoria: true,
          ofertas: {
            where: { stock: true },
            include: {
              proveedor: {
                select: {
                  nombre: true,
                  logo: true
                }
              }
            },
            orderBy: { precio: 'asc' }
          }
        },
        orderBy: { nombre: 'asc' }
      });

      reply.send({ success: true, data: materiales });
    } catch (error) {
      console.error('Error fetching materiales:', error);
      reply.status(500).send({ success: false, error: 'Error al cargar materiales' });
    }
  },

  // GET /materiales/:id - Detalle de material con todas sus ofertas
  async getMaterialById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const material = await prisma.material.findUnique({
        where: { id },
        include: {
          categoria: true,
          ofertas: {
            include: {
              proveedor: true
            },
            orderBy: { precio: 'asc' }
          }
        }
      });

      if (!material) {
        return reply.status(404).send({ success: false, error: 'Material no encontrado' });
      }

      reply.send({ success: true, data: material });
    } catch (error) {
      console.error('Error fetching material:', error);
      reply.status(500).send({ success: false, error: 'Error al cargar material' });
    }
  }
};
