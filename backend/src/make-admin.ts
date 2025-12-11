import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('❌ Uso: npx ts-node src/make-admin.ts tu-email@ejemplo.com');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log(`❌ Usuario con email ${email} no encontrado`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { rol: 'ADMIN' }
  });

  console.log(`✅ Usuario ${email} ahora es ADMIN`);
}

makeAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
