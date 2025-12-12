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
        ...(request.body as any),
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
      data: request.body as any,
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

export const getAdminDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Estadísticas generales
    const totalMaterialesCatalogo = await prisma.material.count({
      where: { usuarioId: null, esActivo: true }
    });

    const totalMaterialesProveedores = await prisma.material.count({
      where: { usuarioId: { not: null }, esActivo: true }
    });

    const totalProveedores = await prisma.user.count({
      where: { rol: 'PROVEEDOR_MATERIALES' }
    });

    const totalConstructores = await prisma.user.count({
      where: { rol: 'CONSTRUCTOR' }
    });

    const totalClientes = await prisma.user.count({
      where: { rol: 'CLIENTE' }
    });

    const totalProyectos = await prisma.proyecto.count();

    // Materiales por categoría
    const materialesPorCategoria = await prisma.categoriaMaterial.findMany({
      include: {
        _count: {
          select: { materiales: true }
        }
      }
    });

    // Ofertas recientes
    const ofertasRecientes = await prisma.ofertaProveedor.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        material: true,
        proveedor: {
          include: {
            usuario: true
          }
        }
      }
    });

    // Todos los materiales (catálogo + proveedores)
    const todosLosMateriales = await prisma.material.findMany({
      where: { esActivo: true },
      include: {
        categoria: true,
        usuario: true,
        ofertas: {
          include: {
            proveedor: {
              include: {
                usuario: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limitar para performance
    });

    // Procesar datos para incluir empresa
    const materialesProcesados = todosLosMateriales.map(material => ({
      ...material,
      empresa: material.usuarioId ? material.usuario?.empresa : 'Sistema'
    }));

    reply.send({
      success: true,
      data: {
        stats: {
          totalMaterialesCatalogo,
          totalMaterialesProveedores,
          totalMateriales: totalMaterialesCatalogo + totalMaterialesProveedores,
          totalProveedores,
          totalConstructores,
          totalClientes,
          totalUsuarios: totalProveedores + totalConstructores + totalClientes + 1, // +1 para admin actual
          totalProyectos
        },
        materialesPorCategoria,
        ofertasRecientes,
        todosLosMateriales: materialesProcesados
      }
    });
  } catch (error) {
    console.error('Error al obtener dashboard admin:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener datos del dashboard' });
  }
};
