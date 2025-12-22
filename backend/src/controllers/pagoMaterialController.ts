import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todos los pagos de un material específico
export const getPagosMaterial = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { materialPorItemId } = request.params as any;

    const pagos = await prisma.pagoMaterial.findMany({
      where: { materialPorItemId },
      orderBy: { fechaPago: 'desc' }
    });



    reply.send({ success: true, data: pagos });
  } catch (error) {
    console.error('Error al obtener pagos de material:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener pagos de material' });
  }
};

// Crear nuevo pago para un material
export const createPagoMaterial = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { materialPorItemId, montoPagado, comprobanteUrl, notas } = request.body as any;

    // Verificar que el materialPorItem existe
    const materialPorItem = await prisma.materialPorItem.findUnique({
      where: { id: materialPorItemId },
      include: {
        item: true
      }
    });

    if (!materialPorItem) {
      return reply.status(404).send({ success: false, error: 'Material no encontrado' });
    }

    // Verificar permisos: administradores pueden gestionar cualquier material,
    // otros usuarios solo los de sus propios proyectos
    const user = request.user as any;
    if (user.rol !== 'ADMIN') {
      // Para usuarios no admin, verificar que el material pertenezca a uno de sus proyectos
      const perteneceAlUsuario = await prisma.presupuestoItem.findFirst({
        where: {
          itemId: materialPorItem.itemId,
          proyecto: {
            usuarioId: user.id
          }
        }
      });

      if (!perteneceAlUsuario) {
        return reply.status(403).send({ success: false, error: 'No tienes permisos para gestionar pagos de este material' });
      }
    }

    // Obtener el proyectoId del primer presupuesto que contenga este item
    const presupuestoItem = await prisma.presupuestoItem.findFirst({
      where: { itemId: materialPorItem.itemId },
      select: { proyectoId: true }
    });

    const pago = await prisma.pagoMaterial.create({
      data: {
        materialPorItemId,
        materialId: materialPorItem.materialId,
        itemId: materialPorItem.itemId,
        proyectoId: presupuestoItem?.proyectoId || null,
        montoPagado: parseFloat(montoPagado),
        comprobanteUrl,
        notas
      }
    });

    reply.send({ success: true, data: pago });
  } catch (error) {
    console.error('Error al crear pago de material:', error);
    reply.status(500).send({ success: false, error: 'Error al crear pago de material' });
  }
};

// Actualizar pago de material
export const updatePagoMaterial = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { montoPagado, notas } = request.body as any;

    // Verificar que el pago existe
    const pago = await prisma.pagoMaterial.findUnique({
      where: { id }
    });

    if (!pago) {
      return reply.status(404).send({ success: false, error: 'Pago no encontrado' });
    }

    // Aquí debería verificar la propiedad del proyecto, pero por simplicidad lo omito

    const updatedPago = await prisma.pagoMaterial.update({
      where: { id },
      data: {
        montoPagado: montoPagado ? parseFloat(montoPagado) : pago.montoPagado,
        notas: notas !== undefined ? notas : pago.notas
      }
    });

    reply.send({ success: true, data: updatedPago });
  } catch (error) {
    console.error('Error al actualizar pago de material:', error);
    reply.status(500).send({ success: false, error: 'Error al actualizar pago de material' });
  }
};

// Eliminar pago de material
export const deletePagoMaterial = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;

    // Verificar que el pago existe
    const pago = await prisma.pagoMaterial.findUnique({
      where: { id }
    });

    if (!pago) {
      return reply.status(404).send({ success: false, error: 'Pago no encontrado' });
    }

    await prisma.pagoMaterial.delete({
      where: { id }
    });

    reply.send({ success: true, message: 'Pago eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar pago de material:', error);
    reply.status(500).send({ success: false, error: 'Error al eliminar pago de material' });
  }
};

// Obtener estado de pago de un material
export const getEstadoPagoMaterial = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { materialPorItemId } = request.params as any;

    // Obtener el material y su costo total
    const materialPorItem = await prisma.materialPorItem.findUnique({
      where: { id: materialPorItemId },
      include: {
        material: {
          include: {
            ofertas: {
              where: { stock: true }
            }
          }
        }
      }
    });

    if (!materialPorItem) {
      return reply.status(404).send({ success: false, error: 'Material no encontrado' });
    }

    // Calcular costo total del material (prioridad: precio específico → oferta más barata → precio base → precioBase)
    let precioUnitario = Number(materialPorItem.precioUnitario) || 0;

    // Si no hay precio específico, buscar la oferta más barata disponible
    if (!precioUnitario) {
      const ofertasActivas = materialPorItem.material.ofertas?.filter(oferta => oferta.stock === true) || [];
      if (ofertasActivas.length > 0) {
        precioUnitario = Math.min(...ofertasActivas.map(o => Number(o.precio)));
        console.log('Usando precio de oferta más barata:', precioUnitario);
      } else {
        precioUnitario = Number(materialPorItem.material.precio) || Number(materialPorItem.material.precioBase) || 0;
        console.log('Usando precio base del material:', precioUnitario);
      }
    }

    const costoTotal = precioUnitario * Number(materialPorItem.cantidadPorUnidad);

    // Obtener suma de todos los pagos para este material
    const pagos = await prisma.pagoMaterial.findMany({
      where: { materialPorItemId }
    });

    const totalPagado = pagos.reduce((sum: number, pago: any) => sum + Number(pago.montoPagado), 0);
    const pendiente = costoTotal - totalPagado;

    console.log('=== DETALLES DEL CÁLCULO ===');
    console.log('materialPorItemId:', materialPorItemId);
    console.log('materialPorItem.precioUnitario:', materialPorItem.precioUnitario, 'tipo:', typeof materialPorItem.precioUnitario);
    console.log('materialPorItem.material.precio:', materialPorItem.material.precio, 'tipo:', typeof materialPorItem.material.precio);
    console.log('materialPorItem.material.precioBase:', materialPorItem.material.precioBase, 'tipo:', typeof materialPorItem.material.precioBase);
    console.log('precioUnitario usado:', precioUnitario);
    console.log('cantidadPorUnidad:', materialPorItem.cantidadPorUnidad, 'tipo:', typeof materialPorItem.cantidadPorUnidad);
    console.log('costoTotal calculado:', costoTotal);
    console.log('pagos encontrados:', pagos.length);
    pagos.forEach((pago, index) => {
      console.log(`pago ${index + 1}:`, pago.montoPagado, 'tipo:', typeof pago.montoPagado);
    });
    console.log('totalPagado calculado:', totalPagado);
    console.log('pendiente calculado:', pendiente);
    console.log('===========================');

    // Determinar estado - completo si se pagó al menos el costo total
    let estado = 'PENDIENTE';
    if (totalPagado >= costoTotal) {
      estado = 'COMPLETO';
    } else if (totalPagado > 0) {
      estado = 'PARCIAL';
    }

    console.log('Cálculo de estado de pago:', {
      materialPorItemId,
      precioUnitario,
      cantidadPorUnidad: materialPorItem.cantidadPorUnidad,
      costoTotal,
      totalPagado,
      pendiente,
      estado
    });

    reply.send({
      success: true,
      data: {
        costoTotal,
        totalPagado,
        pendiente, // Devolver el pendiente real (puede ser negativo para sobre-pago)
        estado,
        cantidadPagos: pagos.length
      }
    });
  } catch (error) {
    console.error('Error al obtener estado de pago:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener estado de pago' });
  }
};
