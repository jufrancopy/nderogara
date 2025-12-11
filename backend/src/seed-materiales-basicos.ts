import { PrismaClient, UnidadMedida } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando materiales básicos...');

  // Crear categoría
  const categoria = await prisma.categoriaMaterial.upsert({
    where: { nombre: 'Construcción General' },
    update: {},
    create: {
      nombre: 'Construcción General',
      descripcion: 'Materiales básicos de construcción'
    }
  });

  // Crear materiales base
  await prisma.material.upsert({
    where: { id: 'cemento-1' },
    update: {},
    create: {
      id: 'cemento-1',
      nombre: 'Cemento Portland 50kg',
      descripcion: 'Cemento Portland tipo I',
      unidad: UnidadMedida.BOLSA,
      categoriaId: categoria.id,
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
      categoriaId: categoria.id,
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
      categoriaId: categoria.id,
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
      categoriaId: categoria.id,
      usuarioId: null
    }
  });

  console.log('✅ Materiales básicos creados');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());