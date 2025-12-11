import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPresupuestos() {
  console.log('💰 Agregando presupuestos a proyectos de referencia...');

  // Buscar admin y proyectos
  const admin = await prisma.user.findFirst({ where: { rol: 'ADMIN' } });
  if (!admin) {
    console.log('❌ No hay usuario admin');
    return;
  }

  const proyectos = await prisma.proyecto.findMany({
    where: { esReferencia: true, usuarioId: admin.id }
  });

  const items = await prisma.item.findMany({
    where: { usuarioId: admin.id }
  });

  if (items.length === 0) {
    console.log('❌ No hay items creados');
    return;
  }

  // Casa Económica 60m²
  const casaEconomica = proyectos.find(p => p.nombre.includes('60m²'));
  if (casaEconomica) {
    console.log('🏠 Agregando presupuesto a Casa Económica 60m²...');
    
    const paredItem = items.find(i => i.nombre.includes('Pared'));
    const contrapisoItem = items.find(i => i.nombre.includes('Contrapiso'));
    const pinturaItem = items.find(i => i.nombre.includes('Pintura'));

    if (paredItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaEconomica.id,
          itemId: paredItem.id,
          cantidadMedida: 120, // 120m² de paredes
          costoMateriales: 2400000, // ₲2,400,000
          costoManoObra: 4200000, // ₲4,200,000
          costoTotal: 6600000
        }
      });
    }

    if (contrapisoItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaEconomica.id,
          itemId: contrapisoItem.id,
          cantidadMedida: 60,
          costoMateriales: 1800000,
          costoManoObra: 1680000,
          costoTotal: 3480000
        }
      });
    }

    if (pinturaItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaEconomica.id,
          itemId: pinturaItem.id,
          cantidadMedida: 200,
          costoMateriales: 1400000,
          costoManoObra: 3600000,
          costoTotal: 5000000
        }
      });
    }
  }

  // Casa Estándar 100m²
  const casaEstandar = proyectos.find(p => p.nombre.includes('100m²'));
  if (casaEstandar) {
    console.log('🏡 Agregando presupuesto a Casa Estándar 100m²...');
    
    const paredItem = items.find(i => i.nombre.includes('Pared'));
    const columnaItem = items.find(i => i.nombre.includes('Columna'));
    const contrapisoItem = items.find(i => i.nombre.includes('Contrapiso'));
    const ceramicaItem = items.find(i => i.nombre.includes('Cerámica'));
    const pinturaItem = items.find(i => i.nombre.includes('Pintura'));

    if (paredItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaEstandar.id,
          itemId: paredItem.id,
          cantidadMedida: 200,
          costoMateriales: 4000000,
          costoManoObra: 7000000,
          costoTotal: 11000000
        }
      });
    }

    if (columnaItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaEstandar.id,
          itemId: columnaItem.id,
          cantidadMedida: 24,
          costoMateriales: 1920000,
          costoManoObra: 2040000,
          costoTotal: 3960000
        }
      });
    }

    if (contrapisoItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaEstandar.id,
          itemId: contrapisoItem.id,
          cantidadMedida: 100,
          costoMateriales: 3000000,
          costoManoObra: 2800000,
          costoTotal: 5800000
        }
      });
    }

    if (ceramicaItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaEstandar.id,
          itemId: ceramicaItem.id,
          cantidadMedida: 80,
          costoMateriales: 5200000,
          costoManoObra: 3600000,
          costoTotal: 8800000
        }
      });
    }

    if (pinturaItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaEstandar.id,
          itemId: pinturaItem.id,
          cantidadMedida: 350,
          costoMateriales: 2450000,
          costoManoObra: 6300000,
          costoTotal: 8750000
        }
      });
    }
  }

  // Casa Premium 150m²
  const casaPremium = proyectos.find(p => p.nombre.includes('150m²'));
  if (casaPremium) {
    console.log('🏘️ Agregando presupuesto a Casa Premium 150m²...');
    
    const paredItem = items.find(i => i.nombre.includes('Pared'));
    const columnaItem = items.find(i => i.nombre.includes('Columna'));
    const contrapisoItem = items.find(i => i.nombre.includes('Contrapiso'));
    const ceramicaItem = items.find(i => i.nombre.includes('Cerámica'));
    const pinturaItem = items.find(i => i.nombre.includes('Pintura'));

    if (paredItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaPremium.id,
          itemId: paredItem.id,
          cantidadMedida: 300,
          costoMateriales: 6000000,
          costoManoObra: 10500000,
          costoTotal: 16500000
        }
      });
    }

    if (columnaItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaPremium.id,
          itemId: columnaItem.id,
          cantidadMedida: 36,
          costoMateriales: 2880000,
          costoManoObra: 3060000,
          costoTotal: 5940000
        }
      });
    }

    if (contrapisoItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaPremium.id,
          itemId: contrapisoItem.id,
          cantidadMedida: 150,
          costoMateriales: 4500000,
          costoManoObra: 4200000,
          costoTotal: 8700000
        }
      });
    }

    if (ceramicaItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaPremium.id,
          itemId: ceramicaItem.id,
          cantidadMedida: 130,
          costoMateriales: 8450000,
          costoManoObra: 5850000,
          costoTotal: 14300000
        }
      });
    }

    if (pinturaItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: casaPremium.id,
          itemId: pinturaItem.id,
          cantidadMedida: 500,
          costoMateriales: 3500000,
          costoManoObra: 9000000,
          costoTotal: 12500000
        }
      });
    }
  }

  // Ampliación 40m²
  const ampliacion = proyectos.find(p => p.nombre.includes('40m²'));
  if (ampliacion) {
    console.log('🏢 Agregando presupuesto a Ampliación 40m²...');
    
    const paredItem = items.find(i => i.nombre.includes('Pared'));
    const contrapisoItem = items.find(i => i.nombre.includes('Contrapiso'));
    const ceramicaItem = items.find(i => i.nombre.includes('Cerámica'));
    const pinturaItem = items.find(i => i.nombre.includes('Pintura'));

    if (paredItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: ampliacion.id,
          itemId: paredItem.id,
          cantidadMedida: 80,
          costoMateriales: 1600000,
          costoManoObra: 2800000,
          costoTotal: 4400000
        }
      });
    }

    if (contrapisoItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: ampliacion.id,
          itemId: contrapisoItem.id,
          cantidadMedida: 40,
          costoMateriales: 1200000,
          costoManoObra: 1120000,
          costoTotal: 2320000
        }
      });
    }

    if (ceramicaItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: ampliacion.id,
          itemId: ceramicaItem.id,
          cantidadMedida: 30,
          costoMateriales: 1950000,
          costoManoObra: 1350000,
          costoTotal: 3300000
        }
      });
    }

    if (pinturaItem) {
      await prisma.presupuestoItem.create({
        data: {
          proyectoId: ampliacion.id,
          itemId: pinturaItem.id,
          cantidadMedida: 140,
          costoMateriales: 980000,
          costoManoObra: 2520000,
          costoTotal: 3500000
        }
      });
    }
  }

  console.log('✨ Presupuestos agregados exitosamente!');
}

seedPresupuestos()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
