import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /proveedor/perfil - Obtener perfil del proveedor actual
export async function getPerfil(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.status(401).send({ success: false, error: 'Usuario no autenticado' });
    }

    // Obtener el proveedor con su información completa
    const proveedor = await prisma.proveedor.findUnique({
      where: { usuarioId: userId },
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
            telefono: true
          }
        }
      }
    });

    if (!proveedor) {
      return reply.status(404).send({ success: false, error: 'Proveedor no encontrado' });
    }

    reply.send({ success: true, data: proveedor });
  } catch (error) {
    console.error('Error fetching proveedor profile:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener perfil del proveedor' });
  }
}

// PUT /proveedor/perfil - Actualizar perfil del proveedor
export async function updatePerfil(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.status(401).send({ success: false, error: 'Usuario no autenticado' });
    }

    const body = request.body as any;
    const {
      nombre,
      email,
      telefono,
      direccion,
      ciudad,
      departamento,
      latitud,
      longitud,
      sitioWeb,
      logo,
      name, // nombre del usuario
      userTelefono // teléfono del usuario
    } = body;

    // Verificar que el proveedor existe
    const proveedorExistente = await prisma.proveedor.findUnique({
      where: { usuarioId: userId }
    });

    if (!proveedorExistente) {
      return reply.status(404).send({ success: false, error: 'Proveedor no encontrado' });
    }

    // Actualizar información del usuario si se proporcionó
    if (name || userTelefono) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(userTelefono && { telefono: userTelefono })
        }
      });
    }

    // Actualizar información del proveedor
    const proveedorActualizado = await prisma.proveedor.update({
      where: { usuarioId: userId },
      data: {
        ...(nombre && { nombre }),
        ...(email && { email }),
        ...(telefono && { telefono }),
        ...(direccion !== undefined && { direccion }),
        ...(ciudad !== undefined && { ciudad }),
        ...(departamento !== undefined && { departamento }),
        ...(latitud !== undefined && { latitud: latitud ? parseFloat(latitud) : null }),
        ...(longitud !== undefined && { longitud: longitud ? parseFloat(longitud) : null }),
        ...(sitioWeb !== undefined && { sitioWeb }),
        ...(logo !== undefined && { logo })
      },
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
            telefono: true
          }
        }
      }
    });

    reply.send({ success: true, data: proveedorActualizado, message: 'Perfil actualizado exitosamente' });
  } catch (error: any) {
    console.error('Error updating proveedor profile:', error);

    // Manejar errores de unicidad
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return reply.status(400).send({ success: false, error: 'El email ya está en uso' });
      }
    }

    reply.status(500).send({ success: false, error: 'Error al actualizar perfil del proveedor' });
  }
}

// GET /proveedores - Obtener todos los proveedores con estadísticas
export async function getAllProveedores(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Primero obtenemos todos los proveedores
    const proveedores = await prisma.proveedor.findMany({
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
            telefono: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Luego agregamos el conteo de ofertas para cada proveedor
    const proveedoresConConteo = await Promise.all(
      proveedores.map(async (proveedor) => {
        const conteoOfertas = await prisma.ofertaProveedor.count({
          where: { proveedorId: proveedor.id }
        });

        return {
          ...proveedor,
          _count: {
            ofertas: conteoOfertas
          }
        };
      })
    );

    reply.send({ success: true, data: proveedoresConConteo });
  } catch (error) {
    console.error('Error fetching all proveedores:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener proveedores' });
  }
}

// GET /proveedores/:id/ofertas - Obtener todas las ofertas de un proveedor específico
export async function getOfertasByProveedor(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    if (!id) {
      return reply.status(400).send({ success: false, error: 'ID de proveedor requerido' });
    }

    // Verificar que el proveedor existe
    const proveedor = await prisma.proveedor.findUnique({
      where: { id }
    });

    if (!proveedor) {
      return reply.status(404).send({ success: false, error: 'Proveedor no encontrado' });
    }

    // Obtener todas las ofertas del proveedor con información del material
    const ofertas = await prisma.ofertaProveedor.findMany({
      where: { proveedorId: id },
      include: {
        material: {
          select: {
            id: true,
            nombre: true,
            unidad: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    reply.send({ success: true, data: ofertas });
  } catch (error) {
    console.error('Error fetching ofertas by proveedor:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener ofertas del proveedor' });
  }
}
