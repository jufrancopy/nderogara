import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Actualizando rutas de imágenes...');

  await prisma.proyecto.updateMany({
    where: { nombre: { contains: 'Casa Económica' } },
    data: { imagenUrl: '/uploads/proyectos/casa-economica_60m2.jpg' }
  });

  await prisma.proyecto.updateMany({
    where: { nombre: { contains: 'Casa Estándar' } },
    data: { imagenUrl: '/uploads/proyectos/casa-standar_100m2.jpg' }
  });

  await prisma.proyecto.updateMany({
    where: { nombre: { contains: 'Casa Premium' } },
    data: { imagenUrl: '/uploads/proyectos/casa-premium_150m2.webp' }
  });

  await prisma.proyecto.updateMany({
    where: { nombre: { contains: 'Ampliación' } },
    data: { imagenUrl: '/uploads/proyectos/ampliacion_40m2.jpeg' }
  });

  console.log('✅ Rutas actualizadas');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());