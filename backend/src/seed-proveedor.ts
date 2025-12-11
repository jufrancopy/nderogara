import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding proveedor de materiales...');

  // Crear usuario proveedor de materiales
  const hashedPassword = await bcrypt.hash('proveedor123', 10);
  
  const proveedor = await prisma.user.create({
    data: {
      email: 'proveedor@materiales.com',
      password: hashedPassword,
      name: 'Proveedor de Materiales',
      rol: 'PROVEEDOR_MATERIALES',
      empresa: 'Materiales SA'
    }
  });

  console.log('✅ Usuario proveedor creado:', proveedor.email);

  // Obtener categorías
  const categorias = await prisma.categoriaMaterial.findMany();
  
  if (categorias.length === 0) {
    console.log('⚠️  No hay categorías. Creando categorías básicas...');
    
    const cemento = await prisma.categoriaMaterial.create({
      data: { nombre: 'Cemento y Aglomerantes', descripcion: 'Cementos y productos aglomerantes' }
    });
    
    const ladrillo = await prisma.categoriaMaterial.create({
      data: { nombre: 'Ladrillos y Bloques', descripcion: 'Materiales de mampostería' }
    });

    // Crear materiales del proveedor
    await prisma.material.create({
      data: {
        nombre: 'Cemento Portland INC 50kg',
        descripcion: 'Cemento Portland tipo I de alta calidad',
        unidad: 'BOLSA',
        categoriaId: cemento.id,
        precio: 45000,
        marca: 'INC',
        usuarioId: proveedor.id,
        imagenUrl: '/uploads/materiales/cemento.jpg'
      }
    });

    await prisma.material.create({
      data: {
        nombre: 'Ladrillo Común 6 Huecos',
        descripcion: 'Ladrillo cerámico común de 6 huecos',
        unidad: 'UNIDAD',
        categoriaId: ladrillo.id,
        precio: 850,
        marca: 'Ladrillera Central',
        usuarioId: proveedor.id,
        imagenUrl: '/uploads/materiales/ladrillo.jpg'
      }
    });

    console.log('✅ Materiales del proveedor creados');
  }

  console.log('✅ Seed completado');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
