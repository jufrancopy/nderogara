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
      precioUnitario: 45000,
      proveedor: 'INC',
      tipoCalidad: TipoCalidad.PREMIUM,
      comisionPorcentaje: 8,
      categoriaId: categoria.id,
      esCatalogo: true
    },
    {
      nombre: 'Ladrillo Común 6 huecos',
      unidad: UnidadMedida.UNIDAD,
      precioUnitario: 850,
      proveedor: 'Ladrillera Ita',
      tipoCalidad: TipoCalidad.COMUN,
      comisionPorcentaje: 5,
      categoriaId: categoria.id,
      esCatalogo: true
    },
    {
      nombre: 'Arena Fina',
      unidad: UnidadMedida.M3,
      precioUnitario: 180000,
      proveedor: 'Arenera Central',
      tipoCalidad: TipoCalidad.COMUN,
      comisionPorcentaje: 10,
      categoriaId: categoria.id,
      esCatalogo: true
    },
    {
      nombre: 'Piedra Partida',
      unidad: UnidadMedida.M3,
      precioUnitario: 220000,
      proveedor: 'Arenera Central',
      tipoCalidad: TipoCalidad.COMUN,
      comisionPorcentaje: 10,
      categoriaId: categoria.id,
      esCatalogo: true
    },
    {
      nombre: 'Hierro 8mm',
      unidad: UnidadMedida.KG,
      precioUnitario: 7500,
      proveedor: 'Aceros del Paraguay',
      tipoCalidad: TipoCalidad.INDUSTRIAL,
      comisionPorcentaje: 12,
      categoriaId: categoria.id,
      esCatalogo: true
    },
    {
      nombre: 'Cal Hidratada 20kg',
      unidad: UnidadMedida.BOLSA,
      precioUnitario: 28000,
      proveedor: 'Calera Vallemí',
      tipoCalidad: TipoCalidad.COMUN,
      comisionPorcentaje: 6,
      categoriaId: categoria.id,
      esCatalogo: true
    },
    {
      nombre: 'Cerámica Piso 45x45cm',
      unidad: UnidadMedida.M2,
      precioUnitario: 65000,
      proveedor: 'Cerámicas Itá',
      tipoCalidad: TipoCalidad.PREMIUM,
      comisionPorcentaje: 15,
      categoriaId: categoria.id,
      esCatalogo: true
    },
    {
      nombre: 'Pintura Látex Interior 20L',
      unidad: UnidadMedida.UNIDAD,
      precioUnitario: 280000,
      proveedor: 'Pinturas Unidas',
      tipoCalidad: TipoCalidad.PREMIUM,
      comisionPorcentaje: 18,
      categoriaId: categoria.id,
      esCatalogo: true
    }
  ];

  console.log('📦 Creando materiales del catálogo...');
  const materialesCreados = [];
  for (const mat of materiales) {
    const existing = await prisma.material.findFirst({
      where: { nombre: mat.nombre, esCatalogo: true }
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
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
