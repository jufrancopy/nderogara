import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todas las financiaciones de un proyecto
export const getFinanciaciones = async (request: FastifyRequest, reply: FastifyReply) => {
  console.log("getFinanciaciones called with proyectoId:", request.params);
  try {
    const { proyectoId } = request.params as any;
    const user = request.user as any;

    // Find the proyecto by id or nombre
    const proyecto = await prisma.proyecto.findFirst({
      where: {
        OR: [{ id: proyectoId }, { nombre: proyectoId }]
      }
    });

    if (!proyecto) {
      return reply.status(404).send({ success: false, error: 'Proyecto no encontrado' });
    }

    // Verificar si el usuario tiene acceso al proyecto
    // Para CLIENTE: pueden ver proyectos pero NO financiaciones
    // Para ADMIN/CONSTRUCTOR: pueden ver todo
    if (user.rol === 'CLIENTE') {
      return reply.status(403).send({ success: false, error: 'No tienes permiso para ver financiaciones' });
    }

    // Para otros roles, verificar que el proyecto les pertenezca o sean admin
    if (user.rol !== 'ADMIN' && proyecto.usuarioId !== user.id) {
      return reply.status(404).send({ success: false, error: 'Proyecto no encontrado' });
    }

    const financiaciones = await prisma.financiacion.findMany({
      where: { proyectoId: proyecto.id },
      orderBy: { fecha: 'desc' }
    });

    reply.send({ success: true, data: financiaciones });
  } catch (error) {
    console.error('Error al obtener financiaciones:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener financiaciones' });
  }
};

// Crear nueva financiación
export const createFinanciacion = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { proyectoId } = request.params as { proyectoId: string };
    const { monto, fuente, descripcion } = request.body as any;
    const user = request.user as any;

    console.log('Creating financiacion for proyecto:', proyectoId, 'by user:', user.id);

    if (!proyectoId) {
      return reply.status(400).send({ success: false, error: 'ProyectoId es requerido' });
    }

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    });

    if (!proyecto) {
      return reply.status(404).send({ success: false, error: 'Proyecto no encontrado' });
    }

    // Verificar permisos: admin puede crear en cualquier proyecto, otros solo en los suyos
    if (user.rol !== 'ADMIN' && proyecto.usuarioId !== user.id) {
      return reply.status(403).send({ success: false, error: 'No tienes permiso para agregar financiaciones a este proyecto' });
    }

    const financiacion = await prisma.financiacion.create({
      data: {
        proyectoId: proyecto.id,
        monto: parseFloat(monto),
        fuente,
        descripcion
      }
    });

    reply.send({ success: true, data: financiacion });
  } catch (error) {
    console.error('Error al crear financiación:', error);
    reply.status(500).send({ success: false, error: 'Error al crear financiación' });
  }
};

// Actualizar financiación
export const updateFinanciacion = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { monto, fuente, descripcion } = request.body as any;
    const user = request.user as any;

    // Verificar que la financiación existe
    const financiacion = await prisma.financiacion.findUnique({
      where: { id },
      include: { proyecto: true }
    });

    if (!financiacion) {
      return reply.status(404).send({ success: false, error: 'Financiación no encontrada' });
    }

    // Verificar permisos: admin puede editar cualquier financiación, otros solo las de sus proyectos
    if (user.rol !== 'ADMIN' && financiacion.proyecto.usuarioId !== user.id) {
      return reply.status(403).send({ success: false, error: 'No tienes permiso para editar esta financiación' });
    }

    const updatedFinanciacion = await prisma.financiacion.update({
      where: { id },
      data: {
        monto: monto ? parseFloat(monto) : financiacion.monto,
        fuente: fuente || financiacion.fuente,
        descripcion: descripcion !== undefined ? descripcion : financiacion.descripcion
      }
    });

    reply.send({ success: true, data: updatedFinanciacion });
  } catch (error) {
    console.error('Error al actualizar financiación:', error);
    reply.status(500).send({ success: false, error: 'Error al actualizar financiación' });
  }
};

// Eliminar financiación
export const deleteFinanciacion = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const user = request.user as any;

    // Verificar que la financiación existe
    const financiacion = await prisma.financiacion.findUnique({
      where: { id },
      include: { proyecto: true }
    });

    if (!financiacion) {
      return reply.status(404).send({ success: false, error: 'Financiación no encontrada' });
    }

    // Verificar permisos: admin puede eliminar cualquier financiación, otros solo las de sus proyectos
    if (user.rol !== 'ADMIN' && financiacion.proyecto.usuarioId !== user.id) {
      return reply.status(403).send({ success: false, error: 'No tienes permiso para eliminar esta financiación' });
    }

    await prisma.financiacion.delete({
      where: { id }
    });

    reply.send({ success: true, message: 'Financiación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar financiación:', error);
    reply.status(500).send({ success: false, error: 'Error al eliminar financiación' });
  }
};

// Obtener presupuesto total de un proyecto (suma de todas las financiaciones)
export const getPresupuestoTotal = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { proyectoId } = request.params as any;
    const user = request.user as any;

    // Find the proyecto by id or nombre
    const proyecto = await prisma.proyecto.findFirst({
      where: {
        OR: [{ id: proyectoId }, { nombre: proyectoId }]
      }
    });

    if (!proyecto) {
      return reply.status(404).send({ success: false, error: 'Proyecto no encontrado' });
    }

    // Verificar si el usuario tiene acceso al proyecto
    // Para CLIENTE: pueden ver proyectos pero NO financiaciones
    // Para ADMIN/CONSTRUCTOR: pueden ver todo
    if (user.rol === 'CLIENTE') {
      return reply.status(403).send({ success: false, error: 'No tienes permiso para ver financiaciones' });
    }

    // Para otros roles, verificar que el proyecto les pertenezca o sean admin
    if (user.rol !== 'ADMIN' && proyecto.usuarioId !== user.id) {
      return reply.status(404).send({ success: false, error: 'Proyecto no encontrado' });
    }

    const financiaciones = await prisma.financiacion.findMany({
      where: { proyectoId: proyecto.id },
      select: { monto: true }
    });

    const presupuestoTotal = financiaciones.reduce((total, f) => total + Number(f.monto), 0);

    reply.send({
      success: true,
      data: {
        presupuestoTotal,
        cantidadFinanciaciones: financiaciones.length
      }
    });
  } catch (error) {
    console.error('Error al obtener presupuesto total:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener presupuesto total' });
  }
};
