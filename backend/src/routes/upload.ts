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
