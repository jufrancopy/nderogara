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
