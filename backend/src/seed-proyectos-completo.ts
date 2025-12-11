import { PrismaClient, UnidadMedida, EstadoProyecto } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🏗️  Creando proyectos de referencia...\n');

  // Buscar admin
  const admin = await prisma.user.findFirst({ where: { rol: 'ADMIN' } });
  if (!admin) {
    console.log('❌ No hay usuario admin');
    return;
  }

  // Buscar materiales y crear items
  const cemento = await prisma.material.findFirst({ where: { nombre: { contains: 'Cemento' } } });
  const ladrillo = await prisma.material.findFirst({ where: { nombre: { contains: 'Ladrillo' } } });
  const arena = await prisma.material.findFirst({ where: { nombre: { contains: 'Arena' } } });
  const hierro = await prisma.material.findFirst({ where: { nombre: { contains: 'Hierro' } } });

  if (!cemento || !ladrillo || !arena || !hierro) {
    console.log('❌ Faltan materiales base');
    return;
  }

  // Crear items
  const itemPared = await prisma.item.create({
    data: {
      nombre: 'Pared de Ladrillo 15cm',
      descripcion: 'Construcción de pared de ladrillo común de 15cm con mezcla',
      unidadMedida: UnidadMedida.M2,
      manoObraUnitaria: 35000,
      usuarioId: admin.id
    }
  });

  const itemContrapiso = await prisma.item.create({
    data: {
      nombre: 'Contrapiso',
      descripcion: 'Contrapiso de hormigón simple',
      unidadMedida: UnidadMedida.M2,
      manoObraUnitaria: 28000,
      usuarioId: admin.id
    }
  });

  const itemColumna = await prisma.item.create({
    data: {
      nombre: 'Columna de Hormigón 20x20cm',
      descripcion: 'Columna de hormigón armado con hierro',
      unidadMedida: UnidadMedida.ML,
      manoObraUnitaria: 85000,
      usuarioId: admin.id
    }
  });

  console.log('✅ Items creados\n');

  // Crear proyectos de referencia
  const casaEconomica = await prisma.proyecto.create({
    data: {
      nombre: '🏠 Casa Económica 60m²',
      descripcion: 'Casa básica de 2 dormitorios, living-comedor, cocina y baño. Construcción tradicional con ladrillo.',
      superficieTotal: 60,
      estado: EstadoProyecto.COMPLETADO,
      margenGanancia: 15,
      clienteNombre: 'Proyecto de Referencia',
      usuarioId: admin.id,
      esReferencia: true,
      imagenUrl: '/uploads/proyectos/casa-economica_60m2.jpg'
    }
  });

  const casaEstandar = await prisma.proyecto.create({
    data: {
      nombre: '🏡 Casa Estándar 100m²',
      descripcion: 'Casa de 3 dormitorios, 2 baños, living-comedor, cocina y lavadero. Terminaciones estándar.',
      superficieTotal: 100,
      estado: EstadoProyecto.COMPLETADO,
      margenGanancia: 18,
      clienteNombre: 'Proyecto de Referencia',
      usuarioId: admin.id,
      esReferencia: true,
      imagenUrl: '/uploads/proyectos/casa-standar_100m2.jpg'
    }
  });

  const casaPremium = await prisma.proyecto.create({
    data: {
      nombre: '🏘️ Casa Premium 150m²',
      descripcion: 'Casa de 4 dormitorios, 3 baños, living, comedor, cocina, lavadero y garaje. Terminaciones premium.',
      superficieTotal: 150,
      estado: EstadoProyecto.COMPLETADO,
      margenGanancia: 20,
      clienteNombre: 'Proyecto de Referencia',
      usuarioId: admin.id,
      esReferencia: true,
      imagenUrl: '/uploads/proyectos/casa-premium_150m2.webp'
    }
  });

  const ampliacion = await prisma.proyecto.create({
    data: {
      nombre: '🏢 Ampliación 40m²',
      descripcion: 'Ampliación de vivienda existente: 2 dormitorios y 1 baño.',
      superficieTotal: 40,
      estado: EstadoProyecto.COMPLETADO,
      margenGanancia: 15,
      clienteNombre: 'Proyecto de Referencia',
      usuarioId: admin.id,
      esReferencia: true,
      imagenUrl: '/uploads/proyectos/ampliacion_40m2.jpeg'
    }
  });

  console.log('✅ Proyectos creados\n');

  // Agregar presupuestos
  // Casa Económica 60m²
  await prisma.presupuestoItem.createMany({
    data: [
      {
        proyectoId: casaEconomica.id,
        itemId: itemPared.id,
        cantidadMedida: 120,
        costoMateriales: 2400000,
        costoManoObra: 4200000,
        costoTotal: 6600000
      },
      {
        proyectoId: casaEconomica.id,
        itemId: itemContrapiso.id,
        cantidadMedida: 60,
        costoMateriales: 1800000,
        costoManoObra: 1680000,
        costoTotal: 3480000
      }
    ]
  });

  // Casa Estándar 100m²
  await prisma.presupuestoItem.createMany({
    data: [
      {
        proyectoId: casaEstandar.id,
        itemId: itemPared.id,
        cantidadMedida: 200,
        costoMateriales: 4000000,
        costoManoObra: 7000000,
        costoTotal: 11000000
      },
      {
        proyectoId: casaEstandar.id,
        itemId: itemColumna.id,
        cantidadMedida: 24,
        costoMateriales: 1920000,
        costoManoObra: 2040000,
        costoTotal: 3960000
      },
      {
        proyectoId: casaEstandar.id,
        itemId: itemContrapiso.id,
        cantidadMedida: 100,
        costoMateriales: 3000000,
        costoManoObra: 2800000,
        costoTotal: 5800000
      }
    ]
  });

  // Casa Premium 150m²
  await prisma.presupuestoItem.createMany({
    data: [
      {
        proyectoId: casaPremium.id,
        itemId: itemPared.id,
        cantidadMedida: 300,
        costoMateriales: 6000000,
        costoManoObra: 10500000,
        costoTotal: 16500000
      },
      {
        proyectoId: casaPremium.id,
        itemId: itemColumna.id,
        cantidadMedida: 36,
        costoMateriales: 2880000,
        costoManoObra: 3060000,
        costoTotal: 5940000
      },
      {
        proyectoId: casaPremium.id,
        itemId: itemContrapiso.id,
        cantidadMedida: 150,
        costoMateriales: 4500000,
        costoManoObra: 4200000,
        costoTotal: 8700000
      }
    ]
  });

  // Ampliación 40m²
  await prisma.presupuestoItem.createMany({
    data: [
      {
        proyectoId: ampliacion.id,
        itemId: itemPared.id,
        cantidadMedida: 80,
        costoMateriales: 1600000,
        costoManoObra: 2800000,
        costoTotal: 4400000
      },
      {
        proyectoId: ampliacion.id,
        itemId: itemContrapiso.id,
        cantidadMedida: 40,
        costoMateriales: 1200000,
        costoManoObra: 1120000,
        costoTotal: 2320000
      }
    ]
  });

  console.log('✅ Presupuestos agregados\n');
  console.log('✨ Proyectos de referencia creados exitosamente!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
