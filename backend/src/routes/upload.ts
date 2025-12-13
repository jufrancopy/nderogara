import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

export async function uploadRoutes(fastify: FastifyInstance) {
  // Proteger rutas
  fastify.addHook('preHandler', async (request, reply) => {
    await request.jwtVerify();
  });

  // GET /upload/test - Endpoint de prueba sin multipart
  fastify.get('/test', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('🧪 Request GET /upload/test recibido');
    return reply.send({
      success: true,
      message: 'Upload endpoint funcionando',
      timestamp: new Date().toISOString()
    });
  });

  // POST /upload - Subir imagen general (para proyectos, etc.)
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('📨 Request POST /upload recibido');
    console.log('📨 Headers:', request.headers);
    console.log('📨 Raw body length:', request.raw?.headers ? request.raw.headers['content-length'] : 'unknown');

    try {
      const data = await request.file();
      console.log('📁 Archivo recibido:', data?.filename, data?.mimetype, data?.file?.bytesRead);

      if (!data) {
        console.log('❌ No se envió ningún archivo');
        return reply.status(400).send({ success: false, error: 'No se envió ningún archivo' });
      }

      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: 'Tipo de archivo no permitido. Solo imágenes JPG, PNG, WEBP y GIF'
        });
      }

      // Generar nombre único
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      const ext = path.extname(data.filename);
      const filename = `proyecto_${timestamp}_${random}${ext}`;
      const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

      // Crear directorio si no existe
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Guardar archivo
      const buffer = await data.toBuffer();
      await writeFile(filepath, buffer);

      // Construir URL completa para producción
      // En producción, los archivos estáticos se sirven desde el dominio del backend
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://apinderogara.thepydeveloper.dev'
        : 'http://localhost:3001';
      const url = `${baseUrl}/uploads/${filename}`;

      console.log('🔗 URL generada:', url);

      reply.send({
        success: true,
        data: {
          url,
          filename
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      reply.status(500).send({ success: false, error: 'Error al subir archivo' });
    }
  });

  // POST /upload/imagen - Subir imagen
  fastify.post('/imagen', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ success: false, error: 'No se envió ningún archivo' });
      }

      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ 
          success: false, 
          error: 'Tipo de archivo no permitido. Solo JPG, PNG y WEBP' 
        });
      }

      // Generar nombre único
      const timestamp = Date.now();
      const ext = path.extname(data.filename);
      const filename = `material_${timestamp}${ext}`;
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'materiales', filename);

      // Guardar archivo
      const buffer = await data.toBuffer();
      await writeFile(filepath, buffer);

      const url = `/uploads/materiales/${filename}`;

      reply.send({ 
        success: true, 
        data: { 
          url,
          filename 
        } 
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      reply.status(500).send({ success: false, error: 'Error al subir archivo' });
    }
  });

  // POST /upload/comprobante - Subir comprobante de pago
  fastify.post('/comprobante', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ success: false, error: 'No se envió ningún archivo' });
      }

      // Validar tipo de archivo (imágenes y PDFs)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: 'Tipo de archivo no permitido. Solo JPG, PNG, WEBP y PDF'
        });
      }

      // Generar nombre único
      const timestamp = Date.now();
      const ext = path.extname(data.filename);
      const filename = `comprobante_${timestamp}${ext}`;
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'comprobantes', filename);

      // Crear directorio si no existe
      const comprobantesDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes');
      if (!fs.existsSync(comprobantesDir)) {
        fs.mkdirSync(comprobantesDir, { recursive: true });
      }

      // Guardar archivo
      const buffer = await data.toBuffer();
      await writeFile(filepath, buffer);

      const url = `/uploads/comprobantes/${filename}`;

      reply.send({
        success: true,
        data: {
          url,
          filename
        }
      });
    } catch (error) {
      console.error('Error uploading comprobante:', error);
      reply.status(500).send({ success: false, error: 'Error al subir comprobante' });
    }
  });

  // GET /upload/galeria - Listar imágenes de la galería
  fastify.get('/galeria', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'materiales');

      // Crear directorio si no existe
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        return reply.send({ success: true, data: [] });
      }

      const files = await readdir(uploadsDir);
      const images = files
        .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .map(file => ({
          filename: file,
          url: `/uploads/materiales/${file}`
        }));

      reply.send({ success: true, data: images });
    } catch (error) {
      console.error('Error reading gallery:', error);
      reply.status(500).send({ success: false, error: 'Error al cargar galería' });
    }
  });
}
