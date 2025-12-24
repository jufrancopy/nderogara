import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding proveedores...');

  const proveedores = [
    {
      nombre: 'Ladrillera Itá',
      telefono: '+595 21 789012',
      email: 'contacto@ladrilleraita.com.py'
    },
    {
      nombre: 'Petrobras Paraguay',
      telefono: '+595 21 654321',
      email: 'ventas@petrobras.com.py'
    },
    {
      nombre: 'Quidem blanditiis au',
      telefono: '+1 (719) 669-4644',
      direccion: 'Occaecat est aute co, Eius et dolore place',
      email: 'info@quidem.com'
    },
    {
      nombre: 'tembolo',
      telefono: '089147471123',
      ciudad: 'Asuncion',
      departamento: 'Central',
      email: 'contacto@tembolo.com'
    },
    {
      nombre: 'Test',
      telefono: '0981574711',
      ciudad: 'luuqe',
      departamento: 'Central',
      email: 'test@test.com'
    },
    {
      nombre: 'titi',
      telefono: '+1 (372) 748-8543',
      direccion: 'Officiis dolore even, Debitis et asperiore',
      email: 'titi@titi.com'
    },
    {
      nombre: 'Ullam irure eos ill',
      telefono: '+1 (158) 984-1672',
      email: 'contact@ullam.com'
    }
  ];

  for (const provData of proveedores) {
    // Check if provider exists
    const existingProveedor = await prisma.proveedor.findUnique({
      where: { email: provData.email }
    });

    let proveedor;
    if (existingProveedor) {
      // Update existing provider
      proveedor = await prisma.proveedor.update({
        where: { email: provData.email },
        data: {
          nombre: provData.nombre,
          telefono: provData.telefono,
          direccion: provData.direccion,
          ciudad: provData.ciudad,
          departamento: provData.departamento,
          createdAt: existingProveedor.createdAt || new Date()
        }
      });
      console.log('✅ Proveedor actualizado:', proveedor.nombre);
    } else {
      // Create new provider
      proveedor = await prisma.proveedor.create({
        data: {
          nombre: provData.nombre,
          email: provData.email,
          telefono: provData.telefono,
          direccion: provData.direccion,
          ciudad: provData.ciudad,
          departamento: provData.departamento,
          createdAt: new Date()
        }
      });
      console.log('✅ Proveedor creado:', proveedor.nombre);
    }
  }

  console.log('✅ Seed de proveedores completado');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
