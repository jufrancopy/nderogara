import { FastifyInstance } from 'fastify';
import { getInmuebles, getInmuebleById, crearInmueble, getMisInmuebles, actualizarInmueble, eliminarInmueble } from '../controllers/inmueblesController';

export const inmueblesRoutes = async (fastify: FastifyInstance) => {
  // Rutas públicas
  fastify.get('/', getInmuebles);
  fastify.get('/:id', getInmuebleById);

  // Rutas autenticadas
  fastify.register(async function (fastify) {
    fastify.addHook('onRequest', async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ success: false, error: 'No autorizado' });
      }
    });

    fastify.get('/mis-inmuebles', getMisInmuebles);
    fastify.post('/', crearInmueble);
    fastify.put('/:id', actualizarInmueble);
    fastify.delete('/:id', eliminarInmueble);
  });
};