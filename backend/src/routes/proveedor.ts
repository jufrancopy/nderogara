import { FastifyInstance } from 'fastify';
import { getPerfil, updatePerfil } from '../controllers/proveedorController';

export default async function proveedorRoutes(fastify: FastifyInstance) {
  // Todas las rutas requieren autenticación y rol de proveedor
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;

      // Verificar que sea proveedor de materiales
      if (user.rol !== 'PROVEEDOR_MATERIALES') {
        reply.status(403).send({ error: 'Acceso denegado. Solo para proveedores.' });
      }
    } catch (err) {
      reply.status(401).send({ error: 'No autorizado' });
    }
  });

  fastify.get('/perfil-info', getPerfil);
  fastify.put('/perfil-info', updatePerfil);
}
