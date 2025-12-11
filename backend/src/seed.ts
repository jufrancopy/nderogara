import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear categorías de materiales
  const categorias = await Promise.all([
    prisma.categoriaMaterial.upsert({
      where: { nombre: 'Estructural' },
      update: {},
      create: {
        nombre: 'Estructural',
        descripcion: 'Materiales para estructura y cimentación'
      }
    }),
    prisma.categoriaMaterial.upsert({
      where: { nombre: 'Mampostería' },
      update: {},
      create: {
        nombre: 'Mampostería',
        descripcion: 'Ladrillos, bloques y materiales de construcción'
      }
    }),
    prisma.categoriaMaterial.upsert({
      where: { nombre: 'Acabados' },
      update: {},
      create: {
        nombre: 'Acabados',
        descripcion: 'Materiales de terminación y acabados'
      }
    }),
    prisma.categoriaMaterial.upsert({
      where: { nombre: 'Instalaciones' },
      update: {},
      create: {
        nombre: 'Instalaciones',
        descripcion: 'Materiales para instalaciones eléctricas y sanitarias'
      }
    })
  ])

  console.log('✅ Categorías creadas:', categorias.length)

  // Crear algunos materiales de ejemplo
  const materiales = await Promise.all([
    prisma.material.upsert({
      where: { id: 'cement-portland-1' },
      update: {},
      create: {
        id: 'cement-portland-1',
        nombre: 'Cemento Portland',
        unidad: 'BOLSA',
        precioUnitario: 450000,
        tipoCalidad: 'PREMIUM',
        marca: 'Holcim',
        proveedor: 'Holcim Colombia',
        telefonoProveedor: '3001234567',
        stockMinimo: 10,
        observaciones: 'Bolsa de 50kg',
        categoriaId: categorias[0].id
      }
    }),
    prisma.material.upsert({
      where: { id: 'ladrillo-comun-1' },
      update: {},
      create: {
        id: 'ladrillo-comun-1',
        nombre: 'Ladrillo Común',
        unidad: 'UNIDAD',
        precioUnitario: 10000,
        tipoCalidad: 'COMUN',
        proveedor: 'Ladrillera Local',
        telefonoProveedor: '3007654321',
        stockMinimo: 100,
        observaciones: 'Ladrillo rojo común 6x12x24cm',
        categoriaId: categorias[1].id
      }
    }),
    prisma.material.upsert({
      where: { id: 'arena-fina-1' },
      update: {},
      create: {
        id: 'arena-fina-1',
        nombre: 'Arena Fina',
        unidad: 'M3',
        precioUnitario: 850000,
        tipoCalidad: 'COMUN',
        proveedor: 'Arenera El Río',
        telefonoProveedor: '3009876543',
        stockMinimo: 2,
        observaciones: 'Arena fina para revoque',
        categoriaId: categorias[0].id
      }
    }),
    prisma.material.upsert({
      where: { id: 'cal-hidratada-1' },
      update: {},
      create: {
        id: 'cal-hidratada-1',
        nombre: 'Cal Hidratada',
        unidad: 'BOLSA',
        precioUnitario: 120000,
        tipoCalidad: 'COMUN',
        marca: 'Cales y Derivados',
        proveedor: 'Distribuidora Central',
        telefonoProveedor: '3005432109',
        stockMinimo: 5,
        observaciones: 'Bolsa de 25kg',
        categoriaId: categorias[1].id
      }
    })
  ])

  console.log('✅ Materiales creados:', materiales.length)

  // Crear algunos items de construcción
  const items = await Promise.all([
    prisma.item.create({
      data: {
        nombre: 'Pared de Ladrillo 0.15m',
        descripcion: 'Construcción de pared de ladrillo común de 15cm de espesor',
        unidadMedida: 'M2',
        manoObraUnitaria: 250000,
        notasGenerales: 'Incluye mortero de pega y revoque grueso'
      }
    }),
    prisma.item.create({
      data: {
        nombre: 'Cimentación Corrida',
        descripcion: 'Cimentación en concreto ciclópeo',
        unidadMedida: 'ML',
        manoObraUnitaria: 450000,
        notasGenerales: 'Incluye excavación y concreto'
      }
    }),
    prisma.item.create({
      data: {
        nombre: 'Revoque Interno',
        descripcion: 'Revoque fino interior con cal y cemento',
        unidadMedida: 'M2',
        manoObraUnitaria: 150000,
        notasGenerales: 'Acabado liso'
      }
    })
  ])

  console.log('✅ Items creados:', items.length)

  // Crear relaciones materiales por item (matriz inteligente)
  await Promise.all([
    // Pared de Ladrillo - Materiales necesarios por m²
    prisma.materialPorItem.create({
      data: {
        itemId: items[0].id,
        materialId: materiales[1].id, // Ladrillo común
        cantidadPorUnidad: 55, // 55 ladrillos por m²
        observaciones: 'Ladrillos para pared de 15cm'
      }
    }),
    prisma.materialPorItem.create({
      data: {
        itemId: items[0].id,
        materialId: materiales[0].id, // Cemento
        cantidadPorUnidad: 0.06, // 3kg = 0.06 bolsas por m²
        observaciones: 'Cemento para mortero de pega'
      }
    }),
    prisma.materialPorItem.create({
      data: {
        itemId: items[0].id,
        materialId: materiales[3].id, // Cal
        cantidadPorUnidad: 0.2, // 5kg = 0.2 bolsas por m²
        observaciones: 'Cal para mortero de pega'
      }
    }),
    prisma.materialPorItem.create({
      data: {
        itemId: items[0].id,
        materialId: materiales[2].id, // Arena
        cantidadPorUnidad: 0.08, // 0.08 m³ por m²
        observaciones: 'Arena para mortero'
      }
    })
  ])

  console.log('✅ Relaciones materiales-items creadas')

  // Crear un usuario temporal para los proyectos
  const usuario = await prisma.user.upsert({
    where: { email: 'julio@buildmanager.com' },
    update: {},
    create: {
      email: 'julio@buildmanager.com',
      name: 'Julio Franco',
      rol: 'CONSTRUCTOR',
      telefono: '3001234567',
      empresa: 'Franco Construcciones'
    }
  })

  // Crear algunos proyectos de ejemplo
  const proyectos = await Promise.all([
    prisma.proyecto.upsert({
      where: { id: 'proyecto-mi-casa' },
      update: {},
      create: {
        id: 'proyecto-mi-casa',
        nombre: 'Mi Casa',
        descripcion: 'Construcción de casa familiar de dos pisos',
        superficieTotal: 120,
        direccion: 'Calle 123 #45-67, Bogotá',
        fechaInicio: new Date('2024-01-15'),
        fechaFinEstimada: new Date('2024-08-15'),
        estado: 'EN_PROGRESO',
        margenGanancia: 25,
        clienteNombre: 'Julio Franco',
        clienteTelefono: '3001234567',
        clienteEmail: 'julio@email.com',
        usuarioId: usuario.id
      }
    }),
    prisma.proyecto.upsert({
      where: { id: 'proyecto-casa-cliente' },
      update: {},
      create: {
        id: 'proyecto-casa-cliente',
        nombre: 'Casa Cliente López',
        descripcion: 'Remodelación integral de casa existente',
        superficieTotal: 85,
        direccion: 'Carrera 45 #12-34, Medellín',
        fechaInicio: new Date('2024-03-01'),
        fechaFinEstimada: new Date('2024-06-30'),
        estado: 'PLANIFICACION',
        margenGanancia: 20,
        clienteNombre: 'María López',
        clienteTelefono: '3009876543',
        clienteEmail: 'maria.lopez@email.com',
        usuarioId: usuario.id
      }
    })
  ])

  console.log('✅ Proyectos creados:', proyectos.length)
  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })