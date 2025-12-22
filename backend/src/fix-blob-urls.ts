import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBlobUrls() {
  console.log('🔍 Buscando ofertas con URLs de blob...');

  // Buscar todas las ofertas que tienen URLs de blob
  const ofertasConBlob = await prisma.ofertaProveedor.findMany({
    where: {
      imagenUrl: {
        startsWith: 'blob:'
      }
    }
  });

  console.log(`📋 Encontradas ${ofertasConBlob.length} ofertas con URLs de blob:`);

  for (const oferta of ofertasConBlob) {
    console.log(`  - Oferta ID ${oferta.id}: ${oferta.imagenUrl}`);
  }

  // También buscar materiales con URLs de blob
  const materialesConBlob = await prisma.material.findMany({
    where: {
      imagenUrl: {
        startsWith: 'blob:'
      }
    }
  });

  console.log(`📋 Encontrados ${materialesConBlob.length} materiales con URLs de blob:`);

  for (const material of materialesConBlob) {
    console.log(`  - Material ID ${material.id}: ${material.imagenUrl}`);
  }

  // Limpiar URLs de blob (poner null)
  if (ofertasConBlob.length > 0) {
    const resultOfertas = await prisma.ofertaProveedor.updateMany({
      where: {
        imagenUrl: {
          startsWith: 'blob:'
        }
      },
      data: {
        imagenUrl: null
      }
    });

    console.log(`✅ Limpiadas ${resultOfertas.count} ofertas con URLs de blob`);
  }

  if (materialesConBlob.length > 0) {
    const resultMateriales = await prisma.material.updateMany({
      where: {
        imagenUrl: {
          startsWith: 'blob:'
        }
      },
      data: {
        imagenUrl: null
      }
    });

    console.log(`✅ Limpiados ${resultMateriales.count} materiales con URLs de blob`);
  }

  console.log('🎉 Proceso completado');
}

fixBlobUrls()
  .catch(console.error)
  .finally(() => process.exit(0));
