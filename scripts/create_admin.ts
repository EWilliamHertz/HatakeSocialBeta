/**
 * Creates (or updates) the Swagyser9@gmail.com admin user.
 * Idempotent — safe to run multiple times.
 *
 * Usage: npx tsx scripts/create_admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

const EMAIL = 'Swagyser9@gmail.com';
const USERNAME = 'Swagyser9';
const PASSWORD = 'Yb07tw44!';

async function run() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const apiKey = 'hk_' + crypto.randomBytes(24).toString('hex');

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: EMAIL }, { username: USERNAME }] },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        email: EMAIL,
        username: USERNAME,
        password: passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
        apiKey: existing.apiKey ?? apiKey,
      },
    });
    console.log(`Updated existing admin user: ${updated.email}`);
    console.log(`  id: ${updated.id}`);
    console.log(`  role: ${updated.role}`);
    console.log(`  apiKey: ${updated.apiKey}`);
  } else {
    const user = await prisma.user.create({
      data: {
        email: EMAIL,
        username: USERNAME,
        password: passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
        apiKey,
      },
    });
    console.log(`Created admin user: ${user.email}`);
    console.log(`  id: ${user.id}`);
    console.log(`  apiKey: ${user.apiKey}`);
  }

  // Issue per-game API keys so the v1 endpoints work out of the box for the admin
  const games = ['MAGIC', 'POKEMON', 'ONE_PIECE', 'NARUTO', 'LORCANA', 'RIFTBOUND'] as const;
  const adminId = (await prisma.user.findUnique({ where: { email: EMAIL } }))!.id;
  for (const game of games) {
    await prisma.apiKey.upsert({
      where: { userId_game: { userId: adminId, game } },
      update: {},
      create: {
        userId: adminId,
        game,
        key: 'hk_' + crypto.randomBytes(24).toString('hex'),
      },
    });
  }
  const keys = await prisma.apiKey.findMany({ where: { userId: adminId } });
  console.log('\nPer-game API keys:');
  for (const k of keys) console.log(`  ${k.game}: ${k.key}`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
