import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏠 Creando inmuebles de prueba...');

  // Crear usuario vendedor si no existe
  const hashedPassword = await bcrypt.hash('vendedor123', 10);
  
  const vendedor = await prisma.user.upsert({
    where: { email: 'vendedor@inmuebles.com' },
    update: {},
    create: {
      email: 'vendedor@inmuebles.com',
      password: hashedPassword,
      name: 'Juan Vendedor',
      rol: 'CONSTRUCTOR',
      telefono: '0981123456'
    }
  });

  // Crear inmuebles de prueba
  const inmuebles = [
    {
      titulo: 'Casa Moderna 3 Dormitorios - Asunción',
      descripcion: 'Hermosa casa moderna con acabados de primera calidad. Ubicada en zona residencial tranquila con fácil acceso a centros comerciales y colegios.',
      tipo: 'VENTA',
      precio: 450000000,
      direccion: 'Av. Mariscal López 1234',
      ciudad: 'Asunción',
      departamento: 'Central',
      superficie: 180,
      habitaciones: 3,
      banos: 2,
      garaje: true,
      piscina: false,
      jardin: true,
      contactoNombre: 'Juan Vendedor',
      contactoTelefono: '0981123456',
      contactoEmail: 'vendedor@inmuebles.com'
    },
    {
      titulo: 'Departamento Céntrico 2 Dormitorios',
      descripcion: 'Departamento en el corazón de Asunción, ideal para profesionales. Edificio con seguridad 24hs y amenities completos.',
      tipo: 'ALQUILER',
      precio: 3500000,
      direccion: 'Palma 567',
      ciudad: 'Asunción',
      superficie: 85,
      habitaciones: 2,
      banos: 1,
      garaje: true,
      piscina: true,
      jardin: false,
      contactoNombre: 'Juan Vendedor',
      contactoTelefono: '0981123456',
      contactoEmail: 'vendedor@inmuebles.com'
    },
    {
      titulo: 'Casa Familiar 4 Dormitorios - San Lorenzo',
      descripcion: 'Amplia casa familiar en barrio consolidado. Perfecta para familias grandes, con patio amplio y quincho.',
      tipo: 'VENTA',
      precio: 320000000,
      direccion: 'Calle Real 890',
      ciudad: 'San Lorenzo',
      departamento: 'Central',
      superficie: 220,
      habitaciones: 4,
      banos: 3,
      garaje: true,
      piscina: false,
      jardin: true,
      contactoNombre: 'Juan Vendedor',
      contactoTelefono: '0981123456'
    },
    {
      titulo: 'Duplex Moderno - Fernando de la Mora',
      descripcion: 'Duplex a estrenar con diseño contemporáneo. Excelente ubicación cerca de universidades y centros comerciales.',
      tipo: 'VENTA',
      precio: 280000000,
      direccion: 'Ruta 2 Km 15',
      ciudad: 'Fernando de la Mora',
      superficie: 140,
      habitaciones: 3,
      banos: 2,
      garaje: true,
      piscina: false,
      jardin: false,
      contactoNombre: 'Juan Vendedor',
      contactoTelefono: '0981123456'
    },
    {
      titulo: 'Casa Quinta con Piscina - Luque',
      descripcion: 'Hermosa casa quinta con amplio terreno, piscina y quincho. Ideal para descanso y entretenimiento familiar.',
      tipo: 'ALQUILER',
      precio: 4200000,
      direccion: 'Camino a Ñemby 456',
      ciudad: 'Luque',
      superficie: 300,
      habitaciones: 4,
      banos: 3,
      garaje: true,
      piscina: true,
      jardin: true,
      contactoNombre: 'Juan Vendedor',
      contactoTelefono: '0981123456',
      contactoEmail: 'vendedor@inmuebles.com'
    }
  ];

  for (const inmuebleData of inmuebles) {
    await prisma.inmueble.create({
      data: {
        ...inmuebleData,
        usuarioId: vendedor.id,
        tipo: inmuebleData.tipo as any
      }
    });
  }

  console.log('✅ 5 inmuebles de prueba creados');
  console.log('📧 Usuario vendedor: vendedor@inmuebles.com / vendedor123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());