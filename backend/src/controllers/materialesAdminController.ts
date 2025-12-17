import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateMaterialCatalogoBody {
  nombre: string;
  descripcion?: string;
  unidad: string;
  categoriaId: string;
  imagenUrl?: string;
  precioUnitario?: number;
  precioBase?: number;
  observaciones?: string;
}

export const createMaterialCatalogo = async (
  request: FastifyRequest<{ Body: CreateMaterialCatalogoBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user as any;

    // Extraer campos del formulario
    const {
      nombre,
      unidad,
      categoriaId,
      imagenUrl,
      precioUnitario,
      precioBase,
      observaciones,
      tipoCalidad,
      marca,
      proveedor,
      telefonoProveedor,
      stockMinimo
    } = request.body as any;

    // 1. Crear el material en el catálogo
    const material = await prisma.material.create({
      data: {
        nombre,
        descripcion: observaciones,
        unidad,
        categoriaId,
        imagenUrl,
        precio: precioUnitario,
        precioBase: precioBase ? parseFloat(precioBase) : null,
        usuarioId: null, // null = catálogo público
        esActivo: true
      },
      include: {
        categoria: true
      },
    });

    // 2. Si se proporcionó información de precio, crear una oferta automática
    // Esto simula que el admin está "ofreciendo" este material
    let ofertaCreada = null;
    if (precioUnitario && proveedor) {
      try {
        // Buscar o crear el proveedor admin (usuario admin actuando como proveedor)
        let proveedorAdmin = await prisma.proveedor.findFirst({
          where: { usuarioId: user.id }
        });

        // Si no existe, crear el proveedor admin
        if (!proveedorAdmin) {
          proveedorAdmin = await prisma.proveedor.create({
            data: {
              nombre: proveedor,
              email: user.email,
              telefono: telefonoProveedor || user.telefono,
              sitioWeb: null,
              logo: null,
              esActivo: true,
              usuarioId: user.id,
              latitud: null,
              longitud: null,
              ciudad: null,
              departamento: null
            }
          });
        }

        // Crear la oferta
        ofertaCreada = await prisma.ofertaProveedor.create({
          data: {
            materialId: material.id,
            proveedorId: proveedorAdmin.id,
            precio: parseFloat(precioUnitario),
            tipoCalidad: tipoCalidad || 'COMUN',
            marca: marca || null,
            comisionPorcentaje: 0, // Admin no paga comisión
            stock: stockMinimo ? parseInt(stockMinimo) > 0 : true,
            vigenciaHasta: null, // Sin límite
            observaciones: observaciones || null
          },
          include: {
            proveedor: true
          }
        });

        console.log('✅ Oferta automática creada para material del catálogo');
      } catch (ofertaError) {
        console.error('⚠️ Error creando oferta automática:', ofertaError);
        // No fallar la creación del material si falla la oferta
      }
    }

    // 3. Devolver el material con sus ofertas (incluyendo la nueva si se creó)
    const materialCompleto = await prisma.material.findUnique({
      where: { id: material.id },
      include: {
        categoria: true,
        ofertas: {
          include: {
            proveedor: true
          }
        }
      }
    });

    reply.send({ success: true, data: materialCompleto });
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

export const getMaterialCatalogoById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    const material = await prisma.material.findFirst({
      where: {
        id,
        usuarioId: null // Solo materiales del catálogo público
      },
      include: {
        categoria: true,
        ofertas: {
          include: {
            proveedor: true
          }
        }
      }
    });

    if (!material) {
      return reply.status(404).send({ success: false, error: 'Material del catálogo no encontrado' });
    }

    reply.send({ success: true, data: material });
  } catch (error) {
    console.error('Error al obtener material del catálogo:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener material' });
  }
};

export const getMaterialesCatalogo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const materiales = await prisma.material.findMany({
      where: {
        usuarioId: null // Solo materiales del catálogo público (sin filtrar por esActivo)
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

export const deleteMaterialCatalogo = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    const material = await prisma.material.findUnique({ where: { id } });
    if (!material || material.usuarioId !== null) {
      return reply.status(404).send({ success: false, error: 'Material del catálogo no encontrado' });
    }

    await prisma.material.delete({ where: { id } });

    reply.send({ success: true, message: 'Material eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar material del catálogo:', error);
    reply.status(500).send({ success: false, error: 'Error al eliminar material' });
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
