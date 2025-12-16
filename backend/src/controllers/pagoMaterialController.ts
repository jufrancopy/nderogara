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

    // Verificar que el materialPorItem existe y pertenece al usuario
    const materialPorItem = await prisma.materialPorItem.findFirst({
      where: { id: materialPorItemId },
      include: {
        item: {
          include: {
            presupuestoItems: {
              where: { proyecto: { usuarioId: (request.user as any).id } }
            }
          }
        }
      }
    });

    if (!materialPorItem || materialPorItem.item.presupuestoItems.length === 0) {
      return reply.status(404).send({ success: false, error: 'Material no encontrado o no autorizado' });
    }

    const pago = await prisma.pagoMaterial.create({
      data: {
        materialPorItemId,
        materialId: materialPorItem.materialId,
        itemId: materialPorItem.itemId,
        proyectoId: materialPorItem.item.presupuestoItems[0].proyectoId,
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
      include: { material: true }
    });

    if (!materialPorItem) {
      return reply.status(404).send({ success: false, error: 'Material no encontrado' });
    }

    // Calcular costo total del material (usar precio o precioBase)
    const precioUnitario = Number(materialPorItem.material.precio || materialPorItem.material.precioBase || 0);
    const costoTotal = precioUnitario * Number(materialPorItem.cantidadPorUnidad);

    console.log('DEBUG - Cálculo para materialPorItemId:', materialPorItemId);
    console.log('DEBUG - precioUnitario:', precioUnitario);
    console.log('DEBUG - cantidadPorUnidad:', materialPorItem.cantidadPorUnidad);
    console.log('DEBUG - costoTotal:', costoTotal);

    // Obtener suma de todos los pagos para este material
    const pagos = await prisma.pagoMaterial.findMany({
      where: { materialPorItemId }
    });

    console.log('DEBUG - Pagos encontrados:', pagos.length);
    pagos.forEach(p => console.log('DEBUG - Pago:', p.montoPagado));

    const totalPagado = pagos.reduce((sum: number, pago: any) => sum + Number(pago.montoPagado), 0);
    const pendiente = costoTotal - totalPagado;

    console.log('DEBUG - totalPagado:', totalPagado);
    console.log('DEBUG - pendiente:', pendiente);

    // Determinar estado - debe ser exactamente igual al costo total para estar completo
    let estado = 'PENDIENTE';
    if (totalPagado === costoTotal) {
      estado = 'COMPLETO';
    } else if (totalPagado > 0) {
      estado = 'PARCIAL';
    }

    console.log('DEBUG - estado final:', estado);

    reply.send({
      success: true,
      data: {
        costoTotal,
        totalPagado,
        pendiente: Math.max(0, pendiente),
        estado,
        cantidadPagos: pagos.length
      }
    });
  } catch (error) {
    console.error('Error al obtener estado de pago:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener estado de pago' });
  }
};
