import { FastifyInstance } from 'fastify';
import { getUsers, createUser, updateUser, deleteUser, updateUserImage } from '../controllers/adminUsersController';
import { authenticate, isAdmin } from '../middleware/auth';

export default async function adminUsersRoutes(fastify: FastifyInstance) {
  // Aplicar middleware de autenticación y admin a todas las rutas
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', isAdmin);

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