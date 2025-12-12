import { PrismaClient, UnidadMedida, EstadoProyecto, TipoCalidad } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProyectosReferencia() {
  console.log('🌱 Creando proyectos de referencia para Paraguay...');

  // Buscar o crear usuario admin
  let adminUser = await prisma.user.findFirst({
    where: { rol: 'ADMIN' }
  });

  if (!adminUser) {
    console.log('⚠️  No hay usuario admin. Creando uno...');
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@buildmanager.com',
        name: 'Administrador',
        rol: 'ADMIN',
        password: '$2a$10$YourHashedPasswordHere' // Cambiar en producción
      }
    });
  }

  // Buscar o crear categoría
  let categoria = await prisma.categoriaMaterial.findFirst({
    where: { nombre: 'Construcción General' }
  });

  if (!categoria) {
    categoria = await prisma.categoriaMaterial.create({
      data: {
        nombre: 'Construcción General',
        descripcion: 'Materiales básicos de construcción'
      }
    });
  }

  // Crear materiales del catálogo con precios de Paraguay (en Guaraníes)
  const materiales = [
    {
      nombre: 'Cemento Portland 50kg',
      unidad: UnidadMedida.BOLSA,
      categoriaId: categoria.id,
      usuarioId: null // null = catálogo admin
    },
    {
      nombre: 'Ladrillo Común 6 huecos',
      unidad: UnidadMedida.UNIDAD,
      categoriaId: categoria.id,
      usuarioId: null
    },
    {
      nombre: 'Arena Fina',
      unidad: UnidadMedida.M3,
      categoriaId: categoria.id,
      usuarioId: null
    },
    {
      nombre: 'Piedra Partida',
      unidad: UnidadMedida.M3,
      categoriaId: categoria.id,
      usuarioId: null
    },
    {
      nombre: 'Hierro 8mm',
      unidad: UnidadMedida.KG,
      categoriaId: categoria.id,
      usuarioId: null
    },
    {
      nombre: 'Cal Hidratada 20kg',
      unidad: UnidadMedida.BOLSA,
      categoriaId: categoria.id,
      usuarioId: null
    },
    {
      nombre: 'Cerámica Piso 45x45cm',
      unidad: UnidadMedida.M2,
      categoriaId: categoria.id,
      usuarioId: null
    },
    {
      nombre: 'Pintura Látex Interior 20L',
      unidad: UnidadMedida.UNIDAD,
      categoriaId: categoria.id,
      usuarioId: null
    }
  ];

  console.log('📦 Creando materiales del catálogo...');
  const materialesCreados = [];
  for (const mat of materiales) {
    const existing = await prisma.material.findFirst({
      where: { nombre: mat.nombre, usuarioId: null }
    });
    
    if (!existing) {
      const created = await prisma.material.create({ data: mat });
      materialesCreados.push(created);
      console.log(`✅ Material creado: ${mat.nombre}`);
    } else {
      materialesCreados.push(existing);
      console.log(`⏭️  Material ya existe: ${mat.nombre}`);
    }
  }

  // Crear items de construcción
  const items = [
    {
      nombre: 'Pared de Ladrillo 15cm',
      descripcion: 'Construcción de pared de ladrillo común de 15cm con mezcla',
      unidadMedida: UnidadMedida.M2,
      manoObraUnitaria: 35000,
      usuarioId: adminUser.id
    },
    {
      nombre: 'Columna de Hormigón 20x20cm',
      descripcion: 'Columna de hormigón armado con hierro',
      unidadMedida: UnidadMedida.ML,
      manoObraUnitaria: 85000,
      usuarioId: adminUser.id
    },
    {
      nombre: 'Contrapiso',
      descripcion: 'Contrapiso de hormigón simple',
      unidadMedida: UnidadMedida.M2,
      manoObraUnitaria: 28000,
      usuarioId: adminUser.id
    },
    {
      nombre: 'Colocación de Cerámica',
      descripcion: 'Colocación de cerámica en piso',
      unidadMedida: UnidadMedida.M2,
      manoObraUnitaria: 45000,
      usuarioId: adminUser.id
    },
    {
      nombre: 'Pintura Interior',
      descripcion: 'Pintura látex en paredes interiores (2 manos)',
      unidadMedida: UnidadMedida.M2,
      manoObraUnitaria: 18000,
      usuarioId: adminUser.id
    }
  ];

  console.log('🔨 Creando items de construcción...');
  const itemsCreados = [];
  for (const item of items) {
    const existing = await prisma.item.findFirst({
      where: { nombre: item.nombre, usuarioId: adminUser.id }
    });
    
    if (!existing) {
      const created = await prisma.item.create({ data: item });
      itemsCreados.push(created);
      console.log(`✅ Item creado: ${item.nombre}`);
    } else {
      itemsCreados.push(existing);
      console.log(`⏭️  Item ya existe: ${item.nombre}`);
    }
  }

  // Crear relaciones materiales por item (matriz inteligente)
  console.log('🔗 Creando relaciones materiales-items...');

  const relacionesMateriales = [
    // Pared de Ladrillo 15cm
    { itemNombre: 'Pared de Ladrillo 15cm', materialNombre: 'Ladrillo Común 6 huecos', cantidad: 55 },
    { itemNombre: 'Pared de Ladrillo 15cm', materialNombre: 'Arena Fina', cantidad: 0.08 },
    { itemNombre: 'Pared de Ladrillo 15cm', materialNombre: 'Cemento Portland 50kg', cantidad: 0.06 },
    { itemNombre: 'Pared de Ladrillo 15cm', materialNombre: 'Cal Hidratada 20kg', cantidad: 0.2 },

    // Columna de Hormigón 20x20cm
    { itemNombre: 'Columna de Hormigón 20x20cm', materialNombre: 'Cemento Portland 50kg', cantidad: 0.15 },
    { itemNombre: 'Columna de Hormigón 20x20cm', materialNombre: 'Arena Fina', cantidad: 0.12 },
    { itemNombre: 'Columna de Hormigón 20x20cm', materialNombre: 'Piedra Partida', cantidad: 0.15 },
    { itemNombre: 'Columna de Hormigón 20x20cm', materialNombre: 'Hierro 8mm', cantidad: 8 },

    // Contrapiso
    { itemNombre: 'Contrapiso', materialNombre: 'Cemento Portland 50kg', cantidad: 0.08 },
    { itemNombre: 'Contrapiso', materialNombre: 'Arena Fina', cantidad: 0.06 },
    { itemNombre: 'Contrapiso', materialNombre: 'Piedra Partida', cantidad: 0.08 },

    // Colocación de Cerámica
    { itemNombre: 'Colocación de Cerámica', materialNombre: 'Cerámica Piso 45x45cm', cantidad: 1 },
    { itemNombre: 'Colocación de Cerámica', materialNombre: 'Cemento Portland 50kg', cantidad: 0.02 },
    { itemNombre: 'Colocación de Cerámica', materialNombre: 'Arena Fina', cantidad: 0.015 },

    // Pintura Interior
    { itemNombre: 'Pintura Interior', materialNombre: 'Pintura Látex Interior 20L', cantidad: 0.05 },
    { itemNombre: 'Pintura Interior', materialNombre: 'Cemento Portland 50kg', cantidad: 0.01 }
  ];

  for (const relacion of relacionesMateriales) {
    // Encontrar el item
    const item = itemsCreados.find(i => i.nombre === relacion.itemNombre);
    if (!item) {
      console.log(`⚠️  Item no encontrado: ${relacion.itemNombre}`);
      continue;
    }

    // Encontrar el material
    const material = materialesCreados.find(m => m.nombre === relacion.materialNombre);
    if (!material) {
      console.log(`⚠️  Material no encontrado: ${relacion.materialNombre}`);
      continue;
    }

    // Verificar si ya existe la relación
    const existing = await prisma.materialPorItem.findFirst({
      where: {
        itemId: item.id,
        materialId: material.id
      }
    });

    if (!existing) {
      await prisma.materialPorItem.create({
        data: {
          itemId: item.id,
          materialId: material.id,
          cantidadPorUnidad: relacion.cantidad,
          observaciones: `Material para ${item.nombre}`
        }
      });
      console.log(`✅ Relación creada: ${item.nombre} - ${material.nombre} (${relacion.cantidad})`);
    } else {
      console.log(`⏭️  Relación ya existe: ${item.nombre} - ${material.nombre}`);
    }
  }

  console.log('📋 Creando presupuestos para proyectos de referencia...');

  // Crear presupuestos para proyectos de referencia
  const proyectoEconomico = await prisma.proyecto.findFirst({
    where: { nombre: '🏠 Casa Económica 60m²', usuarioId: adminUser.id }
  });

  if (proyectoEconomico) {
    // Presupuesto para casa económica
    const presupuestoItemsCasaEconomica = [
      { itemNombre: 'Pared de Ladrillo 15cm', cantidad: 120 },
      { itemNombre: 'Columna de Hormigón 20x20cm', cantidad: 25 },
      { itemNombre: 'Contrapiso', cantidad: 60 },
      { itemNombre: 'Colocación de Cerámica', cantidad: 40 },
      { itemNombre: 'Pintura Interior', cantidad: 100 }
    ];

    for (const itemPresupuesto of presupuestoItemsCasaEconomica) {
      const item = itemsCreados.find(i => i.nombre === itemPresupuesto.itemNombre);
      if (!item || !item.manoObraUnitaria) continue;

      const costoManoObra = (item.manoObraUnitaria || 0) * itemPresupuesto.cantidad;
      const costoTotal = costoManoObra * 1.15; // 15% margen

      await prisma.presupuestoItem.upsert({
        where: {
          proyectoId_itemId: {
            proyectoId: proyectoEconomico.id,
            itemId: item.id
          }
        },
        update: {
          cantidadMedida: itemPresupuesto.cantidad,
          costoManoObra: costoManoObra,
          costoMateriales: 0, // Por ahora 0, se calcula automáticamente después
          costoTotal: costoTotal
        },
        create: {
          proyectoId: proyectoEconomico.id,
          itemId: item.id,
          cantidadMedida: itemPresupuesto.cantidad,
          costoManoObra: costoManoObra,
          costoMateriales: 0, // Por ahora 0, se calcula automáticamente después
          costoTotal: costoTotal
        }
      });
    }
    console.log('✅ Presupuesto creado para casa económica');
  }

  // Crear proyectos de referencia
  const proyectos = [
    {
      nombre: '🏠 Casa Económica 60m²',
      descripcion: 'Casa básica de 2 dormitorios, living-comedor, cocina y baño. Construcción tradicional con ladrillo.',
      superficieTotal: 60,
      estado: EstadoProyecto.COMPLETADO,
      margenGanancia: 15,
      clienteNombre: 'Proyecto de Referencia',
      usuarioId: adminUser.id,
      esReferencia: true // Necesitaremos agregar este campo
    },
    {
      nombre: '🏡 Casa Estándar 100m²',
      descripcion: 'Casa de 3 dormitorios, 2 baños, living-comedor, cocina y lavadero. Terminaciones estándar.',
      superficieTotal: 100,
      estado: EstadoProyecto.COMPLETADO,
      margenGanancia: 18,
      clienteNombre: 'Proyecto de Referencia',
      usuarioId: adminUser.id,
      esReferencia: true
    },
    {
      nombre: '🏘️ Casa Premium 150m²',
      descripcion: 'Casa de 4 dormitorios, 3 baños, living, comedor, cocina, lavadero y garaje. Terminaciones premium.',
      superficieTotal: 150,
      estado: EstadoProyecto.COMPLETADO,
      margenGanancia: 20,
      clienteNombre: 'Proyecto de Referencia',
      usuarioId: adminUser.id,
      esReferencia: true
    },
    {
      nombre: '🏢 Ampliación 40m²',
      descripcion: 'Ampliación de vivienda existente: 2 dormitorios y 1 baño.',
      superficieTotal: 40,
      estado: EstadoProyecto.COMPLETADO,
      margenGanancia: 15,
      clienteNombre: 'Proyecto de Referencia',
      usuarioId: adminUser.id,
      esReferencia: true
    }
  ];

  console.log('🏗️  Creando proyectos de referencia...');
  for (const proyecto of proyectos) {
    const existing = await prisma.proyecto.findFirst({
      where: { nombre: proyecto.nombre, usuarioId: adminUser.id }
    });
    
    if (!existing) {
      await prisma.proyecto.create({ data: proyecto });
      console.log(`✅ Proyecto creado: ${proyecto.nombre}`);
    } else {
      console.log(`⏭️  Proyecto ya existe: ${proyecto.nombre}`);
    }
  }

  console.log('✨ Seed completado!');
}

seedProyectosReferencia()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
