import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      rol: true
    }
  });

  console.log('\n📋 Usuarios registrados:\n');
  users.forEach(user => {
    console.log(`${user.rol === 'ADMIN' ? '👑' : '👤'} ${user.email} - ${user.name || 'Sin nombre'} - ${user.rol}`);
  });
  console.log('');
}

listUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
