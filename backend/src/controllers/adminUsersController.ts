import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        rol: true,
        telefono: true,
        empresa: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            proyectos: true,
            inmuebles: true,
            materialesPersonalizados: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    reply.send({ success: true, data: users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    reply.status(500).send({ success: false, error: 'Error interno del servidor' });
  }
};

export const createUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { name, email, password, rol, telefono, empresa } = request.body as any;

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return reply.status(400).send({ success: false, error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        rol,
        telefono,
        empresa
      },
      select: {
        id: true,
        name: true,
        email: true,
        rol: true,
        telefono: true,
        empresa: true,
        image: true,
        createdAt: true
      }
    });

    reply.send({ success: true, data: user });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    reply.status(500).send({ success: false, error: 'Error interno del servidor' });
  }
};

export const updateUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { name, email, rol, telefono, empresa, password } = request.body as any;

    const updateData: any = {
      name,
      email,
      rol,
      telefono,
      empresa
    };

    // Solo actualizar password si se proporciona
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        rol: true,
        telefono: true,
        empresa: true,
        image: true,
        createdAt: true
      }
    });

    reply.send({ success: true, data: user });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    reply.status(500).send({ success: false, error: 'Error interno del servidor' });
  }
};

export const deleteUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;

    await prisma.user.delete({
      where: { id }
    });

    reply.send({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    reply.status(500).send({ success: false, error: 'Error interno del servidor' });
  }
};

export const updateUserImage = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ success: false, error: 'No se proporcionó imagen' });
    }

    const filename = `user_${Date.now()}.${data.filename.split('.').pop()}`;
    const filepath = `./public/uploads/users/${filename}`;
    
    // Crear directorio si no existe
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Guardar archivo
    const buffer = await data.toBuffer();
    fs.writeFileSync(filepath, buffer);

    // Actualizar usuario
    const user = await prisma.user.update({
      where: { id },
      data: { image: `/uploads/users/${filename}` },
      select: {
        id: true,
        name: true,
        email: true,
        rol: true,
        image: true
      }
    });

    reply.send({ success: true, data: user });
  } catch (error) {
    console.error('Error al actualizar imagen:', error);
    reply.status(500).send({ success: false, error: 'Error interno del servidor' });
  }
};