import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const notificationsController = {
  // PUT /notificaciones/:id/leer
  async marcarComoLeida(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const userId = user?.id;
      const { id } = request.params;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'No autenticado'
        });
      }

      // Verificar que la notificación pertenece al usuario
      const notificacion = await prisma.notificacion.findFirst({
        where: {
          id,
          usuarioId: userId
        }
      });

      if (!notificacion) {
        return reply.status(404).send({
          success: false,
          error: 'Notificación no encontrada'
        });
      }

      // Marcar como leída
      await prisma.notificacion.update({
        where: { id },
        data: { leida: true }
      });

      return reply.send({
        success: true,
        message: 'Notificación marcada como leída'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}
