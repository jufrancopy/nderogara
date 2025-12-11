import { FastifyRequest, FastifyReply } from 'fastify';

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (error) {
    reply.status(401).send({ success: false, error: 'Token inválido o no proporcionado' });
  }
};

export const isAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  if ((request.user as any).rol !== 'ADMIN') {
    reply.status(403).send({ success: false, error: 'Acceso denegado. Se requiere rol de administrador' });
  }
};
