import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) { console.log("No user found"); return; }
    const newPost = await prisma.post.create({
      data: {
        authorId: user.id,
        content: '',
        images: [],
        youtubeId: null,
        guildId: null
      }
    });
    console.log("Success:", newPost.id);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
