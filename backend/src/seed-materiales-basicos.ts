import { PrismaClient, UnidadMedida } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando categorías de materiales...');

  // Crear categorías principales
  const categoriasData = [
    { nombre: 'Estructural', descripcion: 'Vigas, columnas, losas y elementos portantes' },
    { nombre: 'Mampostería', descripcion: 'Ladrillos, bloques y elementos de cerramiento' },
    { nombre: 'Acabados', descripcion: 'Pinturas, pisos, revestimientos y terminaciones' },
    { nombre: 'Instalaciones Eléctricas', descripcion: 'Cables, interruptores, tomas y equipos eléctricos' },
    { nombre: 'Instalaciones Sanitarias', descripcion: 'Tuberías, grifería y equipos de plomería' },
    { nombre: 'Herramientas', descripcion: 'Equipos y herramientas para construcción' },
    { nombre: 'Construcción General', descripcion: 'Materiales básicos de construcción' },
    { nombre: 'Aislantes', descripcion: 'Materiales de aislamiento térmico y acústico' },
    { nombre: 'Fijaciones', descripcion: 'Clavos, tornillos, pernos y elementos de unión' },
    { nombre: 'Adhesivos y Selladores', descripcion: 'Pegamentos, siliconas y materiales de unión' },
    { nombre: 'Cubierta y Techos', descripcion: 'Tejas, planchas y elementos de cubierta' },
    { nombre: 'Carpintería', descripcion: 'Puertas, ventanas y elementos de madera' },
    { nombre: 'Jardinería', descripcion: 'Materiales para áreas verdes y exteriores' },
    { nombre: 'Seguridad', descripcion: 'Equipos de protección y seguridad en obra' }
  ];

  const categorias = [];
  for (const catData of categoriasData) {
    const categoria = await prisma.categoriaMaterial.upsert({
      where: { nombre: catData.nombre },
      update: {},
      create: catData
    });
    categorias.push(categoria);
  }

  console.log('✅ Categorías creadas');

  // Crear materiales básicos usando la categoría general
  const categoriaGeneral = categorias.find(c => c.nombre === 'Construcción General');

  if (!categoriaGeneral) {
    throw new Error('No se encontró la categoría Construcción General');
  }

  // Crear materiales base
  await prisma.material.upsert({
    where: { id: 'cemento-1' },
    update: {},
    create: {
      id: 'cemento-1',
      nombre: 'Cemento Portland 50kg',
      descripcion: 'Cemento Portland tipo I',
      unidad: UnidadMedida.BOLSA,
      categoriaId: categoriaGeneral.id,
      usuarioId: null
    }
  });

  await prisma.material.upsert({
    where: { id: 'ladrillo-1' },
    update: {},
    create: {
      id: 'ladrillo-1',
      nombre: 'Ladrillo Común 6 huecos',
      descripcion: 'Ladrillo común de arcilla',
      unidad: UnidadMedida.UNIDAD,
      categoriaId: categoriaGeneral.id,
      usuarioId: null
    }
  });

  await prisma.material.upsert({
    where: { id: 'arena-1' },
    update: {},
    create: {
      id: 'arena-1',
      nombre: 'Arena Fina',
      descripcion: 'Arena fina para mezcla',
      unidad: UnidadMedida.M3,
      categoriaId: categoriaGeneral.id,
      usuarioId: null
    }
  });

  await prisma.material.upsert({
    where: { id: 'hierro-1' },
    update: {},
    create: {
      id: 'hierro-1',
      nombre: 'Hierro 8mm',
      descripcion: 'Barra de hierro corrugado',
      unidad: UnidadMedida.KG,
      categoriaId: categoriaGeneral.id,
      usuarioId: null
    }
  });

  console.log('✅ Materiales básicos creados');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
