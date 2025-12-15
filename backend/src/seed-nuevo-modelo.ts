import { PrismaClient, UnidadMedida, TipoCalidad, Rol } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding con nuevo modelo de proveedores...\n');

  // 1. Crear usuarios
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@buildmanager.com' },
    update: {},
    create: {
      email: 'admin@buildmanager.com',
      name: 'Administrador',
      password: adminPassword,
      rol: Rol.ADMIN
    }
  });
  console.log('✅ Admin creado');

  const userPassword = await bcrypt.hash('user123', 10);
  const usuario = await prisma.user.upsert({
    where: { email: 'usuario@buildmanager.com' },
    update: {},
    create: {
      email: 'usuario@buildmanager.com',
      name: 'Usuario Demo',
      password: userPassword,
      rol: Rol.CONSTRUCTOR
    }
  });
  console.log('✅ Usuario demo creado');

  // 2. Crear proveedores
  const proveedorPassword = await bcrypt.hash('proveedor123', 10);

  const userINC = await prisma.user.upsert({
    where: { email: 'inc@proveedor.com' },
    update: {},
    create: {
      email: 'inc@proveedor.com',
      name: 'INC Paraguay',
      password: proveedorPassword,
      rol: Rol.PROVEEDOR_MATERIALES
    }
  });

  const proveedorINC = await prisma.proveedor.upsert({
    where: { usuarioId: userINC.id },
    update: {},
    create: {
      nombre: 'INC - Industria Nacional del Cemento',
      email: 'ventas@inc.com.py',
      telefono: '+595 21 123456',
      sitioWeb: 'https://inc.com.py',
      ciudad: 'Asunción',
      departamento: 'Central',
      latitud: -25.2637,
      longitud: -57.5759,
      usuarioId: userINC.id
    }
  });

  const userPetrobras = await prisma.user.upsert({
    where: { email: 'petrobras@proveedor.com' },
    update: {},
    create: {
      email: 'petrobras@proveedor.com',
      name: 'Petrobras Paraguay',
      password: proveedorPassword,
      rol: Rol.PROVEEDOR_MATERIALES
    }
  });

  const proveedorPetrobras = await prisma.proveedor.upsert({
    where: { usuarioId: userPetrobras.id },
    update: {},
    create: {
      nombre: 'Petrobras Paraguay',
      email: 'ventas@petrobras.com.py',
      telefono: '+595 21 654321',
      sitioWeb: 'https://petrobras.com.py',
      ciudad: 'Luque',
      departamento: 'Central',
      latitud: -25.2592,
      longitud: -57.4872,
      usuarioId: userPetrobras.id
    }
  });

  const userLadrillera = await prisma.user.upsert({
    where: { email: 'ladrillera@proveedor.com' },
    update: {},
    create: {
      email: 'ladrillera@proveedor.com',
      name: 'Ladrillera Itá',
      password: proveedorPassword,
      rol: Rol.PROVEEDOR_MATERIALES
    }
  });

  const proveedorLadrillera = await prisma.proveedor.upsert({
    where: { usuarioId: userLadrillera.id },
    update: {},
    create: {
      nombre: 'Ladrillera Itá',
      email: 'ventas@ladrillera-ita.com.py',
      telefono: '+595 21 789012',
      ciudad: 'Luque',
      departamento: 'Central',
      latitud: -25.2592,
      longitud: -57.4872,
      usuarioId: userLadrillera.id
    }
  });

  console.log('✅ 3 Proveedores creados\n');

  // 3. Crear categoría
  const categoria = await prisma.categoriaMaterial.upsert({
    where: { nombre: 'Construcción General' },
    update: {},
    create: {
      nombre: 'Construcción General',
      descripcion: 'Materiales básicos de construcción'
    }
  });

  // 4. Crear materiales base (sin precio)
  const cemento = await prisma.material.create({
    data: {
      nombre: 'Cemento Portland 50kg',
      descripcion: 'Cemento Portland tipo I para construcción general',
      unidad: UnidadMedida.BOLSA,
      categoriaId: categoria.id
    }
  });

  const ladrillo = await prisma.material.create({
    data: {
      nombre: 'Ladrillo Común 6 huecos',
      descripcion: 'Ladrillo común de arcilla con 6 huecos',
      unidad: UnidadMedida.UNIDAD,
      categoriaId: categoria.id
    }
  });

  const arena = await prisma.material.create({
    data: {
      nombre: 'Arena Fina',
      descripcion: 'Arena fina para mezcla y revoque',
      unidad: UnidadMedida.M3,
      categoriaId: categoria.id
    }
  });

  const hierro = await prisma.material.create({
    data: {
      nombre: 'Hierro 8mm',
      descripcion: 'Barra de hierro corrugado de 8mm',
      unidad: UnidadMedida.KG,
      categoriaId: categoria.id
    }
  });

  console.log('✅ 4 Materiales base creados\n');

  // 5. Crear ofertas de proveedores
  await prisma.ofertaProveedor.createMany({
    data: [
      // Cemento
      {
        materialId: cemento.id,
        proveedorId: proveedorINC.id,
        precio: 45000,
        tipoCalidad: TipoCalidad.PREMIUM,
        marca: 'INC Premium',
        comisionPorcentaje: 8,
        stock: true
      },
      {
        materialId: cemento.id,
        proveedorId: proveedorPetrobras.id,
        precio: 43500,
        tipoCalidad: TipoCalidad.PREMIUM,
        marca: 'Petrobras',
        comisionPorcentaje: 10,
        stock: true
      },
      // Ladrillo
      {
        materialId: ladrillo.id,
        proveedorId: proveedorLadrillera.id,
        precio: 850,
        tipoCalidad: TipoCalidad.COMUN,
        comisionPorcentaje: 5,
        stock: true
      },
      // Arena
      {
        materialId: arena.id,
        proveedorId: proveedorLadrillera.id,
        precio: 180000,
        tipoCalidad: TipoCalidad.COMUN,
        comisionPorcentaje: 10,
        stock: true
      },
      // Hierro
      {
        materialId: hierro.id,
        proveedorId: proveedorINC.id,
        precio: 7500,
        tipoCalidad: TipoCalidad.INDUSTRIAL,
        marca: 'Aceros del Paraguay',
        comisionPorcentaje: 12,
        stock: true
      }
    ]
  });

  console.log('✅ Ofertas de proveedores creadas\n');

  console.log('📊 Resumen:');
  console.log('- Admin: admin@buildmanager.com / admin123');
  console.log('- Usuario: usuario@buildmanager.com / user123');
  console.log('- Proveedor INC: inc@proveedor.com / proveedor123');
  console.log('- Proveedor Petrobras: petrobras@proveedor.com / proveedor123');
  console.log('- Proveedor Ladrillera: ladrillera@proveedor.com / proveedor123');
  console.log('\n✨ Seed completado!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
