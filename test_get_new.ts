import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        reactions: true,
        comments: {
          include: { reactions: true, replies: true }
        }
      },
      take: 1
    });
    console.log("Success", posts.length);
  } catch (e: any) {
    console.error("Error GET:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
