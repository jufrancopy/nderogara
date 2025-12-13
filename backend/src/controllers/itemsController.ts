import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Esquemas de validación
const createItemSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  unidadMedida: z.enum(['KG', 'BOLSA', 'M2', 'M3', 'ML', 'UNIDAD', 'LOTE', 'GLOBAL']),
  manoObraUnitaria: z.number().min(0).optional(),
  notasGenerales: z.string().optional()
})

export const itemsController = {
  // GET /items
  async getItems(request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string } }>, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const userId = user?.id;
      const userRol = user?.rol;

      // Parámetros de paginación
      const pageParam = request.query.page;
      const limitParam = request.query.limit;
      const search = request.query.search?.trim();

      // Si no se pasan parámetros de paginación, devolver todos los items (comportamiento legacy)
      const usePagination = pageParam !== undefined || limitParam !== undefined;

      const page = usePagination ? parseInt(pageParam || '1') : 1;
      const limit = usePagination ? parseInt(limitParam || '10') : undefined; // undefined = sin límite

      const skip = limit ? (page - 1) * limit : undefined;

      let whereCondition: any = { esActivo: true };

      // Filtrar según el rol del usuario
      if (userRol === 'ADMIN') {
        // Admin ve todos los items
        // No agregar condición adicional
      } else if (userRol === 'CONSTRUCTOR' || userRol === 'PROVEEDOR_SERVICIOS') {
        // Constructores y proveedores de servicios ven sus propios items
        whereCondition.usuarioId = userId;
      } else {
        // Otros roles (como CLIENTE) ven items públicos o del sistema
        whereCondition.usuarioId = null;
      }

      // Agregar búsqueda si existe
      if (search) {
        whereCondition.OR = [
          { nombre: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Obtener items paginados o todos
      const [items, total] = await Promise.all([
        prisma.item.findMany({
          where: whereCondition,
          include: {
            materialesPorItem: {
              include: {
                material: true
              }
            },
            _count: {
              select: { materialesPorItem: true }
            }
          },
          orderBy: { nombre: 'asc' },
          ...(skip !== undefined && { skip }),
          ...(limit !== undefined && { take: limit })
        }),
        prisma.item.count({ where: whereCondition })
      ]);

      const totalPages = limit ? Math.ceil(total / limit) : 1;

      return reply.send({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      })
    } catch (error) {
      console.error('Error fetching items:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // GET /items/:id
  async getItemById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params

      const item = await prisma.item.findUnique({
        where: { id },
        include: {
          materialesPorItem: {
            include: {
              material: true
            }
          }
        }
      })

      if (!item) {
        return reply.status(404).send({
          success: false,
          error: 'Item no encontrado'
        })
      }

      return reply.send({
        success: true,
        data: item
      })
    } catch (error) {
      console.error('Error fetching item:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // POST /items
  async createItem(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'No autenticado'
        });
      }

      console.log('📝 Creating item with data:', request.body)
      const validatedData = createItemSchema.parse(request.body)

      const item = await prisma.item.create({
        data: {
          ...validatedData,
          usuarioId: userId
        },
        include: {
          materialesPorItem: {
            include: {
              material: true
            }
          }
        }
      })

      return reply.status(201).send({
        success: true,
        data: item,
        message: 'Item creado exitosamente'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Validation error:', error.errors)
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        })
      }

      console.error('❌ Error creating item:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // PUT /items/:id
  async updateItem(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const userId = user?.id;
      const userRol = user?.rol;
      const { id } = request.params

      let whereCondition: any = { id };

      // Si no es admin, solo puede editar sus propios items
      if (userRol !== 'ADMIN') {
        whereCondition.usuarioId = userId;
      }

      const existing = await prisma.item.findFirst({
        where: whereCondition
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Item no encontrado o sin permisos para editarlo'
        });
      }

      const validatedData = createItemSchema.partial().parse(request.body)

      const item = await prisma.item.update({
        where: { id },
        data: validatedData,
        include: {
          materialesPorItem: {
            include: {
              material: true
            }
          }
        }
      })

      return reply.send({
        success: true,
        data: item,
        message: 'Item actualizado exitosamente'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        })
      }

      console.error('Error updating item:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // DELETE /items/:id
  async deleteItem(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const userId = user?.id;
      const userRol = user?.rol;
      const { id } = request.params

      let whereCondition: any = { id };

      // Si no es admin, solo puede eliminar sus propios items
      if (userRol !== 'ADMIN') {
        whereCondition.usuarioId = userId;
      }

      const existing = await prisma.item.findFirst({
        where: whereCondition
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Item no encontrado o sin permisos para eliminarlo'
        });
      }

      // Soft delete
      await prisma.item.update({
        where: { id },
        data: { esActivo: false }
      })

      return reply.send({
        success: true,
        message: 'Item eliminado exitosamente'
      })
    } catch (error) {
      console.error('Error deleting item:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // GET /items/:id/costo-estimado
  async getCostoEstimado(request: FastifyRequest<{ 
    Params: { id: string }
    Querystring: { cantidad?: string }
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params
      const cantidad = Number(request.query.cantidad) || 1

      console.log('🧮 Calculating cost for item:', id, 'cantidad:', cantidad)

      const item = await prisma.item.findUnique({
        where: { id },
        include: {
          materialesPorItem: {
            include: {
              material: {
                include: {
                  ofertas: {
                    where: { stock: true },
                    orderBy: { precio: 'asc' },
                    take: 1
                  }
                }
              }
            }
          }
        }
      })

      console.log('📦 Item found:', item?.nombre)
      console.log('🔗 Materials count:', item?.materialesPorItem?.length || 0)

      if (!item) {
        return reply.status(404).send({
          success: false,
          error: 'Item no encontrado'
        })
      }

      // Calcular costo de materiales
      const costoMateriales = item.materialesPorItem.reduce((total, materialItem) => {
        const precio = materialItem.material.precio ||
                      materialItem.material.ofertas?.[0]?.precio || 0;
        const costoMaterial = Number(precio) * Number(materialItem.cantidadPorUnidad)
        return total + costoMaterial
      }, 0)

      // Calcular costo de mano de obra
      const costoManoObra = Number(item.manoObraUnitaria || 0)

      // Costo total por unidad
      const costoUnitario = costoMateriales + costoManoObra

      // Costo total para la cantidad solicitada
      const costoTotal = costoUnitario * cantidad

      return reply.send({
        success: true,
        data: {
          itemId: item.id,
          itemNombre: item.nombre,
          unidadMedida: item.unidadMedida,
          cantidad,
          costoMateriales: costoMateriales * cantidad,
          costoManoObra: costoManoObra * cantidad,
          costoUnitario,
          costoTotal,
          desgloseMateriales: item.materialesPorItem.map(materialItem => {
            const precio = materialItem.material.precio ||
                          materialItem.material.ofertas?.[0]?.precio || 0;
            return {
              material: materialItem.material.nombre,
              cantidadPorUnidad: Number(materialItem.cantidadPorUnidad),
              precioUnitario: Number(precio),
              costoTotal: Number(precio) * Number(materialItem.cantidadPorUnidad) * cantidad
            };
          })
        }
      })
    } catch (error) {
      console.error('Error calculating costo estimado:', error)
      return reply.status(500).send({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}
