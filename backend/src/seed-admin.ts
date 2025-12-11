import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin...');

  const hashedPassword = await bcrypt.hash('Jcf3458435', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'jucfra23@gmail.com' },
    update: {},
    create: {
      email: 'jucfra23@gmail.com',
      password: hashedPassword,
      name: 'Julio Franco',
      rol: 'ADMIN'
    }
  });

  console.log('✅ Usuario admin creado:', admin.email);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
