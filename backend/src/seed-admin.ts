import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding usuarios...');

  const usuarios = [
    {
      email: 'julio@buildmanager.com',
      name: 'Julio Franco',
      rol: 'CONSTRUCTOR',
      telefono: '3001234567',
      empresa: 'Franco Construcciones',
      password: 'Jcf3458435'
    },
    {
      email: 'franco.daniel@gmail.com',
      name: 'Oscar Daniel Franco',
      rol: 'ADMIN',
      telefono: '+595976172757',
      empresa: 'Instituto de Previsión Social',
      image: '/uploads/users/user_1765459604054.png',
      password: 'Jcf3458435'
    },
    {
      email: 'jucfra23@gmail.com',
      name: 'Julio Franco',
      rol: 'ADMIN',
      telefono: '0981574711',
      empresa: 'ThePyDeveloper',
      image: '/uploads/users/user_1765459883922.png',
      password: 'Jcf3458435'
    },
    {
      email: 'xti.cabrera@gmail.com',
      name: 'Xti Cabrera',
      rol: 'ADMIN',
      telefono: '+595971927080',
      empresa: 'Instituto de Previsión Social',
      image: '/uploads/users/user_1765462930068.png',
      password: 'Jcf3458435'
    }
  ];

  for (const userData of usuarios) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        rol: userData.rol as any,
        telefono: userData.telefono,
        empresa: userData.empresa,
        image: userData.image
      }
    });

    console.log('✅ Usuario creado:', user.email, '-', user.rol);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
