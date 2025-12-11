import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️  Agregando imágenes a proyectos de referencia...');

  await prisma.proyecto.updateMany({
    where: { nombre: { contains: 'Casa Económica' } },
    data: { imagenUrl: '/uploads/proyectos/casa-economica.jpg' }
  });

  await prisma.proyecto.updateMany({
    where: { nombre: { contains: 'Casa Estándar' } },
    data: { imagenUrl: '/uploads/proyectos/casa-estandar.jpg' }
  });

  await prisma.proyecto.updateMany({
    where: { nombre: { contains: 'Casa Premium' } },
    data: { imagenUrl: '/uploads/proyectos/casa-premium.jpg' }
  });

  await prisma.proyecto.updateMany({
    where: { nombre: { contains: 'Ampliación' } },
    data: { imagenUrl: '/uploads/proyectos/ampliacion.jpg' }
  });

  console.log('✅ Imágenes agregadas a proyectos');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());