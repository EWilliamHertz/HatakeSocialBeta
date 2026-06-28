import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const posts = await prisma.post.findMany({
      where: { guildId: null },
      include: {
        author: { select: { username: true } },
        comments: { include: { author: { select: { username: true } } }, orderBy: { createdAt: 'asc' } }
      },
      orderBy: [ { isPinned: 'desc' }, { createdAt: 'desc' } ],
      take: 50
    });
    console.log("Success, found posts:", posts.length);
  } catch (e: any) {
    console.error("Error GET:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
