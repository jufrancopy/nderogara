import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Obtener todos los inmuebles (público)
export const getInmuebles = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { tipo, ciudad, precioMin, precioMax } = request.query as any;

    const where: any = {
      estado: 'DISPONIBLE'
    };

    if (tipo) where.tipo = tipo;
    if (ciudad) where.ciudad = { contains: ciudad, mode: 'insensitive' };
    if (precioMin || precioMax) {
      where.precio = {};
      if (precioMin) where.precio.gte = parseFloat(precioMin);
      if (precioMax) where.precio.lte = parseFloat(precioMax);
    }

    const inmuebles = await prisma.inmueble.findMany({
      where,
      include: {
        usuario: {
          select: { name: true, telefono: true }
        },
        proyecto: {
          select: { nombre: true, superficieTotal: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    reply.send({ success: true, data: inmuebles });
  } catch (error) {
    console.error('Error al obtener inmuebles:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener inmuebles' });
  }
};

// Obtener inmueble por ID (público)
export const getInmuebleById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;

    const inmueble = await prisma.inmueble.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { name: true, telefono: true, email: true }
        },
        proyecto: {
          include: {
            presupuestoItems: {
              include: {
                item: true
              }
            }
          }
        }
      }
    });

    if (!inmueble) {
      return reply.status(404).send({ success: false, error: 'Inmueble no encontrado' });
    }

    reply.send({ success: true, data: inmueble });
  } catch (error) {
    console.error('Error al obtener inmueble:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener inmueble' });
  }
};

// Crear inmueble (autenticado)
export const crearInmueble = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).id;

    if (!userId) {
      return reply.status(401).send({ success: false, error: 'Usuario no autenticado' });
    }

    const isMultipart = request.headers['content-type']?.includes('multipart/form-data');
    let data: any = {};
    let imagenes: string[] = [];

    if (isMultipart) {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'field') {
          data[part.fieldname] = part.value;
        } else if (part.type === 'file' && part.fieldname === 'imagenes') {
          const filename = `${Date.now()}-${(part as any).filename}`;
          const filepath = path.join(process.cwd(), 'public', 'uploads', 'inmuebles', filename);

          // Crear directorio si no existe
          const inmueblesDir = path.join(process.cwd(), 'public', 'uploads', 'inmuebles');
          console.log('📁 Verificando/creando directorio:', inmueblesDir);
          if (!fs.existsSync(inmueblesDir)) {
            fs.mkdirSync(inmueblesDir, { recursive: true });
            console.log('✅ Directorio creado');
          } else {
            console.log('✅ Directorio ya existe');
          }

          console.log('💾 Iniciando guardado de archivo:', filepath);
          try {
            await pipeline(part.file, fs.createWriteStream(filepath));
            console.log('✅ Archivo guardado exitosamente');

            // Verificar que el archivo existe
            if (fs.existsSync(filepath)) {
              const stats = fs.statSync(filepath);
              console.log('📊 Archivo verificado - Tamaño:', stats.size, 'bytes');
            } else {
              console.log('❌ ERROR: Archivo no existe después del guardado');
            }
          } catch (pipelineError) {
            console.error('❌ ERROR en pipeline:', pipelineError);
            throw pipelineError;
          }
          imagenes.push(`/uploads/inmuebles/${filename}`);
        }
      }
    } else {
      data = request.body as any;
    }

    const inmuebleData = {
      titulo: data.titulo,
      descripcion: data.descripcion || null,
      tipo: data.tipo,
      precio: parseFloat(data.precio),
      direccion: data.direccion,
      ciudad: data.ciudad,
      superficie: data.superficie ? parseFloat(data.superficie) : null,
      habitaciones: data.habitaciones ? parseInt(data.habitaciones) : null,
      banos: data.banos ? parseInt(data.banos) : null,
      garaje: data.garaje === 'true' || data.garaje === true,
      piscina: data.piscina === 'true' || data.piscina === true,
      jardin: data.jardin === 'true' || data.jardin === true,
      contactoNombre: data.contactoNombre,
      contactoTelefono: data.contactoTelefono,
      proyectoId: data.proyectoId || null,
      imagenes: imagenes.length > 0 ? JSON.stringify(imagenes) : null,
      usuarioId: userId
    };

    const inmueble = await prisma.inmueble.create({
      data: inmuebleData,
      include: {
        usuario: {
          select: { name: true }
        },
        proyecto: {
          select: { nombre: true }
        }
      }
    });

    reply.status(201).send({ success: true, data: inmueble });
  } catch (error) {
    console.error('Error al crear inmueble:', error);
    reply.status(500).send({ success: false, error: 'Error al crear inmueble' });
  }
};

// Obtener mis inmuebles (autenticado)
export const getMisInmuebles = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId;

    const inmuebles = await prisma.inmueble.findMany({
      where: { usuarioId: userId },
      include: {
        proyecto: {
          select: { nombre: true, superficieTotal: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    reply.send({ success: true, data: inmuebles });
  } catch (error) {
    console.error('Error al obtener mis inmuebles:', error);
    reply.status(500).send({ success: false, error: 'Error al obtener inmuebles' });
  }
};

// Actualizar inmueble (autenticado)
export const actualizarInmueble = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { id } = request.params as any;

    console.log('🔍 Usuario intentando editar inmueble:', { userId: user.id, rol: user.rol, email: user.email });
    console.log('🏠 ID del inmueble:', id);

    // Verificar permisos: propietario o administrador
    const whereClause: any = { id };
    if (user.rol !== 'ADMIN') {
      whereClause.usuarioId = user.id;
      console.log('👤 Usuario NO es admin, verificando propiedad del inmueble');
    } else {
      console.log('👑 Usuario ES admin, puede editar cualquier inmueble');
    }

    console.log('🔍 Cláusula WHERE para buscar inmueble:', whereClause);

    const inmuebleExistente = await prisma.inmueble.findFirst({
      where: whereClause
    });

    console.log('🏠 Inmueble encontrado:', inmuebleExistente ? 'SÍ' : 'NO');

    if (!inmuebleExistente) {
      console.log('❌ Permisos denegados o inmueble no encontrado');
      return reply.status(404).send({ success: false, error: 'Inmueble no encontrado o sin permisos' });
    }

    console.log('✅ Permisos verificados correctamente');

    const isMultipart = request.headers['content-type']?.includes('multipart/form-data');
    let data: any = {};
    let imagenes: string[] = [];

    if (isMultipart) {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'field') {
          data[part.fieldname] = part.value;
        } else if (part.type === 'file' && part.fieldname === 'imagenes') {
          const filename = `${Date.now()}-${(part as any).filename}`;
          const filepath = path.join(process.cwd(), 'public', 'uploads', 'inmuebles', filename);

          // Crear directorio si no existe
          const inmueblesDir = path.join(process.cwd(), 'public', 'uploads', 'inmuebles');
          if (!fs.existsSync(inmueblesDir)) {
            fs.mkdirSync(inmueblesDir, { recursive: true });
          }

          await pipeline(part.file, fs.createWriteStream(filepath));
          imagenes.push(`/uploads/inmuebles/${filename}`);
        }
      }
    } else {
      data = request.body as any;
    }

    // Procesar imágenes existentes
    let imagenesFinales: string[] = [];
    if (data.imagenesExistentes) {
      try {
        const existentes = JSON.parse(data.imagenesExistentes);
        imagenesFinales = [...existentes];
      } catch (error) {
        console.error('Error parsing imagenesExistentes:', error);
      }
    }

    // Agregar nuevas imágenes
    imagenesFinales = [...imagenesFinales, ...imagenes];

    const inmuebleData = {
      titulo: data.titulo,
      descripcion: data.descripcion || null,
      tipo: data.tipo,
      precio: parseFloat(data.precio),
      direccion: data.direccion,
      ciudad: data.ciudad,
      superficie: data.superficie ? parseFloat(data.superficie) : null,
      habitaciones: data.habitaciones ? parseInt(data.habitaciones) : null,
      banos: data.banos ? parseInt(data.banos) : null,
      garaje: data.garaje === 'true' || data.garaje === true,
      piscina: data.piscina === 'true' || data.piscina === true,
      jardin: data.jardin === 'true' || data.jardin === true,
      contactoNombre: data.contactoNombre,
      contactoTelefono: data.contactoTelefono,
      proyectoId: data.proyectoId || null,
      imagenes: imagenesFinales.length > 0 ? JSON.stringify(imagenesFinales) : null
    };

    const inmueble = await prisma.inmueble.update({
      where: { id },
      data: inmuebleData,
      include: {
        usuario: {
          select: { name: true }
        },
        proyecto: {
          select: { nombre: true }
        }
      }
    });

    reply.send({ success: true, data: inmueble });
  } catch (error) {
    console.error('Error al actualizar inmueble:', error);
    reply.status(500).send({ success: false, error: 'Error al actualizar inmueble' });
  }
};

// Eliminar inmueble (autenticado)
export const eliminarInmueble = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as any;
    const { id } = request.params as any;

    // Verificar permisos: propietario o administrador
    const whereClause: any = { id };
    if (user.rol !== 'ADMIN') {
      whereClause.usuarioId = user.id;
    }

    const inmuebleExistente = await prisma.inmueble.findFirst({
      where: whereClause
    });

    if (!inmuebleExistente) {
      return reply.status(404).send({ success: false, error: 'Inmueble no encontrado o sin permisos' });
    }

    // Eliminar imágenes del disco si existen
    if (inmuebleExistente.imagenes) {
      try {
        const imagenes = JSON.parse(inmuebleExistente.imagenes);
        for (const imagen of imagenes) {
          const filepath = path.join(process.cwd(), 'public', imagen);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }
      } catch (error) {
        console.error('Error al eliminar imágenes:', error);
      }
    }

    // Eliminar inmueble de la base de datos
    await prisma.inmueble.delete({
      where: { id }
    });

    reply.send({ success: true, message: 'Inmueble eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar inmueble:', error);
    reply.status(500).send({ success: false, error: 'Error al eliminar inmueble' });
  }
};
