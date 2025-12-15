import { FastifyInstance } from 'fastify';
import { getMaterialesBase, getMisMateriales, crearMaterial, crearOfertaDesdeBase, actualizarMaterial, eliminarMaterial } from '../controllers/proveedorMaterialesController';

export default async function proveedorMaterialesRoutes(fastify: FastifyInstance) {
  // Todas las rutas requieren autenticación
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user as any;

      console.log('Usuario en middleware proveedorMateriales:', user);
      console.log('Rol del usuario:', user.rol);

      // Verificar que sea proveedor de materiales, constructor o proveedor de servicios
      if (user.rol !== 'PROVEEDOR_MATERIALES' && user.rol !== 'CONSTRUCTOR' && user.rol !== 'PROVEEDOR_SERVICIOS') {
        console.log('Acceso denegado - rol no autorizado:', user.rol);
        reply.status(403).send({ error: 'Acceso denegado. Solo proveedores autorizados.' });
      }
    } catch (err) {
      console.log('Error de autenticación:', err);
      reply.status(401).send({ error: 'No autorizado' });
    }
  });

  fastify.get('/materiales-base', getMaterialesBase);
  fastify.get('/mis-materiales', getMisMateriales);
  fastify.post('/materiales', crearMaterial);
  fastify.post('/ofertas-desde-base', crearOfertaDesdeBase);
  fastify.put('/materiales/:id', actualizarMaterial);
  fastify.delete('/materiales/:id', eliminarMaterial);
}
