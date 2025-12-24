import { FastifyInstance } from 'fastify';
import { getPerfil, updatePerfil, getAllProveedores, getOfertasByProveedor } from '../controllers/proveedorController';

export default async function proveedorRoutes(fastify: FastifyInstance) {
  // Rutas que requieren rol de proveedor
  fastify.register(async function (proveedorOnlyRoutes) {
    proveedorOnlyRoutes.addHook('onRequest', async (request, reply) => {
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

    proveedorOnlyRoutes.get('/perfil-info', getPerfil);
    proveedorOnlyRoutes.put('/perfil-info', updatePerfil);
  });

  // Rutas accesibles para Admin y Constructor también
  fastify.register(async function (adminConstructorRoutes) {
    adminConstructorRoutes.addHook('onRequest', async (request, reply) => {
      try {
        await request.jwtVerify();
        const user = request.user as any;

        // Verificar que sea admin, constructor o proveedor
        if (!['ADMIN', 'CONSTRUCTOR', 'PROVEEDOR_MATERIALES'].includes(user.rol)) {
          reply.status(403).send({ error: 'Acceso denegado.' });
        }
      } catch (err) {
        reply.status(401).send({ error: 'No autorizado' });
      }
    });

    // Obtener todos los proveedores con estadísticas
    adminConstructorRoutes.get('/', getAllProveedores);

    // Obtener ofertas de un proveedor específico
    adminConstructorRoutes.get('/:id/ofertas', getOfertasByProveedor);
  });
}
