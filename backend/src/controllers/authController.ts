import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  rol?: string;
  telefono?: string;
  empresa?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export const register = async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
  try {
    const { name, email, password, rol, telefono, empresa } = request.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(400).send({ success: false, error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        rol: (rol as any) || 'CLIENTE',
        telefono,
        empresa,
      },
      select: {
        id: true,
        name: true,
        email: true,
        rol: true,
        telefono: true,
        empresa: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = request.server.jwt.sign({ id: user.id, email: user.email, rol: user.rol });

    reply.send({ success: true, data: { user, token } });
  } catch (error) {
    console.error('Error en registro:', error);
    reply.status(500).send({ success: false, error: 'Error al registrar usuario' });
  }
};

export const login = async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
  try {
    const { email, password } = request.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return reply.status(401).send({ success: false, error: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return reply.status(401).send({ success: false, error: 'Credenciales inválidas' });
    }

    const token = request.server.jwt.sign({ id: user.id, email: user.email, rol: user.rol });

    const { password: _, ...userWithoutPassword } = user;

    reply.send({ success: true, data: { user: userWithoutPassword, token } });
  } catch (error) {
    console.error('Error en login:', error);
    reply.status(500).send({ success: false, error: 'Error al iniciar sesión' });
  }
};

export const getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rol: true,
        telefono: true,
        empresa: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ success: false, error: 'Usuario no encontrado' });
    }

    reply.send({ success: true, data: user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener perfil' });
  }
};
