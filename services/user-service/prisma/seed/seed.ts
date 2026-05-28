import { PrismaClient, SubscriptionTier } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const users = [
    {
      email: 'admin@quantumhedge.ai',
      username: 'admin',
      password: await bcrypt.hash('Admin123!', 12),
      firstName: 'Admin',
      lastName: 'User',
      tier: SubscriptionTier.ENTERPRISE,
      emailVerified: true,
      kycVerified: true,
      kycLevel: 3,
    },
    {
      email: 'vip@example.com',
      username: 'vip_trader',
      password: await bcrypt.hash('Vip123!', 12),
      firstName: 'VIP',
      lastName: 'Trader',
      tier: SubscriptionTier.VIP,
      emailVerified: true,
      kycVerified: true,
      kycLevel: 2,
    },
    {
      email: 'premium@example.com',
      username: 'premium_user',
      password: await bcrypt.hash('Premium123!', 12),
      firstName: 'Premium',
      lastName: 'User',
      tier: SubscriptionTier.PREMIUM,
      emailVerified: true,
    },
    {
      email: 'free@example.com',
      username: 'free_user',
      password: await bcrypt.hash('Free123!', 12),
      firstName: 'Free',
      lastName: 'User',
      tier: SubscriptionTier.FREE,
      emailVerified: true,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`✅ Created user: ${user.email} (${user.tier})`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
