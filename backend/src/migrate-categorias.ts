import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Verificando y agregando categorías faltantes...');

  // Categorías que deberían existir
  const categoriasRequeridas = [
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

  // Verificar cuáles categorías ya existen
  const categoriasExistentes = await prisma.categoriaMaterial.findMany({
    select: { nombre: true }
  });

  const nombresExistentes = categoriasExistentes.map(c => c.nombre);
  console.log('📋 Categorías existentes:', nombresExistentes);

  // Filtrar solo las categorías que no existen
  const categoriasFaltantes = categoriasRequeridas.filter(
    cat => !nombresExistentes.includes(cat.nombre)
  );

  if (categoriasFaltantes.length === 0) {
    console.log('✅ Todas las categorías ya existen. No hay nada que migrar.');
    return;
  }

  console.log('📝 Categorías faltantes que se agregarán:', categoriasFaltantes.map(c => c.nombre));

  // Crear solo las categorías faltantes
  for (const catData of categoriasFaltantes) {
    await prisma.categoriaMaterial.create({
      data: catData
    });
    console.log(`➕ Agregada categoría: ${catData.nombre}`);
  }

  console.log(`✅ Migración completada. Se agregaron ${categoriasFaltantes.length} categorías.`);

  // Mostrar resumen final
  const totalCategorias = await prisma.categoriaMaterial.count();
  console.log(`📊 Total de categorías en el sistema: ${totalCategorias}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
