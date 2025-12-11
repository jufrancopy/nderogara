import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateMaterialCatalogoBody {
  nombre: string;
  descripcion?: string;
  unidad: string;
  categoriaId: string;
  imagenUrl?: string;
}

export const createMaterialCatalogo = async (
  request: FastifyRequest<{ Body: CreateMaterialCatalogoBody }>,
  reply: FastifyReply
) => {
  try {
    const material = await prisma.material.create({
      data: {
        ...request.body,
        usuarioId: null, // null = catálogo público
      },
      include: { 
        categoria: true,
        ofertas: {
          include: {
            proveedor: true
          }
        }
      },
    });

    reply.send({ success: true, data: material });
  } catch (error) {
    console.error('Error al crear material del catálogo:', error);
    reply.status(500).send({ success: false, error: 'Error al crear material' });
  }
};

export const updateMaterialCatalogo = async (
  request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateMaterialCatalogoBody> }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    const material = await prisma.material.findUnique({ where: { id } });
    if (!material || material.usuarioId !== null) {
      return reply.status(404).send({ success: false, error: 'Material del catálogo no encontrado' });
    }

    const updated = await prisma.material.update({
      where: { id },
      data: request.body,
      include: { 
        categoria: true,
        ofertas: {
          include: {
            proveedor: true
          }
        }
      },
    });

    reply.send({ success: true, data: updated });
  } catch (error) {
    console.error('Error al actualizar material:', error);
    reply.status(500).send({ success: false, error: 'Error al actualizar material' });
  }
};

export const getMaterialesCatalogo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const materiales = await prisma.material.findMany({
      where: { 
        usuarioId: null, // Solo materiales del catálogo público
        esActivo: true 
      },
      include: { 
        categoria: true,
        ofertas: {
          include: {
            proveedor: true
          }
        }
      },
      orderBy: { nombre: 'asc' },
    });

    reply.send({ success: true, data: materiales });
  } catch (error) {
    console.error('Error al obtener materiales del catálogo:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener materiales' });
  }
};
