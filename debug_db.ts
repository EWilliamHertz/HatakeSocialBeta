import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const opCount = await prisma.cardReference.count({ where: { game: 'ONE_PIECE' } });
  console.log('ONE PIECE CARDS:', opCount);

  const pokeCount = await prisma.cardReference.count({ where: { game: 'POKEMON' } });
  console.log('POKEMON CARDS:', pokeCount);

  const pokeSample = await prisma.cardReference.findMany({ where: { game: 'POKEMON' }, take: 5, select: { name: true, price: true } });
  console.log('POKEMON SAMPLE:', pokeSample);

  const pokePikachu = await prisma.cardReference.findMany({ where: { game: 'POKEMON', name: { contains: 'Pikachu' } }, take: 5, select: { name: true } });
  console.log('PIKACHU SEARCH:', pokePikachu);
}

check().catch(console.error).finally(() => prisma.$disconnect());
