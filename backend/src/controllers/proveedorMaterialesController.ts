import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener materiales del proveedor autenticado
export const getMisMateriales = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).id;

    const materiales = await prisma.material.findMany({
      where: { usuarioId: userId },
      include: { categoria: true },
      orderBy: { createdAt: 'desc' }
    });

    // Map precio to precio for frontend compatibility
    const materialesMapped = materiales.map(material => ({
      ...material,
      precio: material.precio
    }));

    reply.send(materialesMapped);
  } catch (error) {
    console.error('Error al obtener materiales del proveedor:', error);
    reply.status(500).send({ error: 'Error al obtener materiales' });
  }
};

// Crear material del proveedor
export const crearMaterial = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).id;
    const {
      nombre,
      descripcion,
      unidad,
      categoriaId,
      imagenUrl,
      precioUnitario,
      tipoCalidad,
      marca,
      proveedor,
      telefonoProveedor,
      stockMinimo,
      observaciones
    } = request.body as any;

    // Crear el material
    const material = await prisma.material.create({
      data: {
        nombre,
        descripcion: observaciones || descripcion,
        unidad,
        categoriaId,
        imagenUrl,
        precio: precioUnitario,
        usuarioId: userId,
        esActivo: true
      },
      include: { categoria: true }
    });

    // Si el usuario es proveedor de materiales, crear también la oferta
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { proveedor: true }
    });

    if (user?.rol === 'PROVEEDOR_MATERIALES' && user.proveedor) {
      // Crear la oferta del proveedor
      await prisma.ofertaProveedor.create({
        data: {
          materialId: material.id,
          proveedorId: user.proveedor.id,
          precio: precioUnitario,
          tipoCalidad: tipoCalidad || 'COMUN',
          marca: marca,
          comisionPorcentaje: 10.00, // Comisión por defecto del 10%
          stock: true, // Por defecto en stock
          observaciones: observaciones
        }
      });
    }

    reply.status(201).send(material);
  } catch (error) {
    console.error('Error al crear material:', error);
    reply.status(500).send({ error: 'Error al crear material' });
  }
};

// Actualizar material del proveedor
export const actualizarMaterial = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const { nombre, descripcion, unidad, categoriaId, imagenUrl, precio, marca, esActivo } = request.body as any;

    // Verificar que el material pertenece al proveedor
    const materialExistente = await prisma.material.findFirst({
      where: { id, usuarioId: userId }
    });

    if (!materialExistente) {
      return reply.status(404).send({ error: 'Material no encontrado' });
    }

    const material = await prisma.material.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        unidad,
        categoria: { connect: { id: categoriaId } },
        imagenUrl,
        precio: precio,
        esActivo
      },
      include: { categoria: true }
    });

    reply.send(material);
  } catch (error) {
    console.error('Error al actualizar material:', error);
    reply.status(500).send({ error: 'Error al actualizar material' });
  }
};

// Eliminar material del proveedor
export const eliminarMaterial = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).id;
    const { id } = request.params as any;

    // Verificar que el material pertenece al proveedor
    const materialExistente = await prisma.material.findFirst({
      where: { id, usuarioId: userId }
    });

    if (!materialExistente) {
      return reply.status(404).send({ error: 'Material no encontrado' });
    }

    await prisma.material.delete({ where: { id } });

    reply.send({ message: 'Material eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar material:', error);
    reply.status(500).send({ error: 'Error al eliminar material' });
  }
};
