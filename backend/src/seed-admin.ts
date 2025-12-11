import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin...');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@buildmanager.com' },
    update: {},
    create: {
      email: 'admin@buildmanager.com',
      password: hashedPassword,
      name: 'Administrador',
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
