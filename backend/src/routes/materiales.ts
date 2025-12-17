import { FastifyInstance } from 'fastify';
import { materialesController } from '../controllers/materialesController';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function materialesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      // Permitir acceso sin auth para ver catálogo público
    }
  });

  fastify.get('/', materialesController.getMateriales);
  fastify.get('/:id', materialesController.getMaterialById);

  // PUT /materiales/:id - Actualizar material (redirige según tipo)
  fastify.put('/:id', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
      const { id } = request.params;
      const user = request.user as any;

      // Determinar el tipo de material
      const material = await prisma.material.findUnique({
        where: { id },
        select: { usuarioId: true }
      });

      if (!material) {
        return reply.status(404).send({ success: false, error: 'Material no encontrado' });
      }

      // Verificar permisos
      const puedeEditar = user.rol === 'ADMIN' ||
                         (material.usuarioId !== null && material.usuarioId === user.id);

      if (!puedeEditar) {
        return reply.status(403).send({ success: false, error: 'No tienes permisos para editar este material' });
      }

      // Redirigir según tipo de material
      if (material.usuarioId === null) {
        // Material del catálogo - usar controlador admin
        const { updateMaterialCatalogo } = await import('../controllers/materialesAdminController');
        return updateMaterialCatalogo(request, reply);
      } else {
        // Material de proveedor - usar controlador proveedor
        const { actualizarMaterial } = await import('../controllers/proveedorMaterialesController');
        return actualizarMaterial(request, reply);
      }

    } catch (error) {
      console.error('Error en PUT /materiales/:id:', error);
      reply.status(500).send({ success: false, error: 'Error interno del servidor' });
    }
  });
}
