import { FastifyInstance } from 'fastify';
import { getUsers, createUser, updateUser, deleteUser, updateUserImage } from '../controllers/adminUsersController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

export default async function adminUsersRoutes(fastify: FastifyInstance) {
  // Aplicar middleware de autenticación y admin a todas las rutas
  fastify.addHook('preHandler', authenticateToken);
  fastify.addHook('preHandler', requireAdmin);

  // Obtener todos los usuarios
  fastify.get('/', getUsers);

  // Crear nuevo usuario
  fastify.post('/', createUser);

  // Actualizar usuario
  fastify.put('/:id', updateUser);

  // Eliminar usuario
  fastify.delete('/:id', deleteUser);

  // Actualizar imagen de usuario
  fastify.post('/:id/image', updateUserImage);
}