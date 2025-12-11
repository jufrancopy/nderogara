import { FastifyRequest, FastifyReply } from 'fastify'

export function hasRole(roles: string[]) {
  return async (request: FastifyRequest & { user?: any }, reply: FastifyReply) => {
    try {
      // Verificar si el usuario está autenticado
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'No autenticado',
        })
      }

      const userRole = request.user.rol

      if (!userRole) {
        return reply.status(403).send({
          success: false,
          error: 'Rol de usuario no definido',
        })
      }

      if (!roles.includes(userRole)) {
        return reply.status(403).send({
          success: false,
          error: 'No tienes permiso para realizar esta acción',
        })
      }
    } catch (error) {
      console.error('Error en middleware hasRole:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor',
      })
    }
  }
}

// Exportamos el middleware como una función que se puede registrar en Fastify
export const hasRolePlugin = async (fastify: any) => {
  fastify.decorate('hasRole', hasRole)
}