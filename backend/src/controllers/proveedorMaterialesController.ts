import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener materiales base disponibles para proveedores
export const getMaterialesBase = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Materiales base son aquellos sin usuarioId (creados por admin)
    const materialesBase = await prisma.material.findMany({
      where: { usuarioId: null },
      include: { categoria: true },
      orderBy: { createdAt: 'desc' }
    });

    reply.send(materialesBase);
  } catch (error) {
    console.error('Error al obtener materiales base:', error);
    reply.status(500).send({ error: 'Error al obtener materiales base' });
  }
};

// Obtener materiales del proveedor autenticado
export const getMisMateriales = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).id;

    const materiales = await prisma.material.findMany({
      where: { usuarioId: userId },
      include: {
        categoria: true,
        ofertas: {
          include: {
            proveedor: true
          }
        }
      },
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

// Crear oferta basada en material base
export const crearOfertaDesdeBase = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).id;
    const { materialBaseId, precio, marca, tipoCalidad, observaciones } = request.body as any;

    console.log('Creando oferta desde base:', { userId, materialBaseId, precio, marca });

    // Verificar que el material base existe y no tiene usuarioId
    const materialBase = await prisma.material.findFirst({
      where: {
        id: materialBaseId,
        usuarioId: null // Solo materiales base
      }
    });

    console.log('Material base encontrado:', materialBase ? 'Sí' : 'No');

    if (!materialBase) {
      return reply.status(404).send({ error: 'Material base no encontrado' });
    }

    // Verificar que el usuario tiene rol de proveedor
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('Usuario encontrado:', user ? { rol: user.rol, email: user.email } : 'No');

    if (!user || (user.rol !== 'PROVEEDOR_MATERIALES' && user.rol !== 'CONSTRUCTOR' && user.rol !== 'PROVEEDOR_SERVICIOS')) {
      console.log('Usuario no autorizado para crear ofertas');
      return reply.status(403).send({ error: 'Solo proveedores pueden crear ofertas' });
    }

    // Solo PROVEEDOR_MATERIALES necesitan registro en tabla proveedor y oferta
    let proveedorRecord = null;
    if (user.rol === 'PROVEEDOR_MATERIALES') {
      console.log('Verificando registro en tabla Proveedor...');
      proveedorRecord = await prisma.proveedor.findFirst({
        where: { usuarioId: userId }
      });
      console.log('Registro en Proveedor encontrado:', proveedorRecord ? 'Sí' : 'No');

      if (!proveedorRecord) {
        console.log('Proveedor no registrado correctamente en tabla Proveedor');
        return reply.status(403).send({ error: 'Proveedor no registrado correctamente' });
      }
    }

    // Crear el material del proveedor basado en el material base
    const materialProveedor = await prisma.material.create({
      data: {
        nombre: materialBase.nombre,
        descripcion: materialBase.descripcion,
        unidad: materialBase.unidad,
        categoriaId: materialBase.categoriaId,
        imagenUrl: materialBase.imagenUrl,
        precio: precio,
        usuarioId: userId,
        esActivo: true
      },
      include: { categoria: true }
    });

    // Crear la oferta solo para PROVEEDOR_MATERIALES
    let oferta = null;
    if (user.rol === 'PROVEEDOR_MATERIALES' && proveedorRecord) {
      oferta = await prisma.ofertaProveedor.create({
        data: {
          materialId: materialProveedor.id,
          proveedorId: proveedorRecord.id,
          precio: precio,
          tipoCalidad: tipoCalidad || 'COMUN',
          marca: marca,
          comisionPorcentaje: 10.00,
          stock: true,
          observaciones: observaciones
        }
      });
    }

    reply.status(201).send({
      material: materialProveedor,
      oferta: oferta
    });
  } catch (error) {
    console.error('Error al crear oferta desde base:', error);
    reply.status(500).send({ error: 'Error al crear oferta' });
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
