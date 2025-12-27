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
  proveedorId?: string; // ID del proveedor seleccionado
  proveedor?: string; // Nombre del proveedor (legacy)
  telefonoProveedor?: string;
  tipoCalidad?: string;
  marca?: string;
  stockMinimo?: string;
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
      proveedorId,
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

    // 2. Si se proporcionó información de precio y proveedor, crear una oferta automática
    let ofertaCreada = null;
    if (precioUnitario && (proveedorId || proveedor)) {
      try {
        let proveedorUsado;

        // Si se proporcionó proveedorId, usar ese proveedor existente
        if (proveedorId) {
          proveedorUsado = await prisma.proveedor.findUnique({
            where: { id: proveedorId }
          });

          if (!proveedorUsado) {
            console.error('⚠️ Proveedor especificado no encontrado:', proveedorId);
            // No fallar la creación del material si el proveedor no existe
          }
        } else if (proveedor) {
          // Lógica legacy: Buscar o crear el proveedor admin (usuario admin actuando como proveedor)
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
          proveedorUsado = proveedorAdmin;
        }

        // Crear la oferta si tenemos un proveedor válido
        if (proveedorUsado) {
          ofertaCreada = await prisma.ofertaProveedor.create({
            data: {
              materialId: material.id,
              proveedorId: proveedorUsado.id,
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

          console.log(`✅ Oferta automática creada para material del catálogo usando proveedor: ${proveedorUsado.nombre}`);
        }
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
  request: FastifyRequest<{ Params: { id: string }; Body: any }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const user = request.user as any;

    const material = await prisma.material.findUnique({ where: { id } });
    if (!material) {
      return reply.status(404).send({ success: false, error: 'Material no encontrado' });
    }

    // Permitir editar materiales del catálogo (usuarioId = null) o materiales propios
    const puedeEditar = user.rol === 'ADMIN' ||
                       (material.usuarioId !== null && material.usuarioId === user.id);

    if (!puedeEditar) {
      return reply.status(403).send({ success: false, error: 'No tienes permisos para editar este material' });
    }

    // Extraer campos relevantes para la actualización
    const body = request.body as any;
    const {
      nombre,
      unidad,
      precioUnitario,
      precioBase,
      tipoCalidad,
      marca,
      proveedorId,
      telefonoProveedor,
      stockMinimo,
      imagenUrl,
      observaciones,
      categoriaId
    } = body;

    // Preparar datos de actualización
    const updateData: any = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (unidad !== undefined) updateData.unidad = unidad;
    if (precioUnitario !== undefined) updateData.precio = precioUnitario;
    if (precioBase !== undefined) updateData.precioBase = precioBase;
    if (imagenUrl !== undefined) updateData.imagenUrl = imagenUrl;
    if (observaciones !== undefined) updateData.descripcion = observaciones;
    if (categoriaId !== undefined) updateData.categoriaId = categoriaId;

    // Manejar específicamente esActivo (puede venir solo este campo)
    if (body.esActivo !== undefined) updateData.esActivo = body.esActivo;

    // Actualizar el material
    const updated = await prisma.material.update({
      where: { id },
      data: updateData,
      include: {
        categoria: true,
        ofertas: {
          include: {
            proveedor: true
          }
        }
      },
    });

    // Si se proporcionó información de proveedor, actualizar la oferta asociada
    if (proveedorId && precioUnitario) {
      try {
        // Buscar oferta existente para este material
        const ofertaExistente = await prisma.ofertaProveedor.findFirst({
          where: { materialId: id }
        });

        if (ofertaExistente) {
          // Actualizar oferta existente
          await prisma.ofertaProveedor.update({
            where: { id: ofertaExistente.id },
            data: {
              proveedorId: proveedorId,
              precio: precioUnitario,
              tipoCalidad: tipoCalidad || 'COMUN',
              marca: marca || null,
              observaciones: observaciones || null
            }
          });
        } else if (proveedorId) {
          // Crear nueva oferta
          await prisma.ofertaProveedor.create({
            data: {
              materialId: id,
              proveedorId: proveedorId,
              precio: precioUnitario,
              tipoCalidad: tipoCalidad || 'COMUN',
              marca: marca || null,
              comisionPorcentaje: 0, // Admin no paga comisión
              stock: stockMinimo ? parseInt(stockMinimo) > 0 : true,
              observaciones: observaciones || null
            }
          });
        }
      } catch (ofertaError) {
        console.error('Error actualizando oferta:', ofertaError);
        // No fallar la actualización del material si falla la oferta
      }
    }

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

    // Eliminar todas las ofertas asociadas al material y luego el material
    // Usar una transacción para asegurar integridad
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar todas las ofertas que referencian este material
      await tx.ofertaProveedor.deleteMany({
        where: { materialId: id }
      });

      // 2. Eliminar el material
      await tx.material.delete({ where: { id } });
    });

    reply.send({ success: true, message: 'Material y ofertas asociadas eliminados exitosamente' });
  } catch (error) {
    console.error('Error al eliminar material del catálogo:', error);
    reply.status(500).send({ success: false, error: 'Error al eliminar material' });
  }
};

// ========== FUNCIONES PARA GESTIÓN DE OFERTAS DESDE ADMIN ==========

interface CreateOfertaAdminBody {
  proveedorId: string;
  precio: number;
  tipoCalidad?: string;
  marca?: string;
  comisionPorcentaje?: number;
  stock?: boolean;
  observaciones?: string;
  imagenUrl?: string;
}

export const createOfertaAdmin = async (
  request: FastifyRequest<{ Params: { materialId: string }; Body: CreateOfertaAdminBody }>,
  reply: FastifyReply
) => {
  try {
    const { materialId } = request.params;
    const { proveedorId, precio, tipoCalidad, marca, comisionPorcentaje, stock, observaciones, imagenUrl } = request.body;

    // Verificar que el material existe y es del catálogo
    const material = await prisma.material.findUnique({
      where: { id: materialId }
    });

    if (!material) {
      return reply.status(404).send({ success: false, error: 'Material no encontrado' });
    }

    // Verificar que el proveedor existe
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: proveedorId },
      include: { usuario: true }
    });

    if (!proveedor) {
      return reply.status(404).send({ success: false, error: 'Proveedor no encontrado' });
    }

    // Nota: Si el proveedor no tiene usuarioId, solo se creará la oferta pero no el material en su inventario

    // Nota: Ya no creamos material duplicado, solo la oferta

    // Crear/actualizar la oferta vinculada al material del catálogo (para que aparezca en Gestionar Ofertas)
    const ofertaExistente = await prisma.ofertaProveedor.findFirst({
      where: {
        materialId, // materialId del catálogo
        proveedorId
      }
    });

    let oferta;

    if (ofertaExistente) {
      // Actualizar la oferta existente
      oferta = await prisma.ofertaProveedor.update({
        where: { id: ofertaExistente.id },
        data: {
          precio: parseFloat(precio.toString()),
          tipoCalidad: (tipoCalidad as any) || 'COMUN',
          marca: marca || null,
          comisionPorcentaje: comisionPorcentaje ? parseFloat(comisionPorcentaje.toString()) : 0,
          stock: stock !== undefined ? stock : true,
          vigenciaHasta: null, // Sin límite de tiempo
          observaciones: observaciones || null,
          imagenUrl: imagenUrl || null // Imagen específica de la oferta
        },
        include: {
          proveedor: true,
          material: true
        }
      });

      console.log(`✅ Oferta actualizada por admin: ${oferta.proveedor.nombre} - ₲${oferta.precio} (Material catálogo ID: ${materialId})`);
    } else {
      // Crear la oferta vinculada al material del catálogo
      oferta = await prisma.ofertaProveedor.create({
        data: {
          materialId, // Vincular al material del catálogo para que aparezca en Gestionar Ofertas
          proveedorId,
          precio: parseFloat(precio.toString()),
          tipoCalidad: (tipoCalidad as any) || 'COMUN',
          marca: marca || null,
          comisionPorcentaje: comisionPorcentaje ? parseFloat(comisionPorcentaje.toString()) : 0,
          stock: stock !== undefined ? stock : true,
          vigenciaHasta: null, // Sin límite de tiempo
          observaciones: observaciones || null,
          imagenUrl: imagenUrl || null // Imagen específica de la oferta
        },
        include: {
          proveedor: true,
          material: true
        }
      });

      console.log(`✅ Oferta creada por admin: ${oferta.proveedor.nombre} - ₲${oferta.precio} (Material catálogo ID: ${materialId})`);
    }

    reply.send({ success: true, data: oferta });
  } catch (error) {
    console.error('Error al crear oferta desde admin:', error);
    reply.status(500).send({ success: false, error: 'Error al crear oferta' });
  }
};

export const getOfertasByMaterial = async (
  request: FastifyRequest<{ Params: { materialId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { materialId } = request.params;

    const ofertas = await prisma.ofertaProveedor.findMany({
      where: { materialId },
      include: {
        proveedor: true,
        material: true
      },
      orderBy: { precio: 'asc' }
    });

    reply.send({ success: true, data: ofertas });
  } catch (error) {
    console.error('Error al obtener ofertas por material:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener ofertas' });
  }
};

export const updateOfertaAdmin = async (
  request: FastifyRequest<{ Params: { ofertaId: string }; Body: Partial<CreateOfertaAdminBody> }>,
  reply: FastifyReply
) => {
  try {
    const { ofertaId } = request.params;
    const updateData = request.body;

    // Verificar que la oferta existe
    const ofertaExistente = await prisma.ofertaProveedor.findUnique({
      where: { id: ofertaId }
    });

    if (!ofertaExistente) {
      return reply.status(404).send({ success: false, error: 'Oferta no encontrada' });
    }

    // Preparar datos de actualización
    const data: any = {};

    if (updateData.proveedorId !== undefined) data.proveedorId = updateData.proveedorId;
    if (updateData.precio !== undefined) data.precio = parseFloat(updateData.precio.toString());
    if (updateData.tipoCalidad !== undefined) data.tipoCalidad = updateData.tipoCalidad;
    if (updateData.marca !== undefined) data.marca = updateData.marca;
    if (updateData.comisionPorcentaje !== undefined) data.comisionPorcentaje = parseFloat(updateData.comisionPorcentaje.toString());
    if (updateData.stock !== undefined) data.stock = updateData.stock;
    if (updateData.observaciones !== undefined) data.observaciones = updateData.observaciones;
    if (updateData.imagenUrl !== undefined) data.imagenUrl = updateData.imagenUrl;

    // Actualizar oferta
    const ofertaActualizada = await prisma.ofertaProveedor.update({
      where: { id: ofertaId },
      data,
      include: {
        proveedor: true,
        material: true
      }
    });

    console.log(`✅ Oferta actualizada por admin: ${ofertaActualizada.proveedor.nombre} - ₲${ofertaActualizada.precio}`);

    reply.send({ success: true, data: ofertaActualizada });
  } catch (error) {
    console.error('Error al actualizar oferta desde admin:', error);
    reply.status(500).send({ success: false, error: 'Error al actualizar oferta' });
  }
};

export const deleteOfertaAdmin = async (
  request: FastifyRequest<{ Params: { ofertaId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { ofertaId } = request.params;

    // Verificar que la oferta existe
    const oferta = await prisma.ofertaProveedor.findUnique({
      where: { id: ofertaId }
    });

    if (!oferta) {
      return reply.status(404).send({ success: false, error: 'Oferta no encontrada' });
    }

    // Eliminar oferta
    await prisma.ofertaProveedor.delete({
      where: { id: ofertaId }
    });

    console.log(`✅ Oferta eliminada por admin: ID ${ofertaId}`);

    reply.send({ success: true, message: 'Oferta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar oferta desde admin:', error);
    reply.status(500).send({ success: false, error: 'Error al eliminar oferta' });
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
