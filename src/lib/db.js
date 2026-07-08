const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not set!');
}

const prisma = new PrismaClient();

console.log('✓ Prisma client initialized');

module.exports = { db: prisma };
