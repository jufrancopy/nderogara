import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { calcularDistancia, formatearDistancia } from '../utils/geolocation';

const prisma = new PrismaClient();

export const materialesController = {
  // GET /materiales - Lista materiales con sus ofertas
  async getMateriales(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      const query = request.query as any;
      const proyectoLat = query.proyectoLat ? parseFloat(query.proyectoLat) : null;
      const proyectoLng = query.proyectoLng ? parseFloat(query.proyectoLng) : null;

      const materiales = await prisma.material.findMany({
        where: userId ? {
          OR: [
            { usuarioId: null }, // Materiales del catálogo
            { usuarioId: userId } // Materiales personalizados del usuario
          ]
        } : {
          usuarioId: null // Solo catálogo si no está autenticado
        },
        include: {
          categoria: true,
          ofertas: {
            where: { stock: true },
            include: {
              proveedor: {
                select: {
                  nombre: true,
                  logo: true,
                  ciudad: true,
                  departamento: true,
                  latitud: true,
                  longitud: true
                }
              }
            },
            orderBy: { precio: 'asc' }
          }
        },
        orderBy: { nombre: 'asc' }
      });

      // Si se proporcionan coordenadas del proyecto, calcular distancias y reordenar ofertas
      if (proyectoLat && proyectoLng && materiales.length > 0) {
        const proyectoCoords = { latitud: proyectoLat, longitud: proyectoLng };

        // Procesar cada material y ordenar sus ofertas por distancia
        const materialesConDistancias = materiales.map(material => ({
          ...material,
          ofertas: (material as any).ofertas
            .map(oferta => {
              let distancia = null;
              let distanciaFormateada = null;

              if (oferta.proveedor.latitud && oferta.proveedor.longitud) {
                distancia = calcularDistancia(proyectoCoords, {
                  latitud: oferta.proveedor.latitud,
                  longitud: oferta.proveedor.longitud
                });
                distanciaFormateada = formatearDistancia(distancia);
              }

              return {
                ...oferta,
                proveedor: {
                  ...oferta.proveedor,
                  distancia,
                  distanciaFormateada
                }
              };
            })
            .sort((a, b) => {
              // Primero proveedores con coordenadas (ordenados por distancia)
              const aDist = (a.proveedor as any).distancia;
              const bDist = (b.proveedor as any).distancia;

              if (aDist === null && bDist === null) return 0;
              if (aDist === null) return 1;
              if (bDist === null) return -1;

              return aDist - bDist;
            })
        }));

        reply.send({ success: true, data: materialesConDistancias });
      } else {
        reply.send({ success: true, data: materiales });
      }
    } catch (error) {
      console.error('Error fetching materiales:', error);
      reply.status(500).send({ success: false, error: 'Error al cargar materiales' });
    }
  },

  // GET /materiales/:id - Detalle de material con todas sus ofertas
  async getMaterialById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const material = await prisma.material.findUnique({
        where: { id },
        include: {
          categoria: true,
          ofertas: {
            include: {
              proveedor: true
            },
            orderBy: { precio: 'asc' }
          }
        }
      });

      if (!material) {
        return reply.status(404).send({ success: false, error: 'Material no encontrado' });
      }

      reply.send({ success: true, data: material });
    } catch (error) {
      console.error('Error fetching material:', error);
      reply.status(500).send({ success: false, error: 'Error al cargar material' });
    }
  }
};
