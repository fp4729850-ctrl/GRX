import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.users.upsert({
    where: { email: 'admin@bricspay.com' },
    update: {},
    create: {
      email: 'admin@bricspay.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      kycStatus: 'VERIFIED',
      kycVerifiedAt: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create default partner
  const partnerApiKey = 'default-partner-api-key-' + Date.now();
  const crypto = require('crypto');
  const apiKeyHash = crypto.createHash('sha256').update(partnerApiKey).digest('hex');
  
  const partner = await prisma.partners.upsert({
    where: { apiKey: partnerApiKey },
    update: {},
    create: {
      name: 'Default Settlement Partner',
      apiKey: partnerApiKey,
      apiKeyHash,
      webhookUrl: 'https://webhook.example.com/settlement',
      ipAllowlist: JSON.stringify(['127.0.0.1', '::1']),
      supportedCurrencies: JSON.stringify(['INR', 'AED', 'RUB', 'CNY', 'USD']),
      status: 'ACTIVE',
    },
  });
  console.log('✅ Default partner created:', partner.name);
  console.log('   API Key:', partnerApiKey);

  // Create test users
  const testUsers = [
    {
      email: 'user1@test.com',
      firstName: 'Test',
      lastName: 'User 1',
      role: 'INDIVIDUAL' as const,
    },
    {
      email: 'user2@test.com',
      firstName: 'Test',
      lastName: 'User 2',
      role: 'INDIVIDUAL' as const,
    },
  ];

  for (const userData of testUsers) {
    const password = await bcrypt.hash('test123', 10);
    const user = await prisma.users.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash: password,
        kycStatus: 'PENDING',
      },
    });
    console.log('✅ Test user created:', user.email);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

